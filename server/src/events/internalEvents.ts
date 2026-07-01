import EventEmitter from 'events';
import { conversationRepository } from '../repositories/conversation.repository';
import { logger } from '../config/logger';

interface RequestAcceptedEvent {
  requestId: string;
  fromUserId: string;
  toUserId: string;
  matchedSkill: string;
}

class InternalEventEmitter extends EventEmitter {}
export const internalEvents = new InternalEventEmitter();

// ── Event Handlers ────────────────────────────────────────────────────────────

internalEvents.on('request:accepted', async (payload: RequestAcceptedEvent) => {
  try {
    const conversation = await conversationRepository.findOrCreate([
      payload.fromUserId,
      payload.toUserId,
    ]);

    logger.info(
      {
        requestId: payload.requestId,
        conversationId: conversation._id,
        participants: [payload.fromUserId, payload.toUserId],
      },
      'Conversation created/found after request acceptance'
    );
  } catch (error) {
    // Side-effect failures must not propagate to the HTTP response
    logger.error(
      { error, requestId: payload.requestId },
      'Failed to create conversation after request acceptance'
    );
  }
});
