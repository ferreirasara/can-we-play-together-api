import express from "express";
import cors from "cors";
import { gamesInCommonService } from "./service/gamesInCommon.service";
require("dotenv").config({ path: ".env" });

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
app.listen(port, () => {
  console.log(`Listening at ${process.env.NODE_ENV !== "production" ? "http://localhost:" : "https://api-sdpm-simulator.herokuapp.com:"}${port}/`);
});