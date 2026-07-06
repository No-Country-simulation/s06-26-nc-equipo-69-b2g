import { Router } from 'express';
import { optionalAuth } from '../../middlewares/optionalAuth.js';
import { queryData } from './query.controller.js';

const router = Router();
// Anonymous chat keeps working; a valid token unlocks per-user memory and the
// persisted model preference.
router.post('/', optionalAuth, queryData);

export { router as queryRouter };
