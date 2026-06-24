-- Digital Heroes Golf — Supabase schema
-- Run via: supabase db push (or apply in Supabase SQL Editor)

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables (charities first — profiles references charities)
-- ---------------------------------------------------------------------------

CREATE TABLE public.charities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'community'
    CHECK (category IN (
      'health', 'mental_health', 'environment', 'community',
      'education', 'animals', 'veterans', 'youth'
    )),
  image_url text,
  website_url text,
  is_featured boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'subscriber'
    CHECK (role IN ('subscriber', 'admin')),
  subscription_status text NOT NULL DEFAULT 'inactive'
    CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'past_due')),
  subscription_plan text
    CHECK (subscription_plan IS NULL OR subscription_plan IN ('monthly', 'yearly')),
  stripe_customer_id text UNIQUE,
  stripe_subscription_id text UNIQUE,
  charity_id uuid REFERENCES public.charities (id) ON DELETE SET NULL,
  charity_percentage int NOT NULL DEFAULT 10
    CHECK (charity_percentage >= 10 AND charity_percentage <= 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.golf_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  score int NOT NULL CHECK (score >= 1 AND score <= 45),
  score_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, score_date)
);

CREATE TABLE public.donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  charity_id uuid NOT NULL REFERENCES public.charities (id) ON DELETE RESTRICT,
  amount_gbp numeric NOT NULL CHECK (amount_gbp >= 1),
  stripe_checkout_session_id text UNIQUE,
  stripe_payment_intent_id text,
  donor_email text NOT NULL,
  donor_name text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  href text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.charity_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  charity_id uuid NOT NULL REFERENCES public.charities (id) ON DELETE CASCADE,
  title text NOT NULL,
  event_date date NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.draws (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month text NOT NULL UNIQUE
    CHECK (month ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  draw_type text NOT NULL DEFAULT 'random'
    CHECK (draw_type IN ('random', 'algorithmic')),
  drawn_numbers int[] NOT NULL
    CHECK (array_length(drawn_numbers, 1) = 5),
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'simulated', 'published')),
  jackpot_amount numeric NOT NULL DEFAULT 0,
  pool_4match numeric NOT NULL DEFAULT 0,
  pool_3match numeric NOT NULL DEFAULT 0,
  rollover_amount numeric NOT NULL DEFAULT 0,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.draw_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_id uuid NOT NULL REFERENCES public.draws (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  user_scores int[] NOT NULL,
  match_type text
    CHECK (match_type IS NULL OR match_type IN ('5-match', '4-match', '3-match')),
  prize_amount numeric NOT NULL DEFAULT 0,
  payment_status text NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'paid', 'rejected')),
  proof_url text,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (draw_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

CREATE INDEX idx_profiles_role ON public.profiles (role);
CREATE INDEX idx_profiles_subscription_status ON public.profiles (subscription_status);
CREATE INDEX idx_profiles_charity_id ON public.profiles (charity_id);
CREATE INDEX idx_golf_scores_user_id ON public.golf_scores (user_id);
CREATE INDEX idx_golf_scores_score_date ON public.golf_scores (score_date);
CREATE INDEX idx_charities_category ON public.charities (category);
CREATE INDEX idx_charity_events_event_date ON public.charity_events (event_date);
CREATE INDEX idx_draws_status ON public.draws (status);
CREATE INDEX idx_draw_entries_draw_id ON public.draw_entries (draw_id);
CREATE INDEX idx_draw_entries_user_id ON public.draw_entries (user_id);
CREATE INDEX idx_draw_entries_match_type ON public.draw_entries (match_type);
CREATE INDEX idx_donations_charity_id ON public.donations (charity_id);
CREATE INDEX idx_donations_user_id ON public.donations (user_id);
CREATE INDEX idx_donations_status ON public.donations (status);
CREATE INDEX idx_user_notifications_user_id ON public.user_notifications (user_id);
CREATE INDEX idx_user_notifications_unread ON public.user_notifications (user_id, read_at)
  WHERE read_at IS NULL;

-- ---------------------------------------------------------------------------
-- Helper functions
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.calculate_prize_pools(
  subscriber_count int,
  subscription_fee numeric,
  rollover numeric DEFAULT 0
)
RETURNS TABLE (
  jackpot numeric,
  pool_4 numeric,
  pool_3 numeric
)
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT
    ((subscriber_count * subscription_fee) + rollover) * 0.40 AS jackpot,
    ((subscriber_count * subscription_fee) + rollover) * 0.35 AS pool_4,
    ((subscriber_count * subscription_fee) + rollover) * 0.25 AS pool_3;
$$;

CREATE OR REPLACE FUNCTION public.count_score_matches(
  user_scores int[],
  drawn_numbers int[]
)
RETURNS int
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COUNT(*)::int
  FROM unnest(user_scores) AS s(score)
  WHERE score = ANY (drawn_numbers);
$$;

CREATE OR REPLACE FUNCTION public.run_draw(p_draw_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_draw public.draws%ROWTYPE;
  v_profile public.profiles%ROWTYPE;
  v_scores int[];
  v_match_count int;
  v_match_type text;
  v_month_start date;
  v_month_end date;
  v_jackpot_winners int := 0;
  v_pool4_winners int := 0;
  v_pool3_winners int := 0;
BEGIN
  SELECT * INTO v_draw
  FROM public.draws
  WHERE id = p_draw_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Draw not found: %', p_draw_id;
  END IF;

  IF v_draw.status <> 'published' THEN
    RAISE EXCEPTION 'Draw must be published before processing (current status: %)', v_draw.status;
  END IF;

  v_month_start := (v_draw.month || '-01')::date;
  v_month_end := (v_month_start + interval '1 month' - interval '1 day')::date;

  DELETE FROM public.draw_entries
  WHERE draw_id = p_draw_id;

  FOR v_profile IN
    SELECT *
    FROM public.profiles
    WHERE subscription_status = 'active'
  LOOP
    SELECT ARRAY_AGG(score ORDER BY score ASC)
    INTO v_scores
    FROM (
      SELECT gs.score
      FROM public.golf_scores gs
      WHERE gs.user_id = v_profile.id
        AND gs.score_date >= v_month_start
        AND gs.score_date <= v_month_end
      ORDER BY gs.score ASC
      LIMIT 5
    ) top_scores;

    IF v_scores IS NULL OR array_length(v_scores, 1) < 5 THEN
      CONTINUE;
    END IF;

    v_match_count := public.count_score_matches(v_scores, v_draw.drawn_numbers);

    v_match_type := CASE
      WHEN v_match_count >= 5 THEN '5-match'
      WHEN v_match_count = 4 THEN '4-match'
      WHEN v_match_count = 3 THEN '3-match'
      ELSE NULL
    END;

    INSERT INTO public.draw_entries (
      draw_id,
      user_id,
      user_scores,
      match_type
    )
    VALUES (
      p_draw_id,
      v_profile.id,
      v_scores,
      v_match_type
    );
  END LOOP;

  SELECT COUNT(*) INTO v_jackpot_winners
  FROM public.draw_entries
  WHERE draw_id = p_draw_id AND match_type = '5-match';

  SELECT COUNT(*) INTO v_pool4_winners
  FROM public.draw_entries
  WHERE draw_id = p_draw_id AND match_type = '4-match';

  SELECT COUNT(*) INTO v_pool3_winners
  FROM public.draw_entries
  WHERE draw_id = p_draw_id AND match_type = '3-match';

  IF v_jackpot_winners > 0 THEN
    UPDATE public.draw_entries
    SET prize_amount = v_draw.jackpot_amount / v_jackpot_winners
    WHERE draw_id = p_draw_id AND match_type = '5-match';
  END IF;

  IF v_pool4_winners > 0 THEN
    UPDATE public.draw_entries
    SET prize_amount = v_draw.pool_4match / v_pool4_winners
    WHERE draw_id = p_draw_id AND match_type = '4-match';
  END IF;

  IF v_pool3_winners > 0 THEN
    UPDATE public.draw_entries
    SET prize_amount = v_draw.pool_3match / v_pool3_winners
    WHERE draw_id = p_draw_id AND match_type = '3-match';
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER golf_scores_updated_at
  BEFORE UPDATE ON public.golf_scores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.golf_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draw_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "profiles_select_admin"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- golf_scores
CREATE POLICY "golf_scores_select_own"
  ON public.golf_scores
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "golf_scores_insert_own"
  ON public.golf_scores
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "golf_scores_update_own"
  ON public.golf_scores
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "golf_scores_delete_own"
  ON public.golf_scores
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "golf_scores_admin_all"
  ON public.golf_scores
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- charities
CREATE POLICY "charities_select_active"
  ON public.charities
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "charities_admin_all"
  ON public.charities
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- charity_events
CREATE POLICY "charity_events_select_public"
  ON public.charity_events
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "charity_events_admin_all"
  ON public.charity_events
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- draws
CREATE POLICY "draws_select_published"
  ON public.draws
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

CREATE POLICY "draws_admin_all"
  ON public.draws
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- draw_entries
CREATE POLICY "draw_entries_select_own"
  ON public.draw_entries
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "draw_entries_admin_all"
  ON public.draw_entries
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- donations
CREATE POLICY "donations_select_own"
  ON public.donations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "donations_select_admin"
  ON public.donations
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- user_notifications
CREATE POLICY "notifications_select_own"
  ON public.user_notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "notifications_update_own"
  ON public.user_notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON public.charities TO anon, authenticated;
GRANT SELECT ON public.charity_events TO anon, authenticated;
GRANT SELECT ON public.draws TO anon, authenticated;

GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.golf_scores TO authenticated;
GRANT SELECT ON public.draw_entries TO authenticated;
GRANT SELECT ON public.donations TO authenticated;
GRANT SELECT, UPDATE ON public.user_notifications TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_prize_pools(int, numeric, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.count_score_matches(int[], int[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.run_draw(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- Storage: winner proof uploads (private bucket)
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'winner-proofs',
  'winner-proofs',
  false,
  5242880,
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/heic',
    'application/pdf'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "winner_proofs_insert_own"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'winner-proofs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "winner_proofs_select_admin"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'winner-proofs'
    AND public.is_admin()
  );

CREATE POLICY "winner_proofs_select_own"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'winner-proofs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------------
-- Storage: charity images (public bucket, admin-managed)
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'charity-images',
  'charity-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "charity_images_public_read"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'charity-images');

CREATE POLICY "charity_images_admin_insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'charity-images'
    AND public.is_admin()
  );

CREATE POLICY "charity_images_admin_update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'charity-images' AND public.is_admin())
  WITH CHECK (bucket_id = 'charity-images' AND public.is_admin());

CREATE POLICY "charity_images_admin_delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'charity-images' AND public.is_admin());
