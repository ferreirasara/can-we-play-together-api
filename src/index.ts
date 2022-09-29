import express from "express";
import cors from "cors";
import { gamesInCommonService } from "./service/gamesInCommon.service";
import DAO from "./dao/DAO";
require("dotenv").config({ path: ".env" });

if (!process.env.STEAM_API_KEY) {
  console.log("No Steam API key founded.");
  process.exit();
}

// Initialize DB
const dao = new DAO();
dao.initializeDB().then().catch(error => console.log(error));

// cron.schedule('0 0 * * sun', () => {

// });

// Create a new express application instance
const app: express.Application = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: false }));

app.get("/gamesInCommon/:username1/:username2", [
  gamesInCommonService,
])

// The port the express app will listen on
const port = process.env.PORT || 8080;

// Serve the application at the given port
app.listen(port, async () => {
  console.log(`Listening at ${process.env.NODE_ENV !== "production"
    ? `http://localhost:${port}`
    : "https://can-we-play-together.onrender.com"}`);
});

// updateGamesInDB();