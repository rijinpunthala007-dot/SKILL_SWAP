import { Request, Response } from 'express';
import { userService } from '../services/user.service';
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.getProfile(req.user!.userId);
  res.json(successResponse(user));
});

export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  const { name, bio, skillsOffered, skillsWanted } = req.body;
  const user = await userService.updateProfile(req.user!.userId, {
    name,
    bio,
    skillsOffered,
    skillsWanted,
  });
  res.json(successResponse(user));
});

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.getPublicProfile(req.params.id as string);
  res.json(successResponse(user));
});

export const searchUsers = asyncHandler(async (req: Request, res: Response) => {
  const skill = (req.query.skill as string) ?? '';
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, parseInt(req.query.limit as string) || 20);

  const result = await userService.searchUsers(skill, page, limit, req.user?.userId);
  res.json(successResponse(result.users, { pagination: result.pagination }));
});

export const getMatches = asyncHandler(async (req: Request, res: Response) => {
  const matches = await userService.getMatches(req.user!.userId);
  res.json(successResponse(matches));
});

export const uploadAvatar = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw AppError.badRequest('No file uploaded', 'NO_FILE');
  }

  const avatarUrl = await userService.uploadAvatar(
    req.user!.userId,
    req.file.path
  );

  res.json(successResponse({ avatarUrl }));
});
