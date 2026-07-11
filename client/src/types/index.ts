// ─── Shared Types ─────────────────────────────────────────────────────────────

export interface VerifiedSkill {
  skillName: string;
  verifiedBy: 'quiz' | 'peer-endorsement';
  verifiedAt: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  skillsOffered: SkillOffered[];
  skillsWanted: SkillWanted[];
  verifiedSkills?: VerifiedSkill[];
  points?: number;
  streakCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SkillOffered {
  skillName: string;
  proficiency: 'Beginner' | 'Intermediate' | 'Advanced';
}

export interface SkillWanted {
  skillName: string;
  priority: 'Low' | 'Medium' | 'High';
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export type RequestStatus = 'pending' | 'accepted' | 'rejected';

export interface ExchangeRequest {
  _id: string;
  fromUser: User;
  toUser: User;
  status: RequestStatus;
  matchedSkill: string;
  message?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  _id: string;
  participants: User[];
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  sender: User | { _id: string; name: string; avatar?: string };
  content: string;
  attachment?: {
    url: string;
    type: string;
    name: string;
    size: number;
  };
  type?: 'text' | 'system' | 'challenge';
  readBy: string[];
  createdAt: string;
  updatedAt: string;
  // Client-only for optimistic UI
  tempId?: string;
  pending?: boolean;
  failed?: boolean;
}

export interface ScoredUser {
  user: User;
  matchScore: number;
  matchReasons: string[];
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
}

// API response wrappers
export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiError {
  success: false;
  error: { code: string; message: string };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
