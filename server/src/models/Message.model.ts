import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IMessage extends Document {
  _id: mongoose.Types.ObjectId;
  conversationId: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  content: string;
  readBy: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, maxlength: 5000, trim: true },
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

// Mandatory index — paginated chat history is the hottest query in the app.
// Descending createdAt enables efficient cursor-based pagination.
messageSchema.index({ conversationId: 1, createdAt: -1 });

export const MessageModel: Model<IMessage> = mongoose.model<IMessage>('Message', messageSchema);
