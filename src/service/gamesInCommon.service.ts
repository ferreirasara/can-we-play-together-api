import { intersection } from 'lodash';
import fetch from 'node-fetch';
import { OwnedGamesResponse, GameDetailsResponse, GameDetails } from '../@types/types';
import { getUserIdFromHTML, multiplayerCategories } from '../utils/utils';

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
  const gameDetailsUrl = `https://store.steampowered.com/api/appdetails?appids=${appId}`
  const response = await fetch(gameDetailsUrl);

  return await response.json();
}

const getAllGamesInCommon = async (userId1: string, userId2: string) => {
  const ownedGamesUser1: OwnedGamesResponse | undefined = await sendOwnedGamesRequest(userId1);
  const ownedGamesUser2: OwnedGamesResponse | undefined = await sendOwnedGamesRequest(userId2);

  const appIds1 = ownedGamesUser1?.response?.games?.map(cur => cur?.appid);
  const appIds2 = ownedGamesUser2?.response?.games?.map(cur => cur?.appid);

  const gamesInCommon = intersection(appIds1, appIds2);

  return gamesInCommon;
}

const getGamesDetails = async (appIds: number[]): Promise<GameDetails[]> => {
  const details: GameDetails[] = [];

  for (let i = 0; i < appIds?.length; i++) {
    const gameDetails = await sendGameDetailsRequest(appIds[i]);
    if (gameDetails) details?.push({
      categories: gameDetails[appIds[i]]?.data?.categories?.filter(cur => !!multiplayerCategories?.includes(cur.description))?.map(cur => cur?.description),
      genres: gameDetails[appIds[i]]?.data?.genres?.map(cur => cur?.description),
      header_image: gameDetails[appIds[i]]?.data?.header_image,
      name: gameDetails[appIds[i]]?.data?.name,
      short_description: gameDetails[appIds[i]]?.data?.short_description,
    });
  }

  return details;
}

export const gamesInCommonService = async (req: any, res: any, next: any) => {
  const username1 = req.params.username1;
  const username2 = req.params.username2;

  try {
    let text = await sendSteamIDRequest(username1);
    const userId1 = getUserIdFromHTML(text);
    text = await sendSteamIDRequest(username2);
    const userId2 = getUserIdFromHTML(text);

    if (!userId1) {
      res.send({ success: false, message: `Could not get steamid for username ${username1}` })
      return;
    }
    if (!userId2) {
      res.send({ success: false, message: `Could not get steamid for username ${username2}` })
      return;
    }

    const allGamesInCommon = await getAllGamesInCommon(userId1, userId2);

    if (!allGamesInCommon?.length) {
      res.send({ success: false, message: "Could not find common games." })
      return;
    }

    const allGamesInCommonDetails = allGamesInCommon ? await getGamesDetails(allGamesInCommon) : undefined;

    const multiplayerGames = allGamesInCommonDetails?.filter(game =>
      game?.categories?.some(category => multiplayerCategories.includes(category))
    );

    if (!multiplayerGames?.length) {
      res.send({ success: false, message: "Could not find multiplayer games." })
      return;
    }

    res.send({ success: true, gamesInCommon: multiplayerGames });
  } catch (error) {
    console.log(error);
    res.send({ success: false, message: `Erro: ${(error as Error).message}` });
  }
}