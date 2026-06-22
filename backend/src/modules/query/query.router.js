import { Router } from 'express';
import { queryData } from './query.controller.js';

const router = Router();
router.post('/', queryData);

export { router as queryRouter };