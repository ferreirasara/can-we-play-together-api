import { intersection } from 'lodash';
import fetch from 'node-fetch';
import { OwnedGamesResponse, GameDetails } from '../@types/types';
import { getUserIdFromHTML, multiplayerCategories } from '../utils/utils';
import { Request, Response } from 'express';
import DAO from '../dao/DAO';
import Bugsnag from '@bugsnag/js';
import { getGamesDetailsFromAPI } from './updateGames.service';
require("dotenv").config({ path: ".env" });


const sendSteamIDRequest = async (username: string): Promise<string> => {
  const steamIDUrl = `https://www.steamidfinder.com/lookup/${username}/`;
  const response = await fetch(steamIDUrl);

  return response?.text();
}

const sendOwnedGamesRequest = async (userId: string): Promise<OwnedGamesResponse | undefined> => {
  const ownedGamesUrl = `http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${process.env.STEAM_API_KEY}&steamid=${userId}&format=json`
  const response = await fetch(ownedGamesUrl);

  return await response.json();
}

const getAllGamesInCommon = async (userId1: string, userId2: string) => {
  const ownedGamesUser1: OwnedGamesResponse | undefined = await sendOwnedGamesRequest(userId1);
  const ownedGamesUser2: OwnedGamesResponse | undefined = await sendOwnedGamesRequest(userId2);

  const appids1 = ownedGamesUser1?.response?.games?.map(cur => cur?.appid);
  const appids2 = ownedGamesUser2?.response?.games?.map(cur => cur?.appid);

  const gamesInCommon = intersection(appids1, appids2);

  return gamesInCommon;
}

export const getGamesDetails = async (appids: number[]): Promise<GameDetails[]> => {
  const dao = new DAO();
  const details: GameDetails[] = await dao.getGames(appids);

  return details;
}

export const gamesInCommonService = async (req: Request, res: Response) => {
  const username1 = req.params.username1;
  const username2 = req.params.username2;

  try {
    let text = await sendSteamIDRequest(username1);
    const userId1 = getUserIdFromHTML(text);
    text = await sendSteamIDRequest(username2);
    const userId2 = getUserIdFromHTML(text);

    if (!userId1) {
      const message = `Could not get steamid for username ${username1}`
      Bugsnag?.notify({ errorClass: "STEAMID", errorMessage: message }, (event) => event?.addMetadata('data', { username1 }));
      res.status(500).send({ success: false, message })
      return;
    }
    if (!userId2) {
      const message = `Could not get steamid for username ${username2}`
      Bugsnag?.notify({ errorClass: "STEAMID", errorMessage: message }, (event) => event?.addMetadata('data', { username2 }));
      res.status(500).send({ success: false, message })
      return;
    }

    const allGamesInCommon = await getAllGamesInCommon(userId1, userId2);

    if (!allGamesInCommon?.length) {
      const message = "Could not find common games."
      Bugsnag?.notify({ errorClass: "COMMON_GAMES", errorMessage: message }, (event) => event?.addMetadata('data', { username1, username2 }));
      res.status(500).send({ success: false, message })
      return;
    }

    const allGamesInCommonDetails = allGamesInCommon ? await getGamesDetails(allGamesInCommon) : undefined;

    const multiplayerGames: GameDetails[] = allGamesInCommonDetails
      ?.map(game => ({ ...game, categories: game?.categories?.filter(category => multiplayerCategories?.includes(category)) }))
      ?.filter(game => game?.categories?.length)
      || []

    if (!multiplayerGames?.length) {
      const message = "Could not find multiplayer games."
      Bugsnag?.notify({ errorClass: "MULTIPLAYER_GAMES", errorMessage: message }, (event) => event?.addMetadata('data', { username1, username2 }));
      res.status(500).send({ success: false, message })
      return;
    }

    res.status(200).send({ success: true, gamesInCommon: multiplayerGames });
  } catch (error: any) {
    console.log(error);
    Bugsnag?.notify(error);
    res.status(500).send({ success: false, message: `Erro: ${(error as Error).message}` });
  }
}