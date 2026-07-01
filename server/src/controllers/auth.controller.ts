import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse } from '../utils/apiResponse';
import { env } from '../config/env';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  const result = await authService.register(name, email, password);

  res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);

  res.status(201).json(
    successResponse({ user: result.user, accessToken: result.accessToken })
  );
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);

  res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);

  res.json(successResponse({ user: result.user, accessToken: result.accessToken }));
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken as string | undefined;
  if (!refreshToken) {
    res.status(401).json({
      success: false,
      error: { code: 'MISSING_REFRESH_TOKEN', message: 'Refresh token not provided' },
    });
    return;
  }

  const tokens = await authService.refreshTokens(refreshToken);
  res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);
  res.json(successResponse({ accessToken: tokens.accessToken }));
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken as string | undefined;
  if (refreshToken && req.user) {
    await authService.logout(req.user.userId, refreshToken);
  }

  res.clearCookie('refreshToken');
  res.json(successResponse({ message: 'Logged out successfully' }));
});
