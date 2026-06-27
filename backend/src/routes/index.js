import { Router } from 'express';
import { queryRouter } from '../modules/query/query.router.js';

const router = Router();
router.use('/datos', queryRouter);

export { router };
