import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { UserModel } from '../models/User.model';
import { ExchangeRequestModel } from '../models/ExchangeRequest.model';
import { MessageModel } from '../models/Message.model';
import { ConversationModel } from '../models/Conversation.model';
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse } from '../utils/apiResponse';

export const getGlobalAnalytics = asyncHandler(async (_req: Request, res: Response) => {
  const [supply, demand] = await Promise.all([
    // Skill Supply
    UserModel.aggregate([
      { $unwind: '$skillsOffered' },
      {
        $group: {
          _id: { $trim: { input: { $toLower: '$skillsOffered.skillName' } } },
          skillName: { $first: '$skillsOffered.skillName' },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]),
    // Skill Demand
    UserModel.aggregate([
      { $unwind: '$skillsWanted' },
      {
        $group: {
          _id: { $trim: { input: { $toLower: '$skillsWanted.skillName' } } },
          skillName: { $first: '$skillsWanted.skillName' },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]),
  ]);

  res.json(successResponse({ supply, demand }));
});

export const getPersonalAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const userId = new mongoose.Types.ObjectId(req.user!.userId);

  // Get conversation IDs for the user
  const userConvs = await ConversationModel.find({ participants: userId }).distinct('_id');

  const [
    requestsSent,
    requestsReceived,
    messagesSent,
    messagesReceived,
    acceptedCount,
    pendingCount,
    rejectedCount,
  ] = await Promise.all([
    ExchangeRequestModel.countDocuments({ fromUser: userId }),
    ExchangeRequestModel.countDocuments({ toUser: userId }),
    MessageModel.countDocuments({ sender: userId }),
    MessageModel.countDocuments({
      conversationId: { $in: userConvs },
      sender: { $ne: userId },
    }),
    ExchangeRequestModel.countDocuments({
      $or: [{ fromUser: userId }, { toUser: userId }],
      status: 'accepted',
    }),
    ExchangeRequestModel.countDocuments({
      $or: [{ fromUser: userId }, { toUser: userId }],
      status: 'pending',
    }),
    ExchangeRequestModel.countDocuments({
      $or: [{ fromUser: userId }, { toUser: userId }],
      status: 'rejected',
    }),
  ]);

  res.json(
    successResponse({
      requests: {
        sent: requestsSent,
        received: requestsReceived,
        accepted: acceptedCount,
        pending: pendingCount,
        rejected: rejectedCount,
      },
      messages: {
        sent: messagesSent,
        received: messagesReceived,
      },
    })
  );
});
