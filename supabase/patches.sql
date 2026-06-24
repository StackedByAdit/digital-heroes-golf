-- Idempotent patches applied after schema.sql on existing databases

ALTER TABLE public.draw_entries
  ADD COLUMN IF NOT EXISTS rejection_notes text;
