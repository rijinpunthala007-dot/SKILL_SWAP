import { Request, Response } from 'express';
import { exchangeRequestService } from '../services/exchangeRequest.service';
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse } from '../utils/apiResponse';

export const sendRequest = asyncHandler(async (req: Request, res: Response) => {
  const { toUserId, matchedSkill, message } = req.body;
  const request = await exchangeRequestService.sendRequest(
    req.user!.userId,
    toUserId,
    matchedSkill,
    message
  );
  res.status(201).json(successResponse(request));
});

export const acceptRequest = asyncHandler(async (req: Request, res: Response) => {
  const request = await exchangeRequestService.acceptRequest(
    req.params.id as string,
    req.user!.userId
  );
  res.json(successResponse(request));
});

export const rejectRequest = asyncHandler(async (req: Request, res: Response) => {
  const request = await exchangeRequestService.rejectRequest(
    req.params.id as string,
    req.user!.userId
  );
  res.json(successResponse(request));
});

export const getIncoming = asyncHandler(async (req: Request, res: Response) => {
  const requests = await exchangeRequestService.getIncoming(req.user!.userId);
  res.json(successResponse(requests));
});

export const getOutgoing = asyncHandler(async (req: Request, res: Response) => {
  const requests = await exchangeRequestService.getOutgoing(req.user!.userId);
  res.json(successResponse(requests));
});
