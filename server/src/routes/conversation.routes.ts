import { Router } from 'express';
import * as conversationController from '../controllers/conversation.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { sendMessageSchema } from '../schemas/validation.schemas';

const router = Router();

router.use(authenticate);

router.get('/', conversationController.getConversations);
router.get('/:conversationId/messages', conversationController.getMessages);
router.post(
  '/:conversationId/messages',
  validate(sendMessageSchema),
  conversationController.sendMessage
);
router.get('/:conversationId/messages/since', conversationController.getMessagesSince);

export default router;
