import { z } from 'zod';

export const SignupSchema = z.object({
  full_name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(72),
  charity_id: z.string().uuid(),
  charity_percentage: z.number().int().min(10).max(100),
  plan: z.enum(['monthly', 'yearly']),
});

const scoreDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const [year, month, day] = value.split('-').map(Number);
    const parsed = new Date(Date.UTC(year, month - 1, day));
    return (
      parsed.getUTCFullYear() === year &&
      parsed.getUTCMonth() === month - 1 &&
      parsed.getUTCDate() === day
    );
  }, 'Invalid calendar date')
  .refine((value) => value <= new Date().toISOString().slice(0, 10), {
    message: 'Score date cannot be in the future',
  });

export const ScoreSchema = z.object({
  score: z.number().int().min(1).max(45),
  score_date: scoreDateSchema,
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

export const UpdateDrawSchema = z.object({
  draw_type: z.enum(['random', 'algorithmic']).optional(),
  regenerate_numbers: z.boolean().optional(),
});

export const CreateCharitySchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().min(10).max(5000),
  category: z
    .enum([
      'health',
      'mental_health',
      'environment',
      'community',
      'education',
      'animals',
      'veterans',
      'youth',
    ])
    .optional()
    .default('community'),
  image_url: z.string().url().optional().nullable(),
  website_url: z.string().url().optional().nullable(),
  is_featured: z.boolean().optional(),
});

export const UpdateCharitySchema = CreateCharitySchema.partial().extend({
  is_active: z.boolean().optional(),
});

export const CreateCharityEventSchema = z.object({
  title: z.string().min(2).max(200),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  description: z.string().max(2000).optional().nullable(),
});

export const UpdateCharityEventSchema = CreateCharityEventSchema.extend({
  id: z.string().uuid(),
});

export const DeleteCharityEventSchema = z.object({
  id: z.string().uuid(),
});

export const UpdateUserCharitySchema = z.object({
  charity_id: z.string().uuid(),
  charity_percentage: z.number().int().min(10).max(100),
});

export const VerifyWinnerSchema = z.object({
  draw_entry_id: z.string().uuid(),
  action: z.enum(['approve', 'reject']),
  notes: z.string().max(1000).optional(),
});

export const AdminUpdateUserSchema = z.object({
  full_name: z.string().min(2).max(100).optional(),
  subscription_status: z
    .enum(['active', 'inactive', 'cancelled', 'past_due'])
    .optional(),
  subscription_plan: z.enum(['monthly', 'yearly']).nullable().optional(),
  charity_id: z.string().uuid().nullable().optional(),
  charity_percentage: z.number().int().min(10).max(100).optional(),
});

export const AdminScoreSchema = ScoreSchema.extend({
  user_id: z.string().uuid().optional(),
});

export const AdminScoreUpdateSchema = ScoreUpdateSchema.extend({
  user_id: z.string().uuid().optional(),
});

export const AdminScoreDeleteSchema = ScoreDeleteSchema.extend({
  user_id: z.string().uuid().optional(),
});

export const DonationCheckoutSchema = z.object({
  charity_id: z.string().uuid(),
  amount_gbp: z.number().min(1).max(10000),
  donor_name: z.string().min(2).max(100).optional(),
  donor_email: z.string().email().optional(),
});
