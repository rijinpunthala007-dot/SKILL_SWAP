import { conversationRepository, messageRepository } from '../repositories/conversation.repository';
import { AppError } from '../utils/AppError';
import { getRedisClient } from '../config/redis';
import { logger } from '../config/logger';

const PRESENCE_TTL = 35; // seconds

export class ConversationService {
  async getUserConversations(userId: string) {
    const conversations = await conversationRepository.findByParticipant(userId);

    // Attach unread counts from Redis
    const withUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await messageRepository.countUnread(
          conv._id.toString(),
          userId
        );
        return { ...conv.toObject(), unreadCount };
      })
    );

    return withUnread;
  }

  async getMessages(
    conversationId: string,
    userId: string,
    limit: number,
    cursor?: { createdAt: Date; id: string }
  ) {
    const isParticipant = await conversationRepository.isParticipant(conversationId, userId);
    if (!isParticipant) {
      throw AppError.forbidden('Not a participant in this conversation');
    }

    const messages = await messageRepository.findByConversation(conversationId, limit, cursor);

    // Mark messages as read
    await messageRepository.markRead(conversationId, userId);

    // Reverse to return chronological order (we queried DESC for efficient cursor paging)
    return messages.reverse();
  }

  async sendMessage(conversationId: string, senderId: string, content: string, attachment?: any, type?: 'text' | 'system' | 'challenge') {
    const isParticipant = await conversationRepository.isParticipant(conversationId, senderId);
    if (!isParticipant) {
      throw AppError.forbidden('Not a participant in this conversation');
    }

    // Persist to DB FIRST — socket emit is just a UI convenience
    const message = await messageRepository.create({ conversationId, sender: senderId, content, attachment, type: type || 'text' });
    const lastMessageText = attachment ? (content || `Attached a ${attachment.type}`) : content;
    await conversationRepository.updateLastMessage(conversationId, lastMessageText);

    return message;
  }

  async getMessagesSince(conversationId: string, userId: string, sinceMessageId: string) {
    const isParticipant = await conversationRepository.isParticipant(conversationId, userId);
    if (!isParticipant) {
      throw AppError.forbidden('Not a participant in this conversation');
    }

    return messageRepository.findSince(conversationId, sinceMessageId);
  }

  async getConversationById(conversationId: string, userId: string) {
    const isParticipant = await conversationRepository.isParticipant(conversationId, userId);
    if (!isParticipant) {
      throw AppError.forbidden('Not a participant in this conversation');
    }
    const conversation = await conversationRepository.findById(conversationId);
    if (!conversation) throw AppError.notFound('Conversation');
    return conversation;
  }
}

export class PresenceService {
  private readonly redis = getRedisClient();

  async setOnline(userId: string): Promise<void> {
    try {
      await this.redis.set(`presence:${userId}`, '1', 'EX', PRESENCE_TTL);
    } catch (error) {
      logger.warn({ error, userId }, 'Failed to set presence to online');
    }
  }

  async setOffline(userId: string): Promise<void> {
    try {
      await this.redis.del(`presence:${userId}`);
    } catch (error) {
      logger.warn({ error, userId }, 'Failed to set presence to offline');
    }
  }

  async refreshPresence(userId: string): Promise<void> {
    try {
      await this.redis.expire(`presence:${userId}`, PRESENCE_TTL);
    } catch (error) {
      logger.warn({ error, userId }, 'Failed to refresh presence');
    }
  }

  async isOnline(userId: string): Promise<boolean> {
    try {
      const val = await this.redis.get(`presence:${userId}`);
      return val !== null;
    } catch (error) {
      logger.warn({ error, userId }, 'Failed to check presence. Bypassing check.');
      return false;
    }
  }

  async getOnlineStatuses(userIds: string[]): Promise<Record<string, boolean>> {
    if (userIds.length === 0) return {};
    try {
      const pipeline = this.redis.pipeline();
      userIds.forEach((id) => pipeline.exists(`presence:${id}`));
      const results = await pipeline.exec();
      const statuses: Record<string, boolean> = {};
      userIds.forEach((id, i) => {
        statuses[id] = (results?.[i]?.[1] as number) === 1;
      });
      return statuses;
    } catch (error) {
      logger.warn({ error }, 'Failed to batch get online statuses from Redis. Bypassing check.');
      const statuses: Record<string, boolean> = {};
      userIds.forEach((id) => {
        statuses[id] = false;
      });
      return statuses;
    }
  }
}

export const conversationService = new ConversationService();
export const presenceService = new PresenceService();
