import { Router } from 'express';
import * as endorsementController from '../controllers/endorsement.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.use(authenticate);

router.post('/users/:userId/endorse', endorsementController.endorseSkill);

export default router;
