import { Router } from 'express';
import { getClusters, getConcentracao, getOd } from './mapa.controller.js';

const router = Router();
router.get('/clusters', getClusters);
router.get('/concentracao', getConcentracao);
router.get('/od', getOd);

export { router as mapaRouter };
