import { Router } from 'express';
import * as quizController from '../controllers/quiz.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.use(authenticate);

router.get('/:skillName', quizController.getQuiz);
router.post('/:skillName/submit', quizController.submitQuiz);

export default router;
