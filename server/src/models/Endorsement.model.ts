import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IEndorsement extends Document {
  _id: mongoose.Types.ObjectId;
  fromUser: mongoose.Types.ObjectId;
  toUser: mongoose.Types.ObjectId;
  skillName: string;
  createdAt: Date;
}

const endorsementSchema = new Schema<IEndorsement>(
  {
    fromUser: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    toUser: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    skillName: { type: String, required: true, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// One user can endorse another user's specific skill only once
endorsementSchema.index({ fromUser: 1, toUser: 1, skillName: 1 }, { unique: true });

export const EndorsementModel: Model<IEndorsement> = mongoose.model<IEndorsement>('Endorsement', endorsementSchema);
