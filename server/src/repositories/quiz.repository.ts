import { SkillQuizModel } from '../models/SkillQuiz.model';

export class QuizRepository {
  async findBySkillName(skillName: string): Promise<any | null> {
    return SkillQuizModel.findOne({
      skillName: { $regex: new RegExp(`^${skillName}$`, 'i') },
    }).lean().exec(); // .lean() returns a plain JS object, not a Mongoose document
  }
}

export const quizRepository = new QuizRepository();
