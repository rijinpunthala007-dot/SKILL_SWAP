import { Router } from 'express';
import * as quizController from '../controllers/quiz.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { submitQuizSchema } from '../schemas/validation.schemas';

const router = Router();

router.use(authenticate);

router.get('/:skillName', quizController.getQuiz);
router.post('/:skillName/submit', validate(submitQuizSchema), quizController.submitQuiz);

export default router;
