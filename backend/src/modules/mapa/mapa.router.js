import { Router } from 'express';
import { getClusters, getConcentracao, getOd, getDemografia } from './mapa.controller.js';

const router = Router();
router.get('/clusters', getClusters);
router.get('/concentracao', getConcentracao);
router.get('/od', getOd);
router.get('/demografia', getDemografia);

export { router as mapaRouter };
