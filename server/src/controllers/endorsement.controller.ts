import { Request, Response } from 'express';
import { endorsementService } from '../services/endorsement.service';
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse } from '../utils/apiResponse';

export const endorseSkill = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.params.userId as string;
  const { skillName } = req.body;

  const result = await endorsementService.endorseSkill(
    req.user!.userId,
    userId,
    skillName
  );

  res.json(successResponse(result));
});
