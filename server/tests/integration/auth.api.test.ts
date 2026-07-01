import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// Mock DB/Redis configs to prevent connection attempts during test load
vi.mock('../../src/config/database', () => ({
  connectDatabase: vi.fn(),
  disconnectDatabase: vi.fn(),
}));
vi.mock('../../src/config/redis', () => ({
  connectRedis: vi.fn(),
  disconnectRedis: vi.fn(),
  pingRedis: vi.fn().mockResolvedValue(true),
  getRedisClient: vi.fn().mockReturnValue({
    set: vi.fn(),
    get: vi.fn(),
    del: vi.fn(),
  }),
}));

// Mock AuthService
vi.mock('../../src/services/auth.service', () => ({
  authService: {
    register: vi.fn(),
    login: vi.fn(),
    refreshTokens: vi.fn(),
    logout: vi.fn(),
  },
}));

import { app } from '../../src/index';
import { authService } from '../../src/services/auth.service';

describe('Auth API Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('returns 201 and access token on successful registration', async () => {
      const mockResult = {
        user: { id: 'user-id-123', name: 'Alice', email: 'alice@test.com' },
        accessToken: 'access-token-jwt',
        refreshToken: 'refresh-token-jwt',
      };
      vi.mocked(authService.register).mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Alice',
          email: 'alice@test.com',
          password: 'Password123!',
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        data: {
          user: mockResult.user,
          accessToken: 'access-token-jwt',
        },
      });
      // Check set-cookie header
      const cookies = response.headers['set-cookie'] as string[];
      expect(cookies[0]).toContain('refreshToken=refresh-token-jwt');
    });

    it('returns 400 when registration body is invalid', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'not-an-email',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/login', () => {
    it('returns 200 and access token on successful login', async () => {
      const mockResult = {
        user: { id: 'user-id-123', name: 'Alice', email: 'alice@test.com' },
        accessToken: 'access-token-jwt',
        refreshToken: 'refresh-token-jwt',
      };
      vi.mocked(authService.login).mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alice@test.com',
          password: 'Password123!',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBe('access-token-jwt');
    });
  });
});
