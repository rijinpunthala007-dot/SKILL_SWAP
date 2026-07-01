import { Request, Response } from 'express';
import { conversationService } from '../services/conversation.service';
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse } from '../utils/apiResponse';

export const getConversations = asyncHandler(async (req: Request, res: Response) => {
  const conversations = await conversationService.getUserConversations(req.user!.userId);
  res.json(successResponse(conversations));
});

export const getMessages = asyncHandler(async (req: Request, res: Response) => {
  const conversationId = req.params.conversationId as string;
  const limit = Math.min(100, parseInt(req.query.limit as string) || 50);

  // Cursor-based pagination
  let cursor: { createdAt: Date; id: string } | undefined;
  if (req.query.cursor) {
    const decoded = Buffer.from(req.query.cursor as string, 'base64').toString('utf8');
    const { createdAt, id } = JSON.parse(decoded) as { createdAt: string; id: string };
    cursor = { createdAt: new Date(createdAt), id };
  }

  const messages = await conversationService.getMessages(
    conversationId,
    req.user!.userId,
    limit,
    cursor
  );

  // Build next cursor from oldest message in this page
  let nextCursor: string | null = null;
  if (messages.length === limit) {
    const oldest = messages[0];
    nextCursor = Buffer.from(
      JSON.stringify({ createdAt: oldest.createdAt, id: oldest._id })
    ).toString('base64');
  }

  res.json(successResponse(messages, { nextCursor }));
});

export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const conversationId = req.params.conversationId as string;
  const { content } = req.body;

  const message = await conversationService.sendMessage(
    conversationId,
    req.user!.userId,
    content
  );

  res.status(201).json(successResponse(message));
});

export const getMessagesSince = asyncHandler(async (req: Request, res: Response) => {
  const conversationId = req.params.conversationId as string;
  const { sinceId } = req.query;

  const messages = await conversationService.getMessagesSince(
    conversationId,
    req.user!.userId,
    sinceId as string
  );

  res.json(successResponse(messages));
});
