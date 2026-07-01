import { IUser } from '../models/User.model';
import { getRedisClient } from '../config/redis';

/**
 * Strategy interface — swap in ML-based ranking later without touching calling code.
 */
export interface MatchingStrategy {
  score(viewer: IUser, candidate: IUser): number;
  explain(viewer: IUser, candidate: IUser): string[];
}

/**
 * SkillOverlapStrategy:
 * - +3 for each skill the candidate offers that the viewer wants (high priority)
 * - +2 for each skill the candidate offers that the viewer wants (medium priority)
 * - +1 for each skill the candidate offers that the viewer wants (low priority)
 * - +2 for each skill the viewer offers that the candidate wants (reciprocal)
 * - Proficiency modifier: Advanced +0.5, Intermediate +0, Beginner -0
 */
export class SkillOverlapStrategy implements MatchingStrategy {
  private readonly PRIORITY_WEIGHT: Record<string, number> = {
    High: 3,
    Medium: 2,
    Low: 1,
  };

  private readonly PROFICIENCY_BONUS: Record<string, number> = {
    Advanced: 0.5,
    Intermediate: 0.2,
    Beginner: 0,
  };

  score(viewer: IUser, candidate: IUser): number {
    let total = 0;

    // How well does candidate's supply match viewer's demand?
    for (const wanted of viewer.skillsWanted) {
      const offered = candidate.skillsOffered.find(
        (s) => s.skillName.toLowerCase() === wanted.skillName.toLowerCase()
      );
      if (offered) {
        total +=
          this.PRIORITY_WEIGHT[wanted.priority] +
          this.PROFICIENCY_BONUS[offered.proficiency];
      }
    }

    // How well does viewer's supply match candidate's demand? (reciprocal signal)
    for (const wanted of candidate.skillsWanted) {
      const offered = viewer.skillsOffered.find(
        (s) => s.skillName.toLowerCase() === wanted.skillName.toLowerCase()
      );
      if (offered) {
        total += 2 + this.PROFICIENCY_BONUS[offered.proficiency];
      }
    }

    return Math.round(total * 10) / 10;
  }

  explain(viewer: IUser, candidate: IUser): string[] {
    const matches: string[] = [];

    for (const wanted of viewer.skillsWanted) {
      const offered = candidate.skillsOffered.find(
        (s) => s.skillName.toLowerCase() === wanted.skillName.toLowerCase()
      );
      if (offered) {
        matches.push(`${candidate.name} offers ${offered.skillName} (${offered.proficiency}) — you want it`);
      }
    }

    for (const wanted of candidate.skillsWanted) {
      const offered = viewer.skillsOffered.find(
        (s) => s.skillName.toLowerCase() === wanted.skillName.toLowerCase()
      );
      if (offered) {
        matches.push(`You offer ${offered.skillName} (${offered.proficiency}) — they want it`);
      }
    }

    return matches;
  }
}

/**
 * SemanticMatchingStrategy:
 * - Uses character trigrams and token cosine similarity to measure skill overlap
 * - Robust against spelling variations, e.g. "ReactJS" matches "React"
 * - High priority wanted skills and advanced proficiency offered skills are weighted higher
 * - Reciprocal matches (viewer can help candidate) are included in the score computation
 */
export class SemanticMatchingStrategy implements MatchingStrategy {
  private getTrigrams(str: string): string[] {
    const clean = str.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (clean.length < 3) return [clean];
    const ngrams: string[] = [];
    for (let i = 0; i <= clean.length - 3; i++) {
      ngrams.push(clean.substring(i, i + 3));
    }
    // Also include the full clean word for extra weight on exact match
    ngrams.push(clean);
    return ngrams;
  }

  private buildVector(skills: Array<{ name: string; weight: number }>): Record<string, number> {
    const vector: Record<string, number> = {};
    for (const skill of skills) {
      const tokens = this.getTrigrams(skill.name);
      for (const token of tokens) {
        vector[token] = (vector[token] || 0) + skill.weight;
      }
    }
    return vector;
  }

  private cosineSimilarity(v1: Record<string, number>, v2: Record<string, number>): number {
    const intersection = Object.keys(v1).filter((k) => k in v2);
    if (intersection.length === 0) return 0;

    let dotProduct = 0;
    for (const key of intersection) {
      dotProduct += v1[key] * v2[key];
    }

    let mag1 = 0;
    for (const key of Object.keys(v1)) {
      mag1 += v1[key] * v1[key];
    }

    let mag2 = 0;
    for (const key of Object.keys(v2)) {
      mag2 += v2[key] * v2[key];
    }

    if (mag1 === 0 || mag2 === 0) return 0;
    return dotProduct / (Math.sqrt(mag1) * Math.sqrt(mag2));
  }

  score(viewer: IUser, candidate: IUser): number {
    const priorityWeights: Record<string, number> = { High: 3, Medium: 2, Low: 1 };
    const proficiencyWeights: Record<string, number> = { Advanced: 3, Intermediate: 2, Beginner: 1 };

    // 1. Viewer Wanted vs Candidate Offered
    const viewerWanted = viewer.skillsWanted.map((s) => ({
      name: s.skillName,
      weight: priorityWeights[s.priority] || 2,
    }));
    const candidateOffered = candidate.skillsOffered.map((s) => ({
      name: s.skillName,
      weight: proficiencyWeights[s.proficiency] || 2,
    }));

    const vViewerWanted = this.buildVector(viewerWanted);
    const vCandidateOffered = this.buildVector(candidateOffered);
    const score1 = this.cosineSimilarity(vViewerWanted, vCandidateOffered);

    // 2. Candidate Wanted vs Viewer Offered (Reciprocal)
    const candidateWanted = candidate.skillsWanted.map((s) => ({
      name: s.skillName,
      weight: priorityWeights[s.priority] || 2,
    }));
    const viewerOffered = viewer.skillsOffered.map((s) => ({
      name: s.skillName,
      weight: proficiencyWeights[s.proficiency] || 2,
    }));

    const vCandidateWanted = this.buildVector(candidateWanted);
    const vViewerOffered = this.buildVector(viewerOffered);
    const score2 = this.cosineSimilarity(vCandidateWanted, vViewerOffered);

    // Combine: 70% what viewer wants, 30% reciprocal match
    const finalScore = 0.7 * score1 + 0.3 * score2;

    // Convert to percentage (0 - 100) and round to 1 decimal place
    return Math.round(finalScore * 100 * 10) / 10;
  }

  explain(viewer: IUser, candidate: IUser): string[] {
    const explanation: string[] = [];
    
    // Exact or close match detection
    for (const wanted of viewer.skillsWanted) {
      for (const offered of candidate.skillsOffered) {
        const v1 = this.buildVector([{ name: wanted.skillName, weight: 1 }]);
        const v2 = this.buildVector([{ name: offered.skillName, weight: 1 }]);
        const sim = this.cosineSimilarity(v1, v2);
        
        if (sim > 0.6) {
          explanation.push(
            `${candidate.name} offers ${offered.skillName} (${offered.proficiency}) which matches your interest in ${wanted.skillName} (${Math.round(sim * 100)}% match)`
          );
        }
      }
    }

    for (const wanted of candidate.skillsWanted) {
      for (const offered of viewer.skillsOffered) {
        const v1 = this.buildVector([{ name: wanted.skillName, weight: 1 }]);
        const v2 = this.buildVector([{ name: offered.skillName, weight: 1 }]);
        const sim = this.cosineSimilarity(v1, v2);
        
        if (sim > 0.6) {
          explanation.push(
            `You offer ${offered.skillName} (${offered.proficiency}) which matches their interest in ${wanted.skillName} (${Math.round(sim * 100)}% match)`
          );
        }
      }
    }

    return explanation;
  }
}

export interface ScoredUser {
  user: IUser;
  matchScore: number;
  matchReasons: string[];
}

const MATCH_CACHE_TTL = 300; // 5 minutes

export class MatchingService {
  constructor(private readonly strategy: MatchingStrategy = new SkillOverlapStrategy()) {}

  async rankCandidates(viewer: IUser, candidates: IUser[]): Promise<ScoredUser[]> {
    const redis = getRedisClient();

    const scored = await Promise.all(
      candidates.map(async (candidate) => {
        const cacheKey = `match:${viewer._id}:${candidate._id}`;
        const cached = await redis.get(cacheKey);

        let matchScore: number;
        if (cached !== null) {
          matchScore = parseFloat(cached);
        } else {
          matchScore = this.strategy.score(viewer, candidate);
          await redis.set(cacheKey, matchScore.toString(), 'EX', MATCH_CACHE_TTL);
        }

        return {
          user: candidate,
          matchScore,
          matchReasons: this.strategy.explain(viewer, candidate),
        };
      })
    );

    return scored.sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * Returns users whose offered skills overlap with viewer's wanted skills,
   * sorted by match score descending.
   */
  async getTopMatches(viewer: IUser, allCandidates: IUser[]): Promise<ScoredUser[]> {
    const withScore = await this.rankCandidates(viewer, allCandidates);
    return withScore.filter((s) => s.matchScore > 0);
  }
}

const strategyToUse = process.env.MATCHING_STRATEGY === 'overlap'
  ? new SkillOverlapStrategy()
  : new SemanticMatchingStrategy();

export const matchingService = new MatchingService(strategyToUse);
