import { ISkillQuiz, SkillQuizModel } from '../models/SkillQuiz.model';

export class QuizRepository {
  async findBySkillName(skillName: string): Promise<ISkillQuiz | null> {
    return SkillQuizModel.findOne({
      skillName: { $regex: new RegExp(`^${skillName}$`, 'i') },
    }).exec();
  }
}

export const quizRepository = new QuizRepository();
