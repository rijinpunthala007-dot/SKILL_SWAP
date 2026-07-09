import mongoose from 'mongoose';
import { IConversation, ConversationModel } from '../models/Conversation.model';
import { IMessage, MessageModel } from '../models/Message.model';

export class ConversationRepository {
  async findOrCreate(participantIds: string[]): Promise<IConversation> {
    const sorted = [...participantIds].sort();
    // Check if conversation already exists between these participants
    const existing = await ConversationModel.findOne({
      participants: { $all: sorted, $size: sorted.length },
    }).exec();

    if (existing) return existing;

    const conversation = new ConversationModel({ participants: sorted });
    return conversation.save();
  }

  async findById(id: string): Promise<IConversation | null> {
    return ConversationModel.findById(id)
      .populate('participants', 'name email avatar')
      .exec();
  }

  async findByParticipant(userId: string): Promise<IConversation[]> {
    return ConversationModel.find({ participants: userId })
      .populate('participants', 'name email avatar')
      .sort({ updatedAt: -1 })
      .exec();
  }

  async updateLastMessage(conversationId: string, content: string): Promise<void> {
    await ConversationModel.findByIdAndUpdate(conversationId, {
      $set: { lastMessage: content, lastMessageAt: new Date() },
    }).exec();
  }

  async isParticipant(conversationId: string, userId: string): Promise<boolean> {
    const count = await ConversationModel.countDocuments({
      _id: conversationId,
      participants: userId,
    });
    return count > 0;
  }
}

export class MessageRepository {
  /**
   * Cursor-based pagination — NOT skip/limit.
   * cursor is { createdAt, _id } of the oldest known message.
   * Returns messages older than the cursor in descending order.
   */
  async findByConversation(
    conversationId: string,
    limit: number,
    cursor?: { createdAt: Date; id: string }
  ): Promise<IMessage[]> {
    const filter: mongoose.FilterQuery<IMessage> = { conversationId };

    if (cursor) {
      filter.$or = [
        { createdAt: { $lt: cursor.createdAt } },
        { createdAt: cursor.createdAt, _id: { $lt: cursor.id } },
      ];
    }

    return MessageModel.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .populate('sender', 'name avatar')
      .exec();
  }

  async create(data: {
    conversationId: string;
    sender: string;
    content: string;
    attachment?: any;
  }): Promise<IMessage> {
    const message = new MessageModel(data);
    return message.save();
  }

  async markRead(conversationId: string, userId: string): Promise<void> {
    await MessageModel.updateMany(
      { conversationId, readBy: { $ne: userId } },
      { $addToSet: { readBy: userId } }
    ).exec();
  }

  async findSince(conversationId: string, sinceMessageId: string): Promise<IMessage[]> {
    const anchor = await MessageModel.findById(sinceMessageId).select('createdAt').exec();
    if (!anchor) return [];

    return MessageModel.find({
      conversationId,
      createdAt: { $gt: anchor.createdAt },
    })
      .sort({ createdAt: 1 })
      .populate('sender', 'name avatar')
      .exec();
  }

  async countUnread(conversationId: string, userId: string): Promise<number> {
    return MessageModel.countDocuments({
      conversationId,
      readBy: { $ne: userId },
      sender: { $ne: userId },
    });
  }
}

export const conversationRepository = new ConversationRepository();
export const messageRepository = new MessageRepository();
