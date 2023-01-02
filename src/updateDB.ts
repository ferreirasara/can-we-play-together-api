import DAO from "./dao/DAO";
import { updateGamesInDB } from "./service/updateGames.service";

const dbInit = async () => {
  const dao = new DAO();
  await dao.initializeDB().then().catch(error => console.log(error));
  await updateGamesInDB();
}

dbInit();