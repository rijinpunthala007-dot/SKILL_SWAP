import { Router } from 'express';
import * as requestController from '../controllers/exchangeRequest.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { sendRequestSchema } from '../schemas/validation.schemas';

const router = Router();

router.use(authenticate);

router.post('/', validate(sendRequestSchema), requestController.sendRequest);
router.get('/incoming', requestController.getIncoming);
router.get('/outgoing', requestController.getOutgoing);
router.patch('/:id/accept', requestController.acceptRequest);
router.patch('/:id/reject', requestController.rejectRequest);

export default router;
