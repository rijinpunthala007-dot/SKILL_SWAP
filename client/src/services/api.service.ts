import api from '../lib/api';
import type { AuthUser, User, ScoredUser, Pagination, ExchangeRequest, Conversation, Message } from '../types';

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post<{ success: true; data: { user: AuthUser; accessToken: string } }>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post<{ success: true; data: { user: AuthUser; accessToken: string } }>('/auth/login', data),

  refresh: () =>
    api.post<{ success: true; data: { accessToken: string } }>('/auth/refresh'),

  logout: () =>
    api.post('/auth/logout'),
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const usersApi = {
  getMe: () =>
    api.get<{ success: true; data: User }>('/users/me'),

  updateMe: (data: Partial<Pick<User, 'name' | 'bio' | 'avatar' | 'skillsOffered' | 'skillsWanted'>>) =>
    api.put<{ success: true; data: User }>('/users/me', data),

  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append('avatar', file);
    return api.post<{ success: true; data: { avatarUrl: string } }>('/users/me/avatar', form);
  },

  getUserById: (id: string) =>
    api.get<{ success: true; data: User }>(`/users/${id}`),

  searchUsers: (params: { skill?: string; page?: number; limit?: number }) =>
    api.get<{ success: true; data: ScoredUser[]; meta: { pagination: Pagination } }>('/users/search', { params }),

  getMatches: () =>
    api.get<{ success: true; data: ScoredUser[] }>('/users/matches'),
};

// ── Exchange Requests ─────────────────────────────────────────────────────────
export const requestsApi = {
  send: (data: { toUserId: string; matchedSkill: string; message?: string }) =>
    api.post<{ success: true; data: ExchangeRequest }>('/requests', data),

  getIncoming: () =>
    api.get<{ success: true; data: ExchangeRequest[] }>('/requests/incoming'),

  getOutgoing: () =>
    api.get<{ success: true; data: ExchangeRequest[] }>('/requests/outgoing'),

  accept: (id: string) =>
    api.patch<{ success: true; data: ExchangeRequest }>(`/requests/${id}/accept`),

  reject: (id: string) =>
    api.patch<{ success: true; data: ExchangeRequest }>(`/requests/${id}/reject`),
};

// ── Conversations ─────────────────────────────────────────────────────────────
export const conversationsApi = {
  getAll: () =>
    api.get<{ success: true; data: Conversation[] }>('/conversations'),

  getMessages: (conversationId: string, params?: { limit?: number; cursor?: string }) =>
    api.get<{ success: true; data: Message[]; meta: { nextCursor: string | null } }>(
      `/conversations/${conversationId}/messages`,
      { params }
    ),

  sendMessage: (conversationId: string, content: string) =>
    api.post<{ success: true; data: Message }>(`/conversations/${conversationId}/messages`, { content }),

  getMessagesSince: (conversationId: string, sinceId: string) =>
    api.get<{ success: true; data: Message[] }>(
      `/conversations/${conversationId}/messages/since`,
      { params: { sinceId } }
    ),
};

// ── Quizzes ──────────────────────────────────────────────────────────────────
export interface QuizQuestion {
  questionText: string;
  choices: string[];
}

export interface ClientQuiz {
  skillName: string;
  passThreshold: number;
  questions: QuizQuestion[];
}

export interface QuizSubmitResult {
  passed: boolean;
  score: number;
  totalQuestions: number;
  pointsAwarded: number;
}

export const quizzesApi = {
  getQuiz: (skillName: string) =>
    api.get<{ success: true; data: ClientQuiz }>(`/quizzes/${encodeURIComponent(skillName)}`),

  submitQuiz: (skillName: string, answers: number[]) =>
    api.post<{ success: true; data: QuizSubmitResult }>(`/quizzes/${encodeURIComponent(skillName)}/submit`, { answers }),
};

// ── Endorsements ─────────────────────────────────────────────────────────────
export interface EndorsementResult {
  totalEndorsements: number;
  verified: boolean;
  pointsAwarded: number;
}

export const endorsementsApi = {
  endorse: (userId: string, skillName: string) =>
    api.post<{ success: true; data: EndorsementResult }>(`/users/${userId}/endorse`, { skillName }),
};

// ── Leaderboard ──────────────────────────────────────────────────────────────
export const leaderboardApi = {
  getLeaderboard: (params?: { page?: number; limit?: number }) =>
    api.get<{ success: true; data: { users: User[]; total: number } }>('/leaderboard', { params }),
};

// ── Analytics ────────────────────────────────────────────────────────────────
export interface GlobalAnalytics {
  supply: Array<{ skillName: string; count: number }>;
  demand: Array<{ skillName: string; count: number }>;
}

export interface PersonalAnalytics {
  requests: {
    sent: number;
    received: number;
    accepted: number;
    pending: number;
    rejected: number;
  };
  messages: {
    sent: number;
    received: number;
  };
}

export const analyticsApi = {
  getGlobal: () =>
    api.get<{ success: true; data: GlobalAnalytics }>('/analytics/global'),

  getPersonal: () =>
    api.get<{ success: true; data: PersonalAnalytics }>('/analytics/personal'),
};
