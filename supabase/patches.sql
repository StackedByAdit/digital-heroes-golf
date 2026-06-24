-- Idempotent patches applied after schema.sql on existing databases

ALTER TABLE public.draw_entries
  ADD COLUMN IF NOT EXISTS rejection_notes text;

-- Charity categories for directory filtering
ALTER TABLE public.charities
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'community'
    CHECK (category IN (
      'health',
      'mental_health',
      'environment',
      'community',
      'education',
      'animals',
      'veterans',
      'youth'
    ));

UPDATE public.charities SET category = 'health'
  WHERE id = 'a0000001-0000-4000-8000-000000000001';
UPDATE public.charities SET category = 'youth'
  WHERE id = 'a0000002-0000-4000-8000-000000000002';
UPDATE public.charities SET category = 'environment'
  WHERE id = 'a0000003-0000-4000-8000-000000000003';
UPDATE public.charities SET category = 'veterans'
  WHERE id = 'a0000004-0000-4000-8000-000000000004';
UPDATE public.charities SET category = 'community'
  WHERE id = 'a0000005-0000-4000-8000-000000000005';

CREATE INDEX IF NOT EXISTS idx_charities_category ON public.charities (category);

-- Independent one-off donations (not tied to subscription gameplay)
CREATE TABLE IF NOT EXISTS public.donations (
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

CREATE INDEX IF NOT EXISTS idx_donations_charity_id ON public.donations (charity_id);
CREATE INDEX IF NOT EXISTS idx_donations_user_id ON public.donations (user_id);
CREATE INDEX IF NOT EXISTS idx_donations_status ON public.donations (status);

ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

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

GRANT SELECT ON public.donations TO authenticated;

-- In-app notifications
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  href text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON public.user_notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_unread ON public.user_notifications (user_id, read_at)
  WHERE read_at IS NULL;

ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

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

GRANT SELECT, UPDATE ON public.user_notifications TO authenticated;

-- Public charity image uploads (admin-managed assets)
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
