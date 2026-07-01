import { SkillOverlapStrategy, SemanticMatchingStrategy } from '../../src/services/matching.service';
import type { IUser } from '../../src/models/User.model';

// Minimal IUser factory for tests
function makeUser(overrides: Partial<IUser> = {}): IUser {
  return {
    _id: { toString: () => 'user1' },
    name: 'Test User',
    email: 'test@example.com',
    skillsOffered: [],
    skillsWanted: [],
    ...overrides,
  } as unknown as IUser;
}

describe('SkillOverlapStrategy', () => {
  const strategy = new SkillOverlapStrategy();

  it('returns 0 when there is no skill overlap', () => {
    const viewer = makeUser({
      skillsWanted: [{ skillName: 'Python', priority: 'High' }],
    });
    const candidate = makeUser({
      skillsOffered: [{ skillName: 'Java', proficiency: 'Advanced' }],
    });

    expect(strategy.score(viewer, candidate)).toBe(0);
  });

  it('scores correctly for a single high-priority match with advanced proficiency', () => {
    const viewer = makeUser({
      skillsWanted: [{ skillName: 'Python', priority: 'High' }],
    });
    const candidate = makeUser({
      skillsOffered: [{ skillName: 'Python', proficiency: 'Advanced' }],
    });

    // High priority (3) + Advanced bonus (0.5) = 3.5
    expect(strategy.score(viewer, candidate)).toBe(3.5);
  });

  it('scores reciprocal match when viewer offers what candidate wants', () => {
    const viewer = makeUser({
      skillsOffered: [{ skillName: 'React', proficiency: 'Advanced' }],
      skillsWanted: [],
    });
    const candidate = makeUser({
      skillsOffered: [],
      skillsWanted: [{ skillName: 'React', priority: 'High' }],
    });

    // Reciprocal: 2 + Advanced bonus (0.5) = 2.5
    expect(strategy.score(viewer, candidate)).toBe(2.5);
  });

  it('is case-insensitive for skill name matching', () => {
    const viewer = makeUser({
      skillsWanted: [{ skillName: 'python', priority: 'Medium' }],
    });
    const candidate = makeUser({
      skillsOffered: [{ skillName: 'PYTHON', proficiency: 'Intermediate' }],
    });

    // Medium priority (2) + Intermediate bonus (0.2) = 2.2
    expect(strategy.score(viewer, candidate)).toBe(2.2);
  });

  it('accumulates scores for multiple overlapping skills', () => {
    const viewer = makeUser({
      skillsWanted: [
        { skillName: 'Python', priority: 'High' },
        { skillName: 'React', priority: 'Low' },
      ],
    });
    const candidate = makeUser({
      skillsOffered: [
        { skillName: 'Python', proficiency: 'Beginner' },
        { skillName: 'React', proficiency: 'Advanced' },
      ],
    });

    // Python: High(3) + Beginner(0) = 3
    // React: Low(1) + Advanced(0.5) = 1.5
    // Total: 4.5
    expect(strategy.score(viewer, candidate)).toBe(4.5);
  });

  it('explain returns descriptive reasons for matches', () => {
    const viewer = makeUser({
      skillsWanted: [{ skillName: 'Python', priority: 'High' }],
    });
    const candidate = makeUser({
      _id: { toString: () => 'candidate1' },
      name: 'Alice',
      skillsOffered: [{ skillName: 'Python', proficiency: 'Advanced' }],
    } as Partial<IUser>);

    const reasons = strategy.explain(viewer, candidate);
    expect(reasons).toHaveLength(1);
    expect(reasons[0]).toContain('Python');
    expect(reasons[0]).toContain('Advanced');
  });
});

describe('SemanticMatchingStrategy', () => {
  const strategy = new SemanticMatchingStrategy();

  it('returns 0 when there is no skill overlap at all', () => {
    const viewer = makeUser({
      skillsWanted: [{ skillName: 'Python', priority: 'High' }],
    });
    const candidate = makeUser({
      skillsOffered: [{ skillName: 'Figma', proficiency: 'Advanced' }],
    });

    expect(strategy.score(viewer, candidate)).toBe(0);
  });

  it('scores exact matches highly', () => {
    const viewer = makeUser({
      skillsWanted: [{ skillName: 'Python', priority: 'High' }],
    });
    const candidate = makeUser({
      skillsOffered: [{ skillName: 'Python', proficiency: 'Advanced' }],
    });

    const score = strategy.score(viewer, candidate);
    expect(score).toBeGreaterThan(50); // should have a high score
  });

  it('handles semantic variations (like React vs ReactJS)', () => {
    const viewer = makeUser({
      skillsWanted: [{ skillName: 'React', priority: 'High' }],
    });
    const candidateA = makeUser({
      skillsOffered: [{ skillName: 'ReactJS', proficiency: 'Advanced' }],
    });
    const candidateB = makeUser({
      skillsOffered: [{ skillName: 'Python', proficiency: 'Advanced' }],
    });

    const scoreA = strategy.score(viewer, candidateA);
    const scoreB = strategy.score(viewer, candidateB);

    expect(scoreA).toBeGreaterThan(0); // React and ReactJS should match semantically
    expect(scoreB).toBe(0); // Python should not match React at all
  });

  it('explains semantic matches', () => {
    const viewer = makeUser({
      skillsWanted: [{ skillName: 'React', priority: 'High' }],
    });
    const candidate = makeUser({
      name: 'Bob',
      skillsOffered: [{ skillName: 'ReactJS', proficiency: 'Advanced' }],
    });

    const reasons = strategy.explain(viewer, candidate);
    expect(reasons.length).toBeGreaterThan(0);
    expect(reasons[0]).toContain('ReactJS');
    expect(reasons[0]).toContain('React');
  });
});
