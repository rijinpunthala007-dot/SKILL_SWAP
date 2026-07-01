import { EndorsementModel, IEndorsement } from '../models/Endorsement.model';

export class EndorsementRepository {
  async create(data: { fromUser: string; toUser: string; skillName: string }): Promise<IEndorsement> {
    const endorsement = new EndorsementModel(data);
    return endorsement.save();
  }

  async countEndorsements(userId: string, skillName: string): Promise<number> {
    return EndorsementModel.countDocuments({
      toUser: userId,
      skillName: { $regex: new RegExp(`^${skillName}$`, 'i') },
    });
  }

  async exists(fromUser: string, toUser: string, skillName: string): Promise<boolean> {
    return EndorsementModel.exists({
      fromUser,
      toUser,
      skillName: { $regex: new RegExp(`^${skillName}$`, 'i') },
    }).then(Boolean);
  }
}

export const endorsementRepository = new EndorsementRepository();
