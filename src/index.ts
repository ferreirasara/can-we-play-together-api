import express from "express";
import cors from "cors";
import { gamesInCommonService } from "./service/gamesInCommon.service";
import DAO from "./dao/DAO";
import Bugsnag from '@bugsnag/js';
import BugsnagPluginExpress from '@bugsnag/plugin-express';
import { updateGamesInDB } from "./service/updateGames.service";
import { statsService } from "./service/stats.service";
require("dotenv").config({ path: ".env" });

if (!process.env.STEAM_API_KEY) {
  console.log("No Steam API key founded.");
  process.exit();
}

const dao = new DAO();
dao.initializeDB().then().catch(error => console.log(error));

try {
  Bugsnag.start({
    apiKey: process.env.BUGSNAG_API_KEY || "",
    plugins: [BugsnagPluginExpress]
  })
} catch (error: any) {
  console.log(error);
}

// cron.schedule('0 0 * * sun', () => {

// });

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
    : "https://can-we-play-together-api.onrender.com"}`);
});

updateGamesInDB();