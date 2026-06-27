import { Router } from 'express';
import { validateSession } from './auth.controller.js';

const router = Router();
router.post('/session', validateSession);

export { router as authRouter };