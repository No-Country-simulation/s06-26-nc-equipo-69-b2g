import { Router } from 'express';
import { requireAuth } from '../../middlewares/requireAuth.js';
import {
  getConversations,
  postConversation,
  getMessages,
  removeConversation,
} from './conversations.controller.js';

const router = Router();
router.use(requireAuth);
router.get('/', getConversations);
router.post('/', postConversation);
router.get('/:id/messages', getMessages);
router.delete('/:id', removeConversation);

export { router as conversationsRouter };
