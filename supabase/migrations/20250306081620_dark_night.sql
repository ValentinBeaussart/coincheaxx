/*
  # Fix games table policies

  1. Changes
    - Fix infinite recursion in SELECT policy by simplifying the condition
    - Keep INSERT and UPDATE policies unchanged
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create games" ON games;
DROP POLICY IF EXISTS "Users can view their games" ON games;
DROP POLICY IF EXISTS "Users can update their games" ON games;

-- Create new policies
CREATE POLICY "Users can create games"
ON games
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can view their games"
ON games
FOR SELECT
TO authenticated
USING (
  auth.uid() = player_id OR
  auth.uid() = winning_team_player1_id OR
  auth.uid() = winning_team_player2_id
);

CREATE POLICY "Users can update their games"
ON games
FOR UPDATE
TO authenticated
USING (auth.uid() = player_id)
WITH CHECK (auth.uid() = player_id);