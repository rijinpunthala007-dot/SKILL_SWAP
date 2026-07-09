import { userRepository } from '../repositories/user.repository';
import { UserModel, IUser } from '../models/User.model';
import { AppError } from '../utils/AppError';

const POINTS_CONFIG = {
  quiz_passed: 50,
  exchange_completed: 30,
  request_accepted: 15,
  request_sent: 10,
};

export class GamificationService {
  async awardPoints(
    userId: string,
    action: keyof typeof POINTS_CONFIG
  ): Promise<{ pointsAwarded: number; newTotal: number }> {
    const amount = POINTS_CONFIG[action];
    if (amount === undefined) throw AppError.badRequest('Invalid points action', 'INVALID_GAMIFICATION_ACTION');

    const user = await userRepository.incrementPoints(userId, amount);
    if (!user) throw AppError.notFound('User');

    return {
      pointsAwarded: amount,
      newTotal: user.points || 0,
    };
  }

  async getLeaderboard(page = 1, limit = 10): Promise<{ users: IUser[]; total: number }> {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      UserModel.find({})
        .sort({ points: -1 })
        .skip(skip)
        .limit(limit)
        .select('name email avatar points streakCount bio')
        .exec(),
      UserModel.countDocuments({}),
    ]);

    return {
      users: users as unknown as IUser[],
      total,
    };
  }
}

export const gamificationService = new GamificationService();
