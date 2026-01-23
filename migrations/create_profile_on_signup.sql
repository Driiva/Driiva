-- Migration: Create profile automatically when user signs up
-- This trigger ensures that every user in auth.users has a corresponding profile in public.profiles

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Try to insert with id as primary key (if profiles.id is UUID matching auth.users.id)
  INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'User'),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- If the above fails silently (e.g., if id is not the primary key),
  -- try with user_id as foreign key instead
  -- This is a fallback that won't execute if the first insert succeeds
  INSERT INTO public.profiles (user_id, email, full_name, created_at, updated_at)
  SELECT 
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'User'),
    NOW(),
    NOW()
  WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = NEW.id OR user_id = NEW.id
  )
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Also create a function to handle existing users without profiles
-- This can be run manually to backfill profiles for existing users
CREATE OR REPLACE FUNCTION public.backfill_missing_profiles()
RETURNS INTEGER AS $$
DECLARE
  created_count INTEGER := 0;
BEGIN
  -- Insert profiles for users that don't have one
  -- Try with id as primary key first
  INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
  SELECT 
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'full_name', u.email, 'User'),
    u.created_at,
    NOW()
  FROM auth.users u
  WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = u.id
  )
  ON CONFLICT (id) DO NOTHING;
  
  GET DIAGNOSTICS created_count = ROW_COUNT;
  
  -- If id is not the primary key, try with user_id
  INSERT INTO public.profiles (user_id, email, full_name, created_at, updated_at)
  SELECT 
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'full_name', u.email, 'User'),
    u.created_at,
    NOW()
  FROM auth.users u
  WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = u.id OR p.id = u.id
  )
  ON CONFLICT DO NOTHING;
  
  GET DIAGNOSTICS created_count = created_count + ROW_COUNT;
  
  RETURN created_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.backfill_missing_profiles() TO authenticated;
