import { Request, Response } from 'express';
import { gamificationService } from '../services/gamification.service';
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse } from '../utils/apiResponse';

export const getLeaderboard = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  const result = await gamificationService.getLeaderboard(page, limit);

  res.json(successResponse(result));
});
