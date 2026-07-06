import { Router } from 'express';
import { getModels, setModel } from './models.controller.js';

const router = Router();
router.get('/', getModels);
router.post('/', setModel);

export { router as modelsRouter };
