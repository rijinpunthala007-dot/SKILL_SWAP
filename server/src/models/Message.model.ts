import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IMessage extends Document {
  _id: mongoose.Types.ObjectId;
  conversationId: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  content: string;
  attachment?: {
    url: string;
    type: string;
    name: string;
    size: number;
  };
  type?: 'text' | 'system' | 'challenge';
  readBy: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, maxlength: 5000, trim: true, default: '' },
    attachment: {
      url: { type: String },
      type: { type: String },
      name: { type: String },
      size: { type: Number },
    },
    type: { type: String, enum: ['text', 'system', 'challenge'], default: 'text' },
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

// Mandatory index — paginated chat history is the hottest query in the app.
// Descending createdAt enables efficient cursor-based pagination.
messageSchema.index({ conversationId: 1, createdAt: -1 });

export const MessageModel: Model<IMessage> = mongoose.model<IMessage>('Message', messageSchema);
