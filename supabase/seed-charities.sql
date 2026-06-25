-- Active charities for signup (idempotent)
INSERT INTO public.charities (
  id, name, description, category, image_url, website_url, is_featured, is_active
) VALUES
  (
    'a0000001-0000-4000-8000-000000000001',
    'Heroes for Children',
    'Supporting families facing pediatric cancer with financial and emotional assistance.',
    'health',
    '/images/charities/heroes-for-children.jpg',
    'https://example.com/heroes-for-children',
    true,
    true
  ),
  (
    'a0000002-0000-4000-8000-000000000002',
    'Fairway Futures',
    'Introducing golf to underserved youth through coaching and equipment grants.',
    'youth',
    '/images/charities/fairway-futures.jpg',
    'https://example.com/fairway-futures',
    true,
    true
  ),
  (
    'a0000003-0000-4000-8000-000000000003',
    'Green Links Trust',
    'Preserving public golf courses and open green spaces for community access.',
    'environment',
    '/images/charities/green-links-trust.jpg',
    'https://example.com/green-links',
    false,
    true
  ),
  (
    'a0000004-0000-4000-8000-000000000004',
    'Tee Off for Troops',
    'Golf therapy and rehabilitation programmes for veterans and service members.',
    'veterans',
    '/images/charities/tee-off-for-troops.jpg',
    'https://example.com/tee-off-troops',
    true,
    true
  ),
  (
    'a0000005-0000-4000-8000-000000000005',
    'Par for the Course Foundation',
    'Inactive placeholder charity for admin testing (not featured).',
    'community',
    NULL,
    NULL,
    false,
    false
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  image_url = EXCLUDED.image_url,
  website_url = EXCLUDED.website_url,
  is_featured = EXCLUDED.is_featured,
  is_active = EXCLUDED.is_active;
