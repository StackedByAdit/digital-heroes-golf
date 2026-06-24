import { z } from 'zod';

export const SignupSchema = z.object({
  full_name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(72),
  charity_id: z.string().uuid(),
  charity_percentage: z.number().int().min(10).max(100),
  plan: z.enum(['monthly', 'yearly']),
});

export const ScoreSchema = z.object({
  score: z.number().int().min(1).max(45),
  score_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const ScoreUpdateSchema = ScoreSchema.extend({
  id: z.string().uuid(),
});

export const ScoreDeleteSchema = z.object({
  id: z.string().uuid(),
});

export const CheckoutSchema = z.object({
  plan: z.enum(['monthly', 'yearly']),
  charityId: z.string().uuid(),
  charityPercentage: z.number().int().min(10).max(100),
});

export const CreateDrawSchema = z.object({
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  draw_type: z.enum(['random', 'algorithmic']),
});
