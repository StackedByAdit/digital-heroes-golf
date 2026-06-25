-- Digital Heroes Golf — seed data for local / staging development
-- Apply after schema.sql
-- Default test password for all seeded auth users: ChangeMe123!

-- ---------------------------------------------------------------------------
-- Fixed UUIDs (reproducible across environments)
-- ---------------------------------------------------------------------------

-- Charities
-- a0000001-0000-4000-8000-000000000001 .. 005

-- Users
-- 10000001 = admin@digitalheroes.golf
-- 20000002 = alice@example.com
-- 30000003 = bob@example.com
-- 40000004 = carol@example.com

-- Draws
-- d0000001 = 2025-04
-- d0000002 = 2025-05

-- ---------------------------------------------------------------------------
-- Charities (5 — mix of featured and non-featured)
-- ---------------------------------------------------------------------------

INSERT INTO public.charities (
  id, name, description, image_url, website_url, is_featured, is_active
) VALUES
  (
    'a0000001-0000-4000-8000-000000000001',
    'Heroes for Children',
    'Supporting families facing pediatric cancer with financial and emotional assistance.',
    '/images/charities/heroes-for-children.jpg',
    'https://example.com/heroes-for-children',
    true,
    true
  ),
  (
    'a0000002-0000-4000-8000-000000000002',
    'Fairway Futures',
    'Introducing golf to underserved youth through coaching and equipment grants.',
    '/images/charities/fairway-futures.jpg',
    'https://example.com/fairway-futures',
    true,
    true
  ),
  (
    'a0000003-0000-4000-8000-000000000003',
    'Green Links Trust',
    'Preserving public golf courses and open green spaces for community access.',
    '/images/charities/green-links-trust.jpg',
    'https://example.com/green-links',
    false,
    true
  ),
  (
    'a0000004-0000-4000-8000-000000000004',
    'Tee Off for Troops',
    'Golf therapy and rehabilitation programmes for veterans and service members.',
    '/images/charities/tee-off-for-troops.jpg',
    'https://example.com/tee-off-troops',
    true,
    true
  ),
  (
    'a0000005-0000-4000-8000-000000000005',
    'Par for the Course Foundation',
    'Inactive placeholder charity for admin testing (not featured).',
    NULL,
    NULL,
    false,
    false
  );

-- ---------------------------------------------------------------------------
-- Charity events (3)
-- ---------------------------------------------------------------------------

INSERT INTO public.charity_events (
  id, charity_id, title, event_date, description
) VALUES
  (
    'e0000001-0000-4000-8000-000000000001',
    'a0000001-0000-4000-8000-000000000001',
    'Spring Charity Scramble',
    '2025-06-14',
    '18-hole team scramble raising funds for pediatric care programmes.'
  ),
  (
    'e0000002-0000-4000-8000-000000000002',
    'a0000002-0000-4000-8000-000000000002',
    'Junior Golf Open Day',
    '2025-07-05',
    'Free coaching clinics and equipment fittings for junior players aged 8–16.'
  ),
  (
    'e0000003-0000-4000-8000-000000000003',
    'a0000004-0000-4000-8000-000000000004',
    'Veterans Cup',
    '2025-08-22',
    'Annual tournament pairing veterans with PGA professionals for a day of golf.'
  );

-- ---------------------------------------------------------------------------
-- Auth users + profiles
-- Trigger on_auth_user_created auto-inserts profiles; we then patch fields.
-- ---------------------------------------------------------------------------

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES
  (
    '00000000-0000-0000-0000-000000000000',
    '10000001-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'admin@digitalheroes.golf',
    crypt('ChangeMe123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Admin User"}',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '20000002-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'alice@example.com',
    crypt('ChangeMe123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Alice Thompson"}',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '30000003-0000-4000-8000-000000000003',
    'authenticated',
    'authenticated',
    'bob@example.com',
    crypt('ChangeMe123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Bob Martinez"}',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '40000004-0000-4000-8000-000000000004',
    'authenticated',
    'authenticated',
    'carol@example.com',
    crypt('ChangeMe123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Carol Davies"}',
    now(),
    now()
  );

INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES
  (
    '10000001-0000-4000-8000-000000000001',
    '10000001-0000-4000-8000-000000000001',
    jsonb_build_object('sub', '10000001-0000-4000-8000-000000000001', 'email', 'admin@digitalheroes.golf'),
    'email',
    '10000001-0000-4000-8000-000000000001',
    now(),
    now(),
    now()
  ),
  (
    '20000002-0000-4000-8000-000000000002',
    '20000002-0000-4000-8000-000000000002',
    jsonb_build_object('sub', '20000002-0000-4000-8000-000000000002', 'email', 'alice@example.com'),
    'email',
    '20000002-0000-4000-8000-000000000002',
    now(),
    now(),
    now()
  ),
  (
    '30000003-0000-4000-8000-000000000003',
    '30000003-0000-4000-8000-000000000003',
    jsonb_build_object('sub', '30000003-0000-4000-8000-000000000003', 'email', 'bob@example.com'),
    'email',
    '30000003-0000-4000-8000-000000000003',
    now(),
    now(),
    now()
  ),
  (
    '40000004-0000-4000-8000-000000000004',
    '40000004-0000-4000-8000-000000000004',
    jsonb_build_object('sub', '40000004-0000-4000-8000-000000000004', 'email', 'carol@example.com'),
    'email',
    '40000004-0000-4000-8000-000000000004',
    now(),
    now(),
    now()
  );

-- Patch auto-created profiles with roles, subscriptions, and charity links
UPDATE public.profiles SET
  role = 'admin',
  subscription_status = 'active',
  subscription_plan = 'yearly',
  charity_id = 'a0000001-0000-4000-8000-000000000001',
  charity_percentage = 25
WHERE id = '10000001-0000-4000-8000-000000000001';

UPDATE public.profiles SET
  subscription_status = 'active',
  subscription_plan = 'monthly',
  charity_id = 'a0000002-0000-4000-8000-000000000002',
  charity_percentage = 15
WHERE id = '20000002-0000-4000-8000-000000000002';

UPDATE public.profiles SET
  subscription_status = 'active',
  subscription_plan = 'monthly',
  charity_id = 'a0000003-0000-4000-8000-000000000003',
  charity_percentage = 10
WHERE id = '30000003-0000-4000-8000-000000000003';

UPDATE public.profiles SET
  subscription_status = 'active',
  subscription_plan = 'yearly',
  charity_id = 'a0000004-0000-4000-8000-000000000004',
  charity_percentage = 20
WHERE id = '40000004-0000-4000-8000-000000000004';

-- ---------------------------------------------------------------------------
-- Golf scores (5 per subscriber per draw month for run_draw eligibility)
-- drawn_numbers for April: {7, 12, 21, 33, 40}
-- drawn_numbers for May:   {3, 15, 22, 28, 41}
-- ---------------------------------------------------------------------------

INSERT INTO public.golf_scores (user_id, score, score_date) VALUES
  -- Alice — April (includes 7, 12, 21, 33, 40 → 5-match)
  ('20000002-0000-4000-8000-000000000002', 7,  '2025-04-01'),
  ('20000002-0000-4000-8000-000000000002', 12, '2025-04-05'),
  ('20000002-0000-4000-8000-000000000002', 21, '2025-04-10'),
  ('20000002-0000-4000-8000-000000000002', 33, '2025-04-15'),
  ('20000002-0000-4000-8000-000000000002', 40, '2025-04-20'),
  -- Alice — May (includes 3, 15, 22 → 3-match)
  ('20000002-0000-4000-8000-000000000002', 3,  '2025-05-02'),
  ('20000002-0000-4000-8000-000000000002', 15, '2025-05-06'),
  ('20000002-0000-4000-8000-000000000002', 22, '2025-05-11'),
  ('20000002-0000-4000-8000-000000000002', 30, '2025-05-16'),
  ('20000002-0000-4000-8000-000000000002', 35, '2025-05-21'),

  -- Bob — April (includes 7, 12, 21, 33 → 4-match)
  ('30000003-0000-4000-8000-000000000003', 7,  '2025-04-02'),
  ('30000003-0000-4000-8000-000000000003', 12, '2025-04-07'),
  ('30000003-0000-4000-8000-000000000003', 21, '2025-04-12'),
  ('30000003-0000-4000-8000-000000000003', 33, '2025-04-17'),
  ('30000003-0000-4000-8000-000000000003', 38, '2025-04-22'),
  -- Bob — May (includes 3, 15, 22, 28 → 4-match)
  ('30000003-0000-4000-8000-000000000003', 3,  '2025-05-03'),
  ('30000003-0000-4000-8000-000000000003', 15, '2025-05-08'),
  ('30000003-0000-4000-8000-000000000003', 22, '2025-05-13'),
  ('30000003-0000-4000-8000-000000000003', 28, '2025-05-18'),
  ('30000003-0000-4000-8000-000000000003', 36, '2025-05-23'),

  -- Carol — April (includes 7, 12, 21 → 3-match)
  ('40000004-0000-4000-8000-000000000004', 7,  '2025-04-03'),
  ('40000004-0000-4000-8000-000000000004', 12, '2025-04-08'),
  ('40000004-0000-4000-8000-000000000004', 21, '2025-04-13'),
  ('40000004-0000-4000-8000-000000000004', 29, '2025-04-18'),
  ('40000004-0000-4000-8000-000000000004', 44, '2025-04-23'),
  -- Carol — May (includes 3, 15, 22, 28, 41 → 5-match)
  ('40000004-0000-4000-8000-000000000004', 3,  '2025-05-04'),
  ('40000004-0000-4000-8000-000000000004', 15, '2025-05-09'),
  ('40000004-0000-4000-8000-000000000004', 22, '2025-05-14'),
  ('40000004-0000-4000-8000-000000000004', 28, '2025-05-19'),
  ('40000004-0000-4000-8000-000000000004', 41, '2025-05-24');

-- ---------------------------------------------------------------------------
-- Published draws (2) — prize pools based on 3 active subscribers × £10 fee
-- total = 30; jackpot = 12; pool_4 = 10.50; pool_3 = 7.50
-- ---------------------------------------------------------------------------

INSERT INTO public.draws (
  id,
  month,
  draw_type,
  drawn_numbers,
  status,
  jackpot_amount,
  pool_4match,
  pool_3match,
  rollover_amount,
  published_at
) VALUES
  (
    'd0000001-0000-4000-8000-000000000001',
    '2025-04',
    'random',
    ARRAY[7, 12, 21, 33, 40],
    'published',
    12.00,
    10.50,
    7.50,
    0,
    '2025-05-01 09:00:00+00'
  ),
  (
    'd0000002-0000-4000-8000-000000000002',
    '2025-05',
    'algorithmic',
    ARRAY[3, 15, 22, 28, 41],
    'published',
    12.00,
    10.50,
    7.50,
    0,
    '2025-06-01 09:00:00+00'
  );

-- ---------------------------------------------------------------------------
-- Draw entries (pre-computed for testing; mirrors run_draw() output)
-- ---------------------------------------------------------------------------

INSERT INTO public.draw_entries (
  draw_id,
  user_id,
  user_scores,
  match_type,
  prize_amount,
  payment_status
) VALUES
  -- April 2025
  (
    'd0000001-0000-4000-8000-000000000001',
    '20000002-0000-4000-8000-000000000002',
    ARRAY[7, 12, 21, 33, 40],
    '5-match',
    12.00,
    'paid'
  ),
  (
    'd0000001-0000-4000-8000-000000000001',
    '30000003-0000-4000-8000-000000000003',
    ARRAY[7, 12, 21, 33, 38],
    '4-match',
    10.50,
    'pending'
  ),
  (
    'd0000001-0000-4000-8000-000000000001',
    '40000004-0000-4000-8000-000000000004',
    ARRAY[7, 12, 21, 29, 44],
    '3-match',
    7.50,
    'pending'
  ),
  -- May 2025
  (
    'd0000002-0000-4000-8000-000000000002',
    '20000002-0000-4000-8000-000000000002',
    ARRAY[3, 15, 22, 30, 35],
    '3-match',
    7.50,
    'pending'
  ),
  (
    'd0000002-0000-4000-8000-000000000002',
    '30000003-0000-4000-8000-000000000003',
    ARRAY[3, 15, 22, 28, 36],
    '4-match',
    10.50,
    'pending'
  ),
  (
    'd0000002-0000-4000-8000-000000000002',
    '40000004-0000-4000-8000-000000000004',
    ARRAY[3, 15, 22, 28, 41],
    '5-match',
    12.00,
    'paid'
  );

-- Verify prize pool helper (optional sanity check):
-- SELECT * FROM public.calculate_prize_pools(3, 10, 0);
-- Re-process a draw programmatically:
-- SELECT public.run_draw('d0000001-0000-4000-8000-000000000001');
