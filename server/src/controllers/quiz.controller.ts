import { Request, Response } from 'express';
import { quizService } from '../services/quiz.service';
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse } from '../utils/apiResponse';

export const getQuiz = asyncHandler(async (req: Request, res: Response) => {
  const skillName = req.params.skillName as string;
  const quiz = await quizService.getQuiz(skillName);

  // Security: strip correct indexes before sending to client
  const clientQuiz = {
    skillName: quiz.skillName,
    passThreshold: quiz.passThreshold,
    questions: quiz.questions.map((q: any) => ({
      questionText: q.questionText,
      choices: q.choices,
    })),
  };

  res.json(successResponse(clientQuiz));
});

export const submitQuiz = asyncHandler(async (req: Request, res: Response) => {
  const skillName = req.params.skillName as string;
  const { answers } = req.body;

  const result = await quizService.submitQuiz(
    req.user!.userId,
    skillName,
    answers
  );

  res.json(successResponse(result));
});
