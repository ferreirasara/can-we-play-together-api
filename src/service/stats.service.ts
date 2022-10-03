import { Request, Response } from 'express';
import DAO from '../dao/DAO';
import Bugsnag from '@bugsnag/js';
import { flatten } from 'lodash';
import { calcContType } from '../utils/utils';

export const statsService = async (req: Request, res: Response) => {
  try {
    const dao = new DAO();
    const allGameIds = await dao.getAllGameIds();
    const allAppIds = await dao.getAllAppIds();
    const allCategories = flatten(await dao.getAllCategories());
    const categoriesContType = calcContType(allCategories)

    res.status(200).send({
      success: true,
      stats: {
        gamesCount: allGameIds?.length,
        appsCount: allAppIds?.length,
        gamesPerCategory: categoriesContType,
      }
    });
  } catch (error: any) {
    console.log(error);
    Bugsnag?.notify(error);
    res.status(500).send({ success: false, message: `Erro: ${(error as Error).message}` });
  }
}