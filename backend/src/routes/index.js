import { Router } from 'express';
import { queryRouter } from '../modules/query/query.router.js';
import { mapaRouter } from '../modules/mapa/mapa.router.js';
import { authRouter } from '../modules/auth/auth.router.js';
import { modelsRouter } from '../modules/models/models.router.js';
import { memoryRouter } from '../modules/memory/memory.router.js';
import { conversationsRouter } from '../modules/conversations/conversations.router.js';

const router = Router();
router.use('/datos', queryRouter);
router.use('/mapa', mapaRouter);
router.use('/auth', authRouter);
router.use('/models', modelsRouter);
router.use('/memory', memoryRouter);
router.use('/conversations', conversationsRouter);

export { router };
