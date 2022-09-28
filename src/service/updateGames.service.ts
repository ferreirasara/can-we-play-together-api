import fetch from 'node-fetch';
import { AllGamesResponse, GameDetails, GameDetailsResponse } from '../@types/types';
import DAO from '../dao/DAO';

const sendAllGamesRequest = async (): Promise<AllGamesResponse> => {
  const allGamesUrl = "http://api.steampowered.com/ISteamApps/GetAppList/v0002/?format=json"
  const response = await fetch(allGamesUrl);

  return await response.json();
}

const sendGameDetailsRequest = async (appId: number): Promise<GameDetailsResponse | undefined> => {
  try {
    const gameDetailsUrl = `https://store.steampowered.com/api/appdetails?appids=${appId}`
    const response = await fetch(gameDetailsUrl);

    return await response.json();
  } catch (error: any) {
    console.log(error);
    return undefined;
  }
}

const getGamesDetails = async (appId: number): Promise<GameDetails> => {
  const gameDetails = await sendGameDetailsRequest(appId);
  return {
    appId: appId,
    categories: gameDetails?.[appId]?.data?.categories?.map(cur => cur?.description) || [],
    header_image: gameDetails?.[appId]?.data?.header_image || "",
    name: gameDetails?.[appId]?.data?.name || "",
  }
}

export const updateGamesInDB = async () => {
  const dao = new DAO();
  const allGamesResponse = await sendAllGamesRequest();
  const allGamesInDB = await dao.getAllGameIds();

  const allGames = allGamesResponse?.applist?.apps?.filter(cur => !!cur?.name && !allGamesInDB?.includes(cur?.appid));
  const allGamesLength = allGames?.length;

  let inserted = 0;
  for (let i = 0; i < allGamesLength; i++) {
    // console.log(`[updateGamesInDB] ${i} of ${allGamesLength}`);
    const gameDetails = await getGamesDetails(allGames[i]?.appid);
    if (!!gameDetails?.categories?.length && !!gameDetails?.name && !!gameDetails?.header_image) {
      await dao?.insertGame(gameDetails);
      inserted++;
    } else {
      // console.log(`[updateGamesInDB] ${allGames[i]?.appid} - ${allGames[i]?.name} doesn't have details`);
    }
  }
  console.log(`[updateGamesInDB] inserted ${inserted} games!`)
}