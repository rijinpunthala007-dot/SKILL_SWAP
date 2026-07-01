import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies before importing service
vi.mock('../../src/repositories/exchangeRequest.repository', () => ({
  exchangeRequestRepository: {
    findById: vi.fn(),
    create: vi.fn(),
    findExistingPending: vi.fn(),
    updateStatus: vi.fn(),
    findIncoming: vi.fn(),
    findOutgoing: vi.fn(),
  },
}));
vi.mock('../../src/repositories/user.repository', () => ({
  userRepository: {
    findById: vi.fn(),
    incrementPoints: vi.fn(),
  },
}));
vi.mock('../../src/events/internalEvents', () => ({
  internalEvents: { emit: vi.fn() },
}));
vi.mock('../../src/config/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { ExchangeRequestService } from '../../src/services/exchangeRequest.service';
import { exchangeRequestRepository } from '../../src/repositories/exchangeRequest.repository';
import { userRepository } from '../../src/repositories/user.repository';
import { internalEvents } from '../../src/events/internalEvents';
import type { IExchangeRequest } from '../../src/models/ExchangeRequest.model';

function makeRequest(overrides: Partial<IExchangeRequest> = {}): IExchangeRequest {
  return {
    _id: { toString: () => 'req1' },
    fromUser: { _id: { toString: () => 'user1' } },
    toUser: { _id: { toString: () => 'user2' } },
    status: 'pending',
    matchedSkill: 'Python',
    ...overrides,
  } as unknown as IExchangeRequest;
}

describe('ExchangeRequestService', () => {
  let service: ExchangeRequestService;

  beforeEach(() => {
    service = new ExchangeRequestService();
    vi.clearAllMocks();
    vi.mocked(userRepository.incrementPoints).mockResolvedValue({ points: 100 } as any);
  });

  describe('sendRequest', () => {
    it('throws SELF_REQUEST when fromUser === toUser', async () => {
      await expect(service.sendRequest('user1', 'user1', 'Python')).rejects.toMatchObject({
        code: 'SELF_REQUEST',
        statusCode: 400,
      });
    });

    it('throws DUPLICATE_REQUEST when pending request already exists', async () => {
      vi.mocked(userRepository.findById).mockResolvedValue({ _id: 'u1' } as any);
      vi.mocked(exchangeRequestRepository.findExistingPending).mockResolvedValue(makeRequest());

      await expect(service.sendRequest('user1', 'user2', 'Python')).rejects.toMatchObject({
        code: 'DUPLICATE_REQUEST',
        statusCode: 409,
      });
    });
  });

  describe('acceptRequest', () => {
    it('throws FORBIDDEN when non-recipient tries to accept', async () => {
      vi.mocked(exchangeRequestRepository.findById).mockResolvedValue(makeRequest());

      await expect(service.acceptRequest('req1', 'user1')).rejects.toMatchObject({
        statusCode: 403,
      });
    });

    it('throws ALREADY_ACCEPTED for double-accept', async () => {
      vi.mocked(exchangeRequestRepository.findById).mockResolvedValue(
        makeRequest({ status: 'accepted' })
      );

      await expect(service.acceptRequest('req1', 'user2')).rejects.toMatchObject({
        code: 'ALREADY_ACCEPTED',
        statusCode: 400,
      });
    });

    it('throws INVALID_TRANSITION when accepting a rejected request', async () => {
      vi.mocked(exchangeRequestRepository.findById).mockResolvedValue(
        makeRequest({ status: 'rejected' })
      );

      await expect(service.acceptRequest('req1', 'user2')).rejects.toMatchObject({
        code: 'INVALID_TRANSITION',
        statusCode: 400,
      });
    });

    it('emits request:accepted event and updates status on successful accept', async () => {
      const pending = makeRequest();
      vi.mocked(exchangeRequestRepository.findById).mockResolvedValue(pending);
      vi.mocked(exchangeRequestRepository.updateStatus).mockResolvedValue(
        makeRequest({ status: 'accepted' })
      );

      const result = await service.acceptRequest('req1', 'user2');

      expect(result.status).toBe('accepted');
      expect(internalEvents.emit).toHaveBeenCalledWith('request:accepted', expect.objectContaining({
        fromUserId: 'user1',
        toUserId: 'user2',
      }));
    });
  });

  describe('rejectRequest', () => {
    it('throws INVALID_TRANSITION when rejecting an already-accepted request', async () => {
      vi.mocked(exchangeRequestRepository.findById).mockResolvedValue(
        makeRequest({ status: 'accepted' })
      );

      await expect(service.rejectRequest('req1', 'user2')).rejects.toMatchObject({
        code: 'INVALID_TRANSITION',
        statusCode: 400,
      });
    });

    it('throws FORBIDDEN when non-recipient tries to reject', async () => {
      vi.mocked(exchangeRequestRepository.findById).mockResolvedValue(makeRequest());

      await expect(service.rejectRequest('req1', 'impostor')).rejects.toMatchObject({
        statusCode: 403,
      });
    });
  });
});
