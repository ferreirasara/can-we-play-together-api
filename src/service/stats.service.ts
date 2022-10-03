import { Request, Response } from 'express';
import DAO from '../dao/DAO';
import Bugsnag from '@bugsnag/js';

export const gamesCountService = async (req: Request, res: Response) => {
  try {
    const dao = new DAO();
    const allGameIds = await dao.getAllGameIds();
    res.status(200).send({ success: true, gamesCount: allGameIds?.length });
  } catch (error: any) {
    console.log(error);
    Bugsnag?.notify(error);
    res.status(500).send({ success: false, message: `Erro: ${(error as Error).message}` });
  }
}

export const appsCountService = async (req: Request, res: Response) => {
  try {
    const dao = new DAO();
    const allAppIds = await dao.getAllAppIds();
    res.status(200).send({ success: true, appsCount: allAppIds?.length });
  } catch (error: any) {
    console.log(error);
    Bugsnag?.notify(error);
    res.status(500).send({ success: false, message: `Erro: ${(error as Error).message}` });
  }
}