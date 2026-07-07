import { Router } from 'express';
import { requireAuth } from '../../middlewares/requireAuth.js';
import { optionalAuth } from '../../middlewares/optionalAuth.js';
import { getModels, setModel } from './models.controller.js';

const router = Router();
// GET works anonymously (returns the default) but personalizes with a token.
router.get('/', optionalAuth, getModels);
// Persisting a preference only makes sense for a known user.
router.post('/', requireAuth, setModel);

export { router as modelsRouter };
