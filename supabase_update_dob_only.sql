-- Run this in your Supabase SQL Editor
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dob date;
NOTIFY pgrst, 'reload schema';
