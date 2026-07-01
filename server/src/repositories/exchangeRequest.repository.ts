import { IExchangeRequest, ExchangeRequestModel, RequestStatus } from '../models/ExchangeRequest.model';

export class ExchangeRequestRepository {
  async create(data: {
    fromUser: string;
    toUser: string;
    matchedSkill: string;
    message?: string;
  }): Promise<IExchangeRequest> {
    const request = new ExchangeRequestModel(data);
    return request.save();
  }

  async findById(id: string): Promise<IExchangeRequest | null> {
    return ExchangeRequestModel.findById(id)
      .populate('fromUser', 'name email avatar skillsOffered skillsWanted')
      .populate('toUser', 'name email avatar skillsOffered skillsWanted')
      .exec();
  }

  async findIncoming(userId: string, status?: RequestStatus): Promise<IExchangeRequest[]> {
    return ExchangeRequestModel.find({
      toUser: userId,
      ...(status ? { status } : {}),
    })
      .populate('fromUser', 'name email avatar skillsOffered skillsWanted')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOutgoing(userId: string, status?: RequestStatus): Promise<IExchangeRequest[]> {
    return ExchangeRequestModel.find({
      fromUser: userId,
      ...(status ? { status } : {}),
    })
      .populate('toUser', 'name email avatar skillsOffered skillsWanted')
      .sort({ createdAt: -1 })
      .exec();
  }

  async updateStatus(id: string, status: RequestStatus): Promise<IExchangeRequest | null> {
    return ExchangeRequestModel.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    ).exec();
  }

  async findExistingPending(fromUser: string, toUser: string): Promise<IExchangeRequest | null> {
    return ExchangeRequestModel.findOne({
      fromUser,
      toUser,
      status: 'pending',
    }).exec();
  }

  async countIncomingPending(userId: string): Promise<number> {
    return ExchangeRequestModel.countDocuments({ toUser: userId, status: 'pending' });
  }
}

export const exchangeRequestRepository = new ExchangeRequestRepository();
