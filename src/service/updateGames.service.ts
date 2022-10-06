import Bugsnag from '@bugsnag/js';
import { uniq } from 'lodash';
import fetch from 'node-fetch';
import { AllGamesResponse, GameDetails, GameDetailsResponse } from '../@types/types';
import DAO from '../dao/DAO';
import { sendSlackReport } from '../utils/utils';

const sendAllGamesRequest = async (): Promise<AllGamesResponse> => {
  const allGamesUrl = "https://api.steampowered.com/ISteamApps/GetAppList/v2/"
  const response = await fetch(allGamesUrl);

  return await response.json();
}

const sendGameDetailsRequest = async (appid: number): Promise<GameDetailsResponse | undefined> => {
  try {
    const gameDetailsUrl = `https://store.steampowered.com/api/appdetails?appids=${appid}`
    const response = await fetch(gameDetailsUrl);

    return await response.json();
  } catch (error: any) {
    console.log(error);
    Bugsnag?.notify(error);
    return undefined;
  }
}

export const getGamesDetailsFromAPI = async (appid: number): Promise<GameDetails> => {
  const gameDetails = await sendGameDetailsRequest(appid);
  return {
    appid: appid,
    categories: gameDetails?.[appid]?.data?.categories?.map(cur => cur?.description) || [],
    header_image: gameDetails?.[appid]?.data?.header_image || "",
    name: gameDetails?.[appid]?.data?.name || "",
  }
}

export const updateGamesInDB = async () => {
  const dao = new DAO();
  const allGamesResponse = await sendAllGamesRequest();
  const allGamesInDB = await dao.getAllGameIds();
  const allAppsInDB = await dao.getAllAppIds();
  const allExistentAppids = uniq([...allGamesInDB, ...allAppsInDB]);

  const allGames = allGamesResponse?.applist?.apps?.filter(cur => !!cur?.name && !allExistentAppids?.includes(cur?.appid));
  const allGamesLength = allGames?.length;

  if (allGamesLength === 0) return;

  sendSlackReport(`Initializing updateGamesInDB. There are ${allGamesInDB?.length} games and ${allAppsInDB?.length} apps in database. ${allGamesLength} games and app aren't on database.`);

  let newGamesInserted = 0;
  let newAppsInserted = 0;
  for (let i = 0; i < allGamesLength; i++) {
    if (i % 10 === 0) console.log(`[updateGamesInDB] ${i + 1} of ${allGamesLength}`);
    const gameDetails = await getGamesDetailsFromAPI(allGames[i]?.appid);
    if (!!gameDetails?.categories?.length && !!gameDetails?.name && !!gameDetails?.header_image) {
      await dao?.insertGame(gameDetails);
      newGamesInserted++;
    } else {
      await dao?.insertApp(allGames[i]);
      newAppsInserted++;
    }
    setTimeout(() => { }, 500);
  }
  sendSlackReport(`Finish updateGamesInDB. Inserted ${newGamesInserted} games and ${newAppsInserted} apps!`);
  console.log(`[updateGamesInDB] inserted ${newGamesInserted} games and ${newAppsInserted} apps!`)
}