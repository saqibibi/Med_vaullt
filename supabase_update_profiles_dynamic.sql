/* Save this file as supabase_update_profiles_dynamic.sql in your root directory if needed, or run directly */

-- Add the new JSONB column for emergency contacts
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS emergency_contacts JSONB DEFAULT '[]'::jsonb;
