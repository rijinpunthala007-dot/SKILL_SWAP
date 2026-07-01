import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface ISkillOffered {
  skillName: string;
  proficiency: 'Beginner' | 'Intermediate' | 'Advanced';
}

export interface ISkillWanted {
  skillName: string;
  priority: 'Low' | 'Medium' | 'High';
}

export interface IVerifiedSkill {
  skillName: string;
  verifiedBy: 'quiz' | 'peer-endorsement';
  verifiedAt: Date;
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  avatar?: string;
  bio?: string;
  skillsOffered: ISkillOffered[];
  skillsWanted: ISkillWanted[];
  verifiedSkills: IVerifiedSkill[];
  points: number;
  streakCount: number;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const skillOfferedSchema = new Schema<ISkillOffered>(
  {
    skillName: { type: String, required: true, trim: true },
    proficiency: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], required: true },
  },
  { _id: false }
);

const skillWantedSchema = new Schema<ISkillWanted>(
  {
    skillName: { type: String, required: true, trim: true },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], required: true },
  },
  { _id: false }
);

const verifiedSkillSchema = new Schema<IVerifiedSkill>(
  {
    skillName: { type: String, required: true, trim: true },
    verifiedBy: { type: String, enum: ['quiz', 'peer-endorsement'], required: true },
    verifiedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    avatar: { type: String },
    bio: { type: String, maxlength: 500 },
    skillsOffered: { type: [skillOfferedSchema], default: [] },
    skillsWanted: { type: [skillWantedSchema], default: [] },
    verifiedSkills: { type: [verifiedSkillSchema], default: [] },
    points: { type: Number, default: 0 },
    streakCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// ----- Indexes -----
// Matching queries filter on these constantly
userSchema.index({ 'skillsOffered.skillName': 1 });
userSchema.index({ 'skillsWanted.skillName': 1 });
// Powers search-by-skill/name/bio without full collection scan
userSchema.index({ name: 'text', bio: 'text', 'skillsOffered.skillName': 'text', 'skillsWanted.skillName': 'text' });

// ----- Hooks -----
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Strip password from serialized output
userSchema.set('toJSON', {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform(_doc: unknown, ret: any) {
    ret['password'] = undefined;
    return ret;
  },
});

export const UserModel: Model<IUser> = mongoose.model<IUser>('User', userSchema);
