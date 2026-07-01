import { endorsementRepository } from '../repositories/endorsement.repository';
import { userRepository } from '../repositories/user.repository';
import { gamificationService } from './gamification.service';
import { AppError } from '../utils/AppError';

export class EndorsementService {
  async endorseSkill(
    fromUserId: string,
    toUserId: string,
    skillName: string
  ): Promise<{ totalEndorsements: number; verified: boolean; pointsAwarded: number }> {
    if (fromUserId === toUserId) {
      throw AppError.badRequest('You cannot endorse your own skills', 'SELF_ENDORSEMENT_FORBIDDEN');
    }

    // Verify recipient has the skill offered
    const recipient = await userRepository.findById(toUserId);
    if (!recipient) throw AppError.notFound('Recipient user');

    const hasSkill = recipient.skillsOffered.some(
      (s) => s.skillName.toLowerCase() === skillName.toLowerCase()
    );
    if (!hasSkill) {
      throw AppError.badRequest('User does not offer this skill', 'SKILL_NOT_OFFERED');
    }

    // Check if already endorsed
    const alreadyEndorsed = await endorsementRepository.exists(fromUserId, toUserId, skillName);
    if (alreadyEndorsed) {
      throw AppError.badRequest('You have already endorsed this skill for this user', 'ALREADY_ENDORSED');
    }

    // Save endorsement
    await endorsementRepository.create({ fromUser: fromUserId, toUser: toUserId, skillName });

    // Count endorsements
    const count = await endorsementRepository.countEndorsements(toUserId, skillName);
    let verified = false;
    let pointsAwarded = 0;

    // Check if passed threshold (3 peer endorsements)
    if (count >= 3) {
      const isAlreadyVerified = recipient.verifiedSkills.some(
        (vs) => vs.skillName.toLowerCase() === skillName.toLowerCase()
      );

      if (!isAlreadyVerified) {
        await userRepository.addVerifiedSkill(toUserId, skillName, 'peer-endorsement');
        verified = true;

        // Award gamification points
        const result = await gamificationService.awardPoints(toUserId, 'quiz_passed'); // 50 points
        pointsAwarded = result.pointsAwarded;
      }
    }

    return {
      totalEndorsements: count,
      verified,
      pointsAwarded,
    };
  }
}

export const endorsementService = new EndorsementService();
