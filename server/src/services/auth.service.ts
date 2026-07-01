import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { getRedisClient } from '../config/redis';
import { userRepository } from '../repositories/user.repository';
import { AppError } from '../utils/AppError';
import { JwtPayload } from '../middleware/authenticate';
import crypto from 'crypto';

const REFRESH_TOKEN_PREFIX = 'refresh:';
const REFRESH_FAMILY_PREFIX = 'refresh_family:';

function generateAccessToken(payload: { userId: string; email: string }): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

function generateRefreshToken(payload: { userId: string; email: string }): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export class AuthService {
  async register(name: string, email: string, password: string) {
    const exists = await userRepository.existsByEmail(email);
    if (exists) {
      throw AppError.conflict('Email already registered', 'EMAIL_ALREADY_EXISTS');
    }

    const user = await userRepository.create({ name, email, password });

    const accessToken = generateAccessToken({ userId: user._id.toString(), email: user.email });
    const refreshToken = generateRefreshToken({ userId: user._id.toString(), email: user.email });

    await this.storeRefreshToken(user._id.toString(), refreshToken);

    return {
      user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar },
      accessToken,
      refreshToken,
    };
  }

  async login(email: string, password: string) {
    const user = await userRepository.findByEmail(email, true);
    if (!user) {
      throw AppError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw AppError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    const accessToken = generateAccessToken({ userId: user._id.toString(), email: user.email });
    const refreshToken = generateRefreshToken({ userId: user._id.toString(), email: user.email });

    await this.storeRefreshToken(user._id.toString(), refreshToken);

    return {
      user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar },
      accessToken,
      refreshToken,
    };
  }

  async refreshTokens(incomingRefreshToken: string) {
    let payload: JwtPayload;

    try {
      payload = jwt.verify(incomingRefreshToken, env.JWT_REFRESH_SECRET) as JwtPayload;
    } catch {
      throw AppError.unauthorized('Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN');
    }

    const redis = getRedisClient();
    const tokenHash = hashToken(incomingRefreshToken);
    const familyKey = `${REFRESH_FAMILY_PREFIX}${payload.userId}`;
    const tokenKey = `${REFRESH_TOKEN_PREFIX}${payload.userId}:${tokenHash}`;

    const storedToken = await redis.get(tokenKey);

    if (!storedToken) {
      // Token not found — either expired or previously used (reuse attack!)
      // Invalidate the entire token family for this user
      const familyTokens = await redis.smembers(familyKey);
      if (familyTokens.length > 0) {
        await redis.del(...familyTokens, familyKey);
      }
      throw AppError.unauthorized('Refresh token reuse detected. Please log in again.', 'TOKEN_REUSE');
    }

    // Rotate: delete old token, issue new pair
    await redis.del(tokenKey);
    await redis.srem(familyKey, tokenKey);

    const accessToken = generateAccessToken({ userId: payload.userId, email: payload.email });
    const refreshToken = generateRefreshToken({ userId: payload.userId, email: payload.email });

    await this.storeRefreshToken(payload.userId, refreshToken);

    return { accessToken, refreshToken };
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    const redis = getRedisClient();
    const tokenHash = hashToken(refreshToken);
    const tokenKey = `${REFRESH_TOKEN_PREFIX}${userId}:${tokenHash}`;
    const familyKey = `${REFRESH_FAMILY_PREFIX}${userId}`;

    await redis.del(tokenKey);
    await redis.srem(familyKey, tokenKey);
  }

  async logoutAll(userId: string): Promise<void> {
    const redis = getRedisClient();
    const familyKey = `${REFRESH_FAMILY_PREFIX}${userId}`;
    const familyTokens = await redis.smembers(familyKey);
    if (familyTokens.length > 0) {
      await redis.del(...familyTokens, familyKey);
    }
  }

  private async storeRefreshToken(userId: string, token: string): Promise<void> {
    const redis = getRedisClient();
    const tokenHash = hashToken(token);
    const tokenKey = `${REFRESH_TOKEN_PREFIX}${userId}:${tokenHash}`;
    const familyKey = `${REFRESH_FAMILY_PREFIX}${userId}`;

    // Store with 7-day expiry matching JWT expiry
    const ttlSeconds = 7 * 24 * 60 * 60;
    await redis.set(tokenKey, '1', 'EX', ttlSeconds);
    await redis.sadd(familyKey, tokenKey);
    await redis.expire(familyKey, ttlSeconds);
  }
}

export const authService = new AuthService();
