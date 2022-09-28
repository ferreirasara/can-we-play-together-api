import { intersection } from 'lodash';
import fetch from 'node-fetch';
import { OwnedGamesResponse, GameDetailsResponse, GameDetails } from '../@types/types';
import { getUserIdFromHTML, multiplayerCategories } from '../utils/utils';
import { Request, Response } from 'express';
import Rollbar from 'rollbar';
import DAO from '../dao/DAO';
require("dotenv").config({ path: ".env" });

const rollbar = new Rollbar({
  accessToken: process.env.ROLLBAR_TOKEN,
  captureUncaught: true,
  captureUnhandledRejections: true
});

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

const sendGameDetailsRequest = async (appId: number): Promise<GameDetailsResponse | undefined> => {
  try {
    const gameDetailsUrl = `https://store.steampowered.com/api/appdetails?appids=${appId}`
    const response = await fetch(gameDetailsUrl);

    return await response.json();
  } catch (error: any) {
    console.log(error);
    rollbar.error(error);

    return undefined;
  }
}

const getAllGamesInCommon = async (userId1: string, userId2: string) => {
  const ownedGamesUser1: OwnedGamesResponse | undefined = await sendOwnedGamesRequest(userId1);
  const ownedGamesUser2: OwnedGamesResponse | undefined = await sendOwnedGamesRequest(userId2);

  const appIds1 = ownedGamesUser1?.response?.games?.map(cur => cur?.appid);
  const appIds2 = ownedGamesUser2?.response?.games?.map(cur => cur?.appid);

  const gamesInCommon = intersection(appIds1, appIds2);

  return gamesInCommon;
}

export const getGamesDetails = async (appIds: number[]): Promise<GameDetails[]> => {
  const details: GameDetails[] = [];

  const dao = new DAO();
  for (let i = 0; i < appIds?.length; i++) {
    const gameDetails = await dao.getGame(appIds[i]);
    if (gameDetails) details?.push({
      appId: appIds[i],
      categories: gameDetails?.categories,
      header_image: gameDetails?.header_image,
      name: gameDetails?.name,
    });
  }

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
      rollbar.log(`[gamesInCommonService] ${message} - UserID1: ${userId1} UserID2: ${userId2}`);
      res.status(500).send({ success: false, message })
      return;
    }
    if (!userId2) {
      const message = `Could not get steamid for username ${username2}`
      rollbar.log(`[gamesInCommonService] ${message} - UserID1: ${userId1} UserID2: ${userId2}`);
      res.status(500).send({ success: false, message })
      return;
    }

    const allGamesInCommon = await getAllGamesInCommon(userId1, userId2);

    if (!allGamesInCommon?.length) {
      const message = "Could not find common games."
      rollbar.log(`[gamesInCommonService] ${message} - UserID1: ${userId1} UserID2: ${userId2}`);
      res.status(500).send({ success: false, message })
      return;
    }

    const allGamesInCommonDetails = allGamesInCommon ? await getGamesDetails(allGamesInCommon) : undefined;

    const multiplayerGames = allGamesInCommonDetails?.filter(game =>
      game?.categories?.some(category => multiplayerCategories.includes(category))
    );

    if (!multiplayerGames?.length) {
      const message = "Could not find multiplayer games."
      rollbar.log(`[gamesInCommonService] ${message} - UserID1: ${userId1} UserID2: ${userId2}`);
      res.status(500).send({ success: false, message })
      return;
    }

    res.status(200).send({ success: true, gamesInCommon: multiplayerGames });
  } catch (error: any) {
    console.log(error);
    rollbar.error(error);
    res.status(500).send({ success: false, message: `Erro: ${(error as Error).message}` });
  }
}