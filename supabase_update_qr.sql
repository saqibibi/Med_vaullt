/* Save this file as supabase_update_qr.sql and run in Supabase SQL editor */

-- Add the unique emergency_id to the profiles table
-- We use gen_random_uuid() to automatically generate a secure 36-character string for every user

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emergency_id uuid DEFAULT gen_random_uuid() UNIQUE;
