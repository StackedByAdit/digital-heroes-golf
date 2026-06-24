export type UserRole = 'subscriber' | 'admin';
export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled' | 'past_due';
export type SubscriptionPlan = 'monthly' | 'yearly';
export type PaymentStatus = 'pending' | 'paid' | 'rejected';
export type DrawStatus = 'draft' | 'simulated' | 'published';
export type DrawType = 'random' | 'algorithmic';
export type MatchType = '5-match' | '4-match' | '3-match';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  subscription_status: SubscriptionStatus;
  subscription_plan: SubscriptionPlan | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  charity_id: string | null;
  charity_percentage: number; // 10–100
  created_at: string;
  updated_at: string;
}

export interface GolfScore {
  id: string;
  user_id: string;
  score: number; // 1–45
  score_date: string; // ISO date, unique per user
  created_at: string;
  updated_at: string;
}

export interface Charity {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  website_url: string | null;
  is_featured: boolean;
  is_active: boolean;
  upcoming_events: CharityEvent[];
  created_at: string;
}

export interface CharityEvent {
  id: string;
  charity_id: string;
  title: string;
  event_date: string;
  description: string;
}

export interface Draw {
  id: string;
  month: string; // e.g. "2025-04"
  draw_type: DrawType;
  drawn_numbers: number[]; // 5 numbers
  status: DrawStatus;
  jackpot_amount: number;
  pool_4match: number;
  pool_3match: number;
  rollover_amount: number;
  published_at: string | null;
  created_at: string;
}

export interface DrawEntry {
  id: string;
  draw_id: string;
  user_id: string;
  user_scores: number[]; // snapshot of user's 5 scores at draw time
  match_type: MatchType | null;
  prize_amount: number;
  payment_status: PaymentStatus;
  proof_url: string | null;
  verified_at: string | null;
  created_at: string;
}

export interface PrizePool {
  total: number;
  jackpot: number; // 40%
  pool_4match: number; // 35%
  pool_3match: number; // 25%
  rollover: number;
  subscriber_count: number;
}
