import { Router } from 'express';
import * as analyticsController from '../controllers/analytics.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.use(authenticate);

router.get('/global', analyticsController.getGlobalAnalytics);
router.get('/personal', analyticsController.getPersonalAnalytics);

export default router;
