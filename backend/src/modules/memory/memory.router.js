import { Router } from 'express';
import { requireAuth } from '../../middlewares/requireAuth.js';
import { deleteMemory } from './memory.controller.js';

const router = Router();
router.delete('/', requireAuth, deleteMemory);

export { router as memoryRouter };
