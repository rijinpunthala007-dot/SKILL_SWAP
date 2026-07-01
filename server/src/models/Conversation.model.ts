import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IConversation extends Document {
  _id: mongoose.Types.ObjectId;
  participants: mongoose.Types.ObjectId[];
  lastMessage?: string;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>(
  {
    participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
    lastMessage: { type: String },
    lastMessageAt: { type: Date },
  },
  { timestamps: true }
);

// Lookup "does a conversation already exist between these two users"
conversationSchema.index({ participants: 1 });

export const ConversationModel: Model<IConversation> = mongoose.model<IConversation>(
  'Conversation',
  conversationSchema
);
