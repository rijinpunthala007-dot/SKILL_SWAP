import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IQuestion {
  questionText: string;
  choices: string[];
  correctIndex: number;
}

export interface ISkillQuiz extends Document {
  _id: mongoose.Types.ObjectId;
  skillName: string;
  questions: IQuestion[];
  passThreshold: number;
  createdAt: Date;
  updatedAt: Date;
}

const questionSchema = new Schema<IQuestion>(
  {
    questionText: { type: String, required: true, trim: true },
    choices: { type: [String], required: true },
    correctIndex: { type: Number, required: true },
  },
  { _id: false }
);

const skillQuizSchema = new Schema<ISkillQuiz>(
  {
    skillName: { type: String, required: true, unique: true, trim: true },
    questions: { type: [questionSchema], required: true },
    passThreshold: { type: Number, required: true, default: 3 }, // number of correct answers required
  },
  { timestamps: true }
);

export const SkillQuizModel: Model<ISkillQuiz> = mongoose.model<ISkillQuiz>('SkillQuiz', skillQuizSchema);
