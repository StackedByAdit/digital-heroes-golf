-- Active charities for signup (idempotent)
INSERT INTO public.charities (
  id, name, description, image_url, website_url, is_featured, is_active
) VALUES
  (
    'a0000001-0000-4000-8000-000000000001',
    'Heroes for Children',
    'Supporting families facing pediatric cancer with financial and emotional assistance.',
    'https://placehold.co/400x300?text=Heroes+for+Children',
    'https://example.com/heroes-for-children',
    true,
    true
  ),
  (
    'a0000002-0000-4000-8000-000000000002',
    'Fairway Futures',
    'Introducing golf to underserved youth through coaching and equipment grants.',
    'https://placehold.co/400x300?text=Fairway+Futures',
    'https://example.com/fairway-futures',
    true,
    true
  ),
  (
    'a0000003-0000-4000-8000-000000000003',
    'Green Links Trust',
    'Preserving public golf courses and open green spaces for community access.',
    'https://placehold.co/400x300?text=Green+Links',
    'https://example.com/green-links',
    false,
    true
  ),
  (
    'a0000004-0000-4000-8000-000000000004',
    'Tee Off for Troops',
    'Golf therapy and rehabilitation programmes for veterans and service members.',
    'https://placehold.co/400x300?text=Tee+Off+for+Troops',
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
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  website_url = EXCLUDED.website_url,
  is_featured = EXCLUDED.is_featured,
  is_active = EXCLUDED.is_active;
