import mongoose, { Document, Schema, Model } from 'mongoose';

export type RequestStatus = 'pending' | 'accepted' | 'rejected';

export interface IExchangeRequest extends Document {
  _id: mongoose.Types.ObjectId;
  fromUser: mongoose.Types.ObjectId;
  toUser: mongoose.Types.ObjectId;
  status: RequestStatus;
  matchedSkill: string;
  message?: string;
  createdAt: Date;
  updatedAt: Date;
}

const exchangeRequestSchema = new Schema<IExchangeRequest>(
  {
    fromUser: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    toUser: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
    matchedSkill: { type: String, required: true, trim: true },
    message: { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

// ----- Indexes -----
// Inbox (toUser's pending/accepted requests) — hottest read path
exchangeRequestSchema.index({ toUser: 1, status: 1 });
// Outbox (fromUser's sent requests)
exchangeRequestSchema.index({ fromUser: 1, status: 1 });
// Prevent duplicate pending requests between same pair
exchangeRequestSchema.index(
  { fromUser: 1, toUser: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'pending' },
  }
);

export const ExchangeRequestModel: Model<IExchangeRequest> = mongoose.model<IExchangeRequest>(
  'ExchangeRequest',
  exchangeRequestSchema
);
