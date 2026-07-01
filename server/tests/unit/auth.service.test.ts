import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock repositories and Redis before importing service
vi.mock('../../src/repositories/user.repository', () => ({
  userRepository: {
    existsByEmail: vi.fn(),
    create: vi.fn(),
    findByEmail: vi.fn(),
  },
}));
vi.mock('../../src/config/redis', () => ({
  getRedisClient: vi.fn().mockReturnValue({
    set: vi.fn().mockResolvedValue('OK'),
    get: vi.fn().mockResolvedValue(null),
    del: vi.fn().mockResolvedValue(1),
    smembers: vi.fn().mockResolvedValue([]),
    sadd: vi.fn().mockResolvedValue(1),
    srem: vi.fn().mockResolvedValue(1),
    expire: vi.fn().mockResolvedValue(1),
  }),
}));
vi.mock('../../src/config/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { AuthService } from '../../src/services/auth.service';
import { userRepository } from '../../src/repositories/user.repository';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    service = new AuthService();
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('throws EMAIL_ALREADY_EXISTS when email is taken', async () => {
      vi.mocked(userRepository.existsByEmail).mockResolvedValue(true);

      await expect(service.register('Alice', 'alice@test.com', 'password123')).rejects.toMatchObject({
        code: 'EMAIL_ALREADY_EXISTS',
        statusCode: 409,
      });
    });

    it('returns user and tokens on successful registration', async () => {
      vi.mocked(userRepository.existsByEmail).mockResolvedValue(false);
      vi.mocked(userRepository.create).mockResolvedValue({
        _id: { toString: () => 'user1' },
        name: 'Alice',
        email: 'alice@test.com',
        avatar: undefined,
      } as any);

      const result = await service.register('Alice', 'alice@test.com', 'password123');

      expect(result.user.email).toBe('alice@test.com');
      expect(result.accessToken).toBeTruthy();
      expect(result.refreshToken).toBeTruthy();
    });
  });

  describe('login', () => {
    it('throws INVALID_CREDENTIALS when user not found', async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue(null);

      await expect(service.login('nobody@test.com', 'pass')).rejects.toMatchObject({
        code: 'INVALID_CREDENTIALS',
        statusCode: 401,
      });
    });

    it('throws INVALID_CREDENTIALS when password does not match', async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue({
        comparePassword: vi.fn().mockResolvedValue(false),
      } as any);

      await expect(service.login('alice@test.com', 'wrongpass')).rejects.toMatchObject({
        code: 'INVALID_CREDENTIALS',
        statusCode: 401,
      });
    });

    it('returns user and tokens on successful login', async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue({
        _id: { toString: () => 'user1' },
        name: 'Alice',
        email: 'alice@test.com',
        comparePassword: vi.fn().mockResolvedValue(true),
      } as any);

      const result = await service.login('alice@test.com', 'correctpass');

      expect(result.user.email).toBe('alice@test.com');
      expect(result.accessToken).toBeTruthy();
      expect(result.refreshToken).toBeTruthy();
    });
  });
});
