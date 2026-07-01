import { exchangeRequestRepository } from '../repositories/exchangeRequest.repository';
import { userRepository } from '../repositories/user.repository';
import { AppError } from '../utils/AppError';
import { internalEvents } from '../events/internalEvents';
import { IExchangeRequest } from '../models/ExchangeRequest.model';
import { gamificationService } from './gamification.service';

export class ExchangeRequestService {
  async sendRequest(
    fromUserId: string,
    toUserId: string,
    matchedSkill: string,
    message?: string
  ): Promise<IExchangeRequest> {
    if (fromUserId === toUserId) {
      throw AppError.badRequest('Cannot send exchange request to yourself', 'SELF_REQUEST');
    }

    const [fromUser, toUser] = await Promise.all([
      userRepository.findById(fromUserId),
      userRepository.findById(toUserId),
    ]);

    if (!fromUser) throw AppError.notFound('User');
    if (!toUser) throw AppError.notFound('Target user');

    // Prevent duplicate pending requests
    const existing = await exchangeRequestRepository.findExistingPending(fromUserId, toUserId);
    if (existing) {
      throw AppError.conflict(
        'A pending request to this user already exists',
        'DUPLICATE_REQUEST'
      );
    }

    const request = await exchangeRequestRepository.create({
      fromUser: fromUserId,
      toUser: toUserId,
      matchedSkill,
      message,
    });

    // Award gamification points for sending request
    await gamificationService.awardPoints(fromUserId, 'request_sent');

    return request;
  }

  async acceptRequest(requestId: string, actingUserId: string): Promise<IExchangeRequest> {
    const request = await exchangeRequestRepository.findById(requestId);

    if (!request) throw AppError.notFound('Exchange request');

    // Only the recipient can accept
    if (request.toUser._id.toString() !== actingUserId) {
      throw AppError.forbidden('Only the recipient can accept this request');
    }

    // Guard invalid state transitions
    if (request.status === 'accepted') {
      throw AppError.badRequest('Request already accepted', 'ALREADY_ACCEPTED');
    }
    if (request.status === 'rejected') {
      throw AppError.badRequest('Cannot accept a rejected request', 'INVALID_TRANSITION');
    }

    const updated = await exchangeRequestRepository.updateStatus(requestId, 'accepted');
    if (!updated) throw AppError.notFound('Exchange request');

    // Award gamification points for accepting request
    await gamificationService.awardPoints(actingUserId, 'request_accepted');

    // Event-driven side effect: create conversation + notify parties
    // Decoupled — ConversationService doesn't know about ExchangeRequest
    internalEvents.emit('request:accepted', {
      requestId,
      fromUserId: request.fromUser._id.toString(),
      toUserId: request.toUser._id.toString(),
      matchedSkill: request.matchedSkill,
    });

    return updated;
  }

  async rejectRequest(requestId: string, actingUserId: string): Promise<IExchangeRequest> {
    const request = await exchangeRequestRepository.findById(requestId);

    if (!request) throw AppError.notFound('Exchange request');

    if (request.toUser._id.toString() !== actingUserId) {
      throw AppError.forbidden('Only the recipient can reject this request');
    }

    if (request.status !== 'pending') {
      throw AppError.badRequest(
        `Cannot reject a ${request.status} request`,
        'INVALID_TRANSITION'
      );
    }

    const updated = await exchangeRequestRepository.updateStatus(requestId, 'rejected');
    if (!updated) throw AppError.notFound('Exchange request');

    return updated;
  }

  async getIncoming(userId: string) {
    return exchangeRequestRepository.findIncoming(userId);
  }

  async getOutgoing(userId: string) {
    return exchangeRequestRepository.findOutgoing(userId);
  }
}

export const exchangeRequestService = new ExchangeRequestService();
