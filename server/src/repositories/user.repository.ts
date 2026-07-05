import { FilterQuery } from 'mongoose';
import { IUser, UserModel } from '../models/User.model';

export class UserRepository {
  async findById(id: string, includePassword = false): Promise<IUser | null> {
    const query = UserModel.findById(id);
    if (includePassword) query.select('+password');
    return query.lean({ virtuals: true }).exec() as Promise<IUser | null>;
  }

  async findByEmail(email: string, includePassword = false): Promise<IUser | null> {
    const query = UserModel.findOne({ email: email.toLowerCase() });
    if (includePassword) query.select('+password');
    return query.exec();
  }

  async create(data: {
    name: string;
    email: string;
    password: string;
  }): Promise<IUser> {
    const user = new UserModel(data);
    return user.save();
  }

  async updateById(id: string, data: Partial<Omit<IUser, '_id' | 'email' | 'password' | 'createdAt' | 'updatedAt'>>): Promise<IUser | null> {
    return UserModel.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).exec();
  }

  async searchBySkill(
    query: string,
    page: number,
    limit: number,
    excludeUserId?: string
  ): Promise<{ users: IUser[]; total: number }> {
    const filter: FilterQuery<IUser> = {
      ...(excludeUserId ? { _id: { $ne: excludeUserId } } : {}),
    };

    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: 'i' } },
        { bio: { $regex: query, $options: 'i' } },
        { 'skillsOffered.skillName': { $regex: query, $options: 'i' } },
        { 'skillsWanted.skillName': { $regex: query, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      UserModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('-password')
        .exec(),
      UserModel.countDocuments(filter),
    ]);

    return { users, total };
  }

  async findBySkillsOffered(skillNames: string[], excludeUserId?: string): Promise<IUser[]> {
    return UserModel.find({
      'skillsOffered.skillName': { $in: skillNames },
      ...(excludeUserId ? { _id: { $ne: excludeUserId } } : {}),
    })
      .select('-password')
      .exec();
  }

  async findBySkillsWanted(skillNames: string[], excludeUserId?: string): Promise<IUser[]> {
    return UserModel.find({
      'skillsWanted.skillName': { $in: skillNames },
      ...(excludeUserId ? { _id: { $ne: excludeUserId } } : {}),
    })
      .select('-password')
      .exec();
  }

  async existsByEmail(email: string): Promise<boolean> {
    return UserModel.exists({ email: email.toLowerCase() }).then(Boolean);
  }

  async addVerifiedSkill(
    userId: string,
    skillName: string,
    verifiedBy: 'quiz' | 'peer-endorsement'
  ): Promise<IUser | null> {
    return UserModel.findByIdAndUpdate(
      userId,
      {
        $addToSet: {
          verifiedSkills: {
            skillName,
            verifiedBy,
            verifiedAt: new Date(),
          },
        },
      },
      { new: true }
    ).exec();
  }

  async incrementPoints(userId: string, amount: number): Promise<IUser | null> {
    return UserModel.findByIdAndUpdate(
      userId,
      { $inc: { points: amount } },
      { new: true }
    ).exec();
  }
}

export const userRepository = new UserRepository();
