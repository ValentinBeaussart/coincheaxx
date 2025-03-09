/*
  # Fix profiles table RLS policies

  1. Security Changes
    - Add INSERT policy to allow profile creation during registration
    - Ensure policies cover all necessary operations (SELECT, INSERT, UPDATE)
*/

-- Allow users to create their own profile during registration
CREATE POLICY "Users can create their own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Ensure existing policies are properly set
DROP POLICY IF EXISTS "Anyone can read profiles" ON profiles;
CREATE POLICY "Anyone can read profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);