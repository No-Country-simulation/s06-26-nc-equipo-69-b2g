import { Router } from 'express';
import { queryRouter } from '../modules/query/query.router.js';
import { mapaRouter } from '../modules/mapa/mapa.router.js';
import { authRouter } from '../modules/auth/auth.router.js';

const router = Router();
router.use('/datos', queryRouter);
router.use('/mapa', mapaRouter);
router.use('/auth', authRouter);

export { router };
