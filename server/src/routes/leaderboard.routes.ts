import { Router } from 'express';
import * as leaderboardController from '../controllers/leaderboard.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.use(authenticate);

router.get('/', leaderboardController.getLeaderboard);

export default router;
