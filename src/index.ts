import express from "express";
import cors from "cors";
import { gamesInCommonService } from "./service/gamesInCommon.service";
import DAO from "./dao/DAO";
import Bugsnag from '@bugsnag/js';
import BugsnagPluginExpress from '@bugsnag/plugin-express';
import { updateGamesInDB, verifyApps } from "./service/updateGames.service";
import { statsService } from "./service/stats.service";
require("dotenv").config({ path: ".env" });
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

if (!process.env.STEAM_API_KEY) {
  console.log("No Steam API key founded.");
  process.exit();
}

try {
  Bugsnag.start({
    apiKey: process.env.BUGSNAG_API_KEY || "",
    plugins: [BugsnagPluginExpress]
  })
} catch (error: any) {
  console.log(error);
}

const app: express.Application = express();

const middleware = Bugsnag.getPlugin('express')
if (middleware) app.use(middleware?.requestHandler)

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: false }));

app.get("/gamesInCommon/:username1/:username2", [
  gamesInCommonService,
])

app.get("/stats", [
  statsService,
])

if (middleware) app.use(middleware?.errorHandler)

const port = process.env.PORT || 8080;

app.listen(port, async () => {
  console.log(`Listening at ${process.env.NODE_ENV !== "production"
    ? `http://localhost:${port}`
    : "https://cwpt-api.herokuapp.com/"}`);
});

const dbInit = async () => {
  const dao = new DAO();
  await dao.initializeDB().then().catch(error => console.log(error));
  await updateGamesInDB();
}

dbInit();