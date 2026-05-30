-- Alter public.users table to support full name and phone number
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone TEXT;

-- Create handle_new_user trigger function to automatically provision profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, username, email, full_name, phone, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable real-time replication for notifications table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    -- Check if notifications table is already in the publication to avoid duplicate errors
    IF NOT EXISTS (
      SELECT 1 
      FROM pg_publication_rel pr 
      JOIN pg_class c ON pr.prrelid = c.oid 
      JOIN pg_namespace n ON c.relnamespace = n.oid 
      WHERE pr.prpubid = (SELECT oid FROM pg_publication WHERE pubname = 'supabase_realtime')
        AND c.relname = 'notifications'
        AND n.nspname = 'public'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
    END IF;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

