/*
  # Fix profiles table policies

  1. Changes
    - Disable RLS temporarily to apply changes
    - Create new policies for profiles table:
      - Anyone can read profiles (authenticated users)
      - Users can create their own profile
      - Users can update any profile (needed for game statistics)
*/

-- Temporarily disable RLS
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read profiles" ON profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Create new policies
CREATE POLICY "Anyone can read profiles"
ON profiles
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create their own profile"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update profiles"
ON profiles
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;