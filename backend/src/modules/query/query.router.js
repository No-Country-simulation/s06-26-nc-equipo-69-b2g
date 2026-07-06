import { Router } from 'express';
import { requireAuth } from '../../middlewares/requireAuth.js';
import { queryData } from './query.controller.js';

const router = Router();
// The AI chat is a logged-in feature: it spends OpenRouter tokens and is
// personalized per user (memory + preferred model). Anonymous callers get 401
// so the public endpoint can't be used to burn provider credits.
router.post('/', requireAuth, queryData);

export { router as queryRouter };
