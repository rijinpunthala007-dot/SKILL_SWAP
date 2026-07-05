import { userRepository } from '../repositories/user.repository';
import { matchingService } from './matching.service';
import { AppError } from '../utils/AppError';
import { IUser } from '../models/User.model';
import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary';
import path from 'path';
import fs from 'fs/promises';

export class UserService {
  async getProfile(userId: string): Promise<IUser> {
    const user = await userRepository.findById(userId);
    if (!user) throw AppError.notFound('User');
    return user;
  }

  async getPublicProfile(requestedId: string): Promise<IUser> {
    const user = await userRepository.findById(requestedId);
    if (!user) throw AppError.notFound('User');
    return user;
  }

  async updateProfile(
    userId: string,
    updates: {
      name?: string;
      bio?: string;
      avatar?: string;
      skillsOffered?: { skillName: string; proficiency: 'Beginner' | 'Intermediate' | 'Advanced' }[];
      skillsWanted?: { skillName: string; priority: 'Low' | 'Medium' | 'High' }[];
    }
  ): Promise<IUser> {
    const user = await userRepository.updateById(userId, updates);
    if (!user) throw AppError.notFound('User');
    return user;
  }

  async uploadAvatar(userId: string, filePath: string): Promise<string> {
    let avatarUrl: string;

    if (isCloudinaryConfigured) {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: 'skillswap/avatars',
        public_id: `user_${userId}`,
        overwrite: true,
        transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
        resource_type: 'image',
      });
      avatarUrl = result.secure_url;

      // Clean up temp file
      await fs.unlink(filePath).catch(() => {});
    } else {
      // Local fallback — serve from /uploads
      avatarUrl = `/uploads/avatars/${path.basename(filePath)}`;
    }

    await userRepository.updateById(userId, { avatar: avatarUrl });
    return avatarUrl;
  }

  async searchUsers(
    query: string,
    page: number,
    limit: number,
    viewerUserId?: string
  ) {
    const { users, total } = await userRepository.searchBySkill(
      query,
      page,
      limit,
      viewerUserId
    );

    let scored = users.map((u) => ({ user: u, matchScore: 0, matchReasons: [] as string[] }));

    if (viewerUserId) {
      const viewer = await userRepository.findById(viewerUserId);
      if (viewer) {
        scored = await matchingService.rankCandidates(viewer, users);
      }
    }

    return {
      users: scored,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
      },
    };
  }

  async getMatches(viewerUserId: string) {
    const viewer = await userRepository.findById(viewerUserId);
    if (!viewer) throw AppError.notFound('User');

    const wantedSkills = viewer.skillsWanted.map((s) => s.skillName);
    const candidates = await userRepository.findBySkillsOffered(wantedSkills, viewerUserId);

    return matchingService.getTopMatches(viewer, candidates);
  }
}

export const userService = new UserService();
