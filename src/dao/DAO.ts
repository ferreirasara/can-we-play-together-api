import { Pool } from 'pg';
import { GameDetails } from '../@types/types';

export default class DAO {

  public connect() {
    const connectionString = process.env.DATABASE_URL
    return new Pool({ connectionString, ssl: process.env.NODE_ENV !== "production" });
  }

  public async query(args: { query: string, values?: any[], caller: string }) {
    const { caller, query, values } = args;
    const client = this.connect();
    try {
      const res = await client.query(query, values);
      await client.end();
      return res;
    } catch (error) {
      console.log("Error when querying db:", error, " Caller:", caller);
      await client.end();
    }
  }

  public async initializeDB() {
    const createTableGamesQuery = `
      CREATE TABLE IF NOT EXISTS "Games" (
        "appid" INT PRIMARY KEY,
        "categories" TEXT[],
        "header_image" TEXT,
        "name" TEXT
      );
    `
    const createTableAppsQuery = `
      CREATE TABLE IF NOT EXISTS "Apps" (
        "appid" INT PRIMARY KEY,
        "name" TEXT
      );
    `
    await this.query({
      query: createTableGamesQuery,
      caller: "createTableGamesQuery"
    });
    await this.query({
      query: createTableAppsQuery,
      caller: "createTableAppsQuery"
    });
  }

  public async insertGame(args: GameDetails) {
    const { appid, categories, header_image, name } = args;

    const insertGameQuery = `
      INSERT INTO "Games" (
        "appid",
        "categories",
        "header_image",
        "name"
      )
      VALUES ($1, $2, $3, $4)
    `
    const insertGameValues = [
      appid,
      categories,
      header_image,
      name
    ]

    await this.query({ query: insertGameQuery, values: insertGameValues, caller: "insertGameQuery" });
  }

  public async insertApp(args: { appid: number, name: string }) {
    const { appid, name } = args;

    const insertAppQuery = `
      INSERT INTO "Apps" (
        "appid",
        "name"
      )
      VALUES ($1, $2)
    `
    const insertAppValues = [
      appid,
      name
    ]

    await this.query({ query: insertAppQuery, values: insertAppValues, caller: "insertAppQuery" });
  }

  public async updateGame(args: GameDetails) {
    const { appid, categories, header_image, name } = args;

    const updateGameQuery = `
      UPDATE "Games"
      SET "categories" = $2,
          "header_image" = $3,
          "name" = $4
      WHERE "appid" = $1
    `
    const updateGameValues = [
      appid,
      categories,
      header_image,
      name
    ]

    await this.query({ query: updateGameQuery, values: updateGameValues, caller: "insertGameQuery" });
  }

  public async getGame(appid: number): Promise<GameDetails> {
    const gameQuery = `
    SELECT "Games"."appid",
           "Games"."categories",
           "Games"."header_image",
           "Games"."name"
    FROM "Games"
    WHERE "Games"."appid" = $1;
    `;
    const res = await this.query({ query: gameQuery, values: [appid], caller: "getGame" });
    return res?.rows[0];
  }

  public async getAllGameIds(): Promise<number[]> {
    const allGameIdsQuery = `SELECT "Games"."appid" FROM "Games"`;
    const res = await this.query({ query: allGameIdsQuery, caller: "allGameIdsQuery" });
    return res?.rows?.map((cur: { appid: number }) => cur?.appid) || [];
  }

  public async getAllAppIds(): Promise<number[]> {
    const allAppIdsQuery = `SELECT "Apps"."appid" FROM "Apps"`;
    const res = await this.query({ query: allAppIdsQuery, caller: "allAppIdsQuery" });
    return res?.rows?.map((cur: { appid: number }) => cur?.appid) || [];
  }
}