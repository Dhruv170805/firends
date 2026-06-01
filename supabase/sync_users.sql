-- Run this in your Supabase SQL Editor to sync missing users
INSERT INTO public.users (id, username, email)
SELECT 
  id, 
  COALESCE(raw_user_meta_data->>'username', split_part(email, '@', 1) || '_' || substr(id::text, 1, 5)), 
  email
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users)
ON CONFLICT (id) DO NOTHING;
