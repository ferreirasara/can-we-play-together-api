import { Pool } from 'pg';
import { GameDetails } from '../@types/types';

export default class DAO {

  public connect() {
    const connectionString = process.env.DATABASE_URL
    if (connectionString) {
      return new Pool({ connectionString, ssl: true });
    } else {
      return new Pool();
    }
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
        "appId" INT PRIMARY KEY,
        "categories" TEXT[],
        "header_image" TEXT,
        "name" TEXT
      );
    `
    await this.query({
      query: createTableGamesQuery,
      caller: "createTableGamesQuery"
    });
  }

  public async insertGame(args: GameDetails) {
    const { appId, categories, header_image, name } = args;

    const insertGameQuery = `
      INSERT INTO "Games" (
        "appId",
        "categories",
        "header_image",
        "name"
      )
      VALUES ($1, $2, $3, $4)
    `
    const insertGameValues = [
      appId,
      categories,
      header_image,
      name
    ]

    await this.query({ query: insertGameQuery, values: insertGameValues, caller: "insertGameQuery" });
  }

  public async updateGame(args: GameDetails) {
    const { appId, categories, header_image, name } = args;

    const updateGameQuery = `
      UPDATE "Games"
      SET "categories" = $2,
          "header_image" = $3,
          "name" = $4
      WHERE "appId" = $1
    `
    const updateGameValues = [
      appId,
      categories,
      header_image,
      name
    ]

    await this.query({ query: updateGameQuery, values: updateGameValues, caller: "insertGameQuery" });
  }

  public async getGame(appId: number): Promise<GameDetails> {
    const gameQuery = `
    SELECT "Games"."appId",
           "Games"."categories",
           "Games"."header_image",
           "Games"."name"
    FROM "Games"
    WHERE "Games"."appId" = $1;
    `;
    const res = await this.query({ query: gameQuery, values: [appId], caller: "getGame" });
    return res?.rows[0];
  }

  public async getAllGameIds(): Promise<number[]> {
    const allGameIdsQuery = `SELECT "Games"."appId" FROM "Games"`;
    const res = await this.query({ query: allGameIdsQuery, caller: "allGameIdsQuery" });
    return res?.rows?.map((cur: { appId: number }) => cur?.appId) || [];
  }
}