import { z } from 'zod';

export const golfScoreSchema = z.object({
  score: z.number().int().min(1).max(45),
  score_date: z.string().date(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const signupSchema = loginSchema.extend({
  full_name: z.string().min(2),
});
