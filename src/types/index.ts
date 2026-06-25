/**
 * TYPE ARCHITECTURE NOTES — Scalability
 *
 * Multi-country: All monetary values stored as `numeric` in DB (no float precision issues).
 * Currency and locale handled via src/lib/i18n/config.ts — swap locale to expand regions.
 *
 * Teams/Corporate: `profiles.team_id` FK is in schema. TeamRole type below is ready.
 * Activate by wiring team_id into subscription checkout and RLS policies.
 *
 * Mobile app: All data mutations go through /api/v1/* routes (REST, JSON).
 * React Native app can consume identical endpoints — no GraphQL migration needed.
 *
 * Campaigns: Isolated `campaigns` table, zero coupling to core draw logic.
 * Activate by adding a campaign_id FK to draws table and a UI toggle in admin.
 */

// Future: team support
export type TeamRole = 'owner' | 'admin' | 'member';

export interface Team {
  id: string;
  name: string;
  owner_id: string;
  subscription_status: string;
  max_members: number;
  created_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: TeamRole;
  joined_at: string;
}

// Future: campaign module
export interface Campaign {
  id: string;
  title: string;
  description: string | null;
  charity_id: string;
  target_amount: number;
  raised_amount: number;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  created_at: string;
}

export type UserRole = 'subscriber' | 'admin';
export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled' | 'past_due';
export type SubscriptionPlan = 'monthly' | 'yearly';
export type PaymentStatus = 'pending' | 'paid' | 'rejected';
export type DrawStatus = 'draft' | 'simulated' | 'published';
export type DrawType = 'random' | 'algorithmic';
export type MatchType = '5-match' | '4-match' | '3-match';

export type CharityCategory =
  | 'health'
  | 'mental_health'
  | 'environment'
  | 'community'
  | 'education'
  | 'animals'
  | 'veterans'
  | 'youth';

export type DonationStatus = 'pending' | 'completed' | 'failed';

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
  team_id: string | null; // future: corporate/team membership
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
  category: CharityCategory;
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

export interface Donation {
  id: string;
  user_id: string | null;
  charity_id: string;
  amount_gbp: number;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  donor_email: string;
  donor_name: string | null;
  status: DonationStatus;
  created_at: string;
}

export interface UserNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  href: string | null;
  read_at: string | null;
  created_at: string;
}

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string | null;
  read: boolean;
  created_at: string;
  source: 'stored' | 'computed';
};
