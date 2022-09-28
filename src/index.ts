import express from "express";
import cors from "cors";
import { gamesInCommonService } from "./service/gamesInCommon.service";
import * as Sentry from "@sentry/node";
import * as Tracing from "@sentry/tracing";
import DAO from "./dao/DAO";
import cron from 'node-cron';
import { updateGamesInDB } from "./service/updateGames.service";
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

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Tracing.Integrations.Express({ app }),
    ],
    tracesSampleRate: 1.0,
    environment: process.env.NODE_ENV,
  });

  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
}

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: false }));

app.get("/gamesInCommon/:username1/:username2", [
  gamesInCommonService,
])

if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.errorHandler());

  // Optional fallthrough error handler
  app.use(function onError(err: any, req: any, res: any, next: any) {
    // The error id is attached to `res.sentry` to be returned
    // and optionally displayed to the user for support.
    res.statusCode = 500;
    res.end(res.sentry + "\n");
  });
}

// The port the express app will listen on
const port = process.env.PORT || 8080;

// Serve the application at the given port
app.listen(port, async () => {
  console.log(`Listening at ${process.env.NODE_ENV !== "production"
    ? `http://localhost:${port}`
    : "https://can-we-play-together.onrender.com"}`);
});

// updateGamesInDB();