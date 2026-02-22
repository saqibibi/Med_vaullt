/* Save this file as supabase_update_conditions.sql and run in Supabase SQL editor */

-- Add serious_conditions column to the profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS serious_conditions jsonb DEFAULT '[]'::jsonb;
