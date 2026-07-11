import { quizService } from './quiz.service';

export interface LiveChallengeState {
  challengeId: string;
  conversationId: string;
  challengerId: string;
  opponentId: string;
  skill: string;
  questions: any[];
  currentQuestionIndex: number;
  scores: Record<string, number>;
  status: 'pending' | 'active' | 'finished';
  answersSubmittedThisRound: Set<string>;
}

class LiveQuizService {
  public challenges = new Map<string, LiveChallengeState>();

  async createChallenge(
    conversationId: string,
    challengerId: string,
    opponentId: string,
    skill: string
  ): Promise<LiveChallengeState> {
    const challengeId = `quiz_${Date.now()}`;
    const state: LiveChallengeState = {
      challengeId,
      conversationId,
      challengerId,
      opponentId,
      skill,
      questions: [],
      currentQuestionIndex: 0,
      scores: {
        [challengerId]: 0,
        [opponentId]: 0,
      },
      status: 'pending',
      answersSubmittedThisRound: new Set(),
    };
    
    this.challenges.set(conversationId, state);
    return state;
  }

  getChallenge(conversationId: string): LiveChallengeState | undefined {
    return this.challenges.get(conversationId);
  }

  removeChallenge(conversationId: string) {
    this.challenges.delete(conversationId);
  }

  async startChallenge(conversationId: string) {
    const state = this.challenges.get(conversationId);
    if (!state) throw new Error('Challenge not found');

    const quiz = await quizService.getQuiz(state.skill);
    state.questions = quiz.questions;
    state.status = 'active';
    state.currentQuestionIndex = 0;
    state.answersSubmittedThisRound.clear();
    return state;
  }

  submitAnswer(conversationId: string, userId: string, answerIndex: number): boolean {
    const state = this.challenges.get(conversationId);
    if (!state || state.status !== 'active') return false;

    if (state.answersSubmittedThisRound.has(userId)) return false;

    state.answersSubmittedThisRound.add(userId);

    const currentQ = state.questions[state.currentQuestionIndex];
    // Convert to plain object if Mongoose document (belt-and-suspenders safety)
    const qObj: any = typeof currentQ.toObject === 'function' ? currentQ.toObject() : currentQ;
    if (Number(qObj.correctIndex) === Number(answerIndex)) {
      state.scores[userId] = (state.scores[userId] || 0) + 10; // 10 points per correct answer
    }

    return state.answersSubmittedThisRound.size === 2; // Returns true if both users have answered
  }

  nextRound(conversationId: string): boolean {
    const state = this.challenges.get(conversationId);
    if (!state) return false;

    state.answersSubmittedThisRound.clear();
    state.currentQuestionIndex++;

    if (state.currentQuestionIndex >= state.questions.length) {
      state.status = 'finished';
      return false; // Quiz is over
    }
    return true; // Still active
  }
}

export const liveQuizService = new LiveQuizService();
