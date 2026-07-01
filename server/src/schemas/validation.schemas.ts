import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  bio: z.string().max(500).optional(),
  skillsOffered: z
    .array(
      z.object({
        skillName: z.string().min(1).max(100).trim(),
        proficiency: z.enum(['Beginner', 'Intermediate', 'Advanced']),
      })
    )
    .max(20)
    .optional(),
  skillsWanted: z
    .array(
      z.object({
        skillName: z.string().min(1).max(100).trim(),
        priority: z.enum(['Low', 'Medium', 'High']),
      })
    )
    .max(20)
    .optional(),
});

export const sendRequestSchema = z.object({
  toUserId: z.string().min(1),
  matchedSkill: z.string().min(1).max(100).trim(),
  message: z.string().max(500).optional(),
});

export const sendMessageSchema = z.object({
  content: z.string().min(1).max(5000).trim(),
});

export const searchQuerySchema = z.object({
  skill: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
});
