/* Save this file as supabase_update_profiles_vital.sql in your root directory if needed, or run directly */

-- Update the profiles table to add DOB, Height, Weight
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS dob date,
  ADD COLUMN IF NOT EXISTS height integer,
  ADD COLUMN IF NOT EXISTS weight numeric(5,2);
