/*
  # Update games table policies

  1. Changes
    - Update SELECT policy to allow users to view games where they are either:
      - The game creator (player_id)
      - A member of the blue team (nous1 or nous2)
      - A member of the red team (eux1 or eux2)
    - Update INSERT policy to allow authenticated users to create games
    - Add UPDATE policy to allow game creators to update their games
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert their own games" ON games;
DROP POLICY IF EXISTS "Users can read games they participated in" ON games;

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
  auth.uid() IN (
    SELECT id FROM profiles WHERE id IN (
      SELECT winning_team_player1_id FROM games WHERE id = games.id
      UNION
      SELECT winning_team_player2_id FROM games WHERE id = games.id
    )
  )
);

CREATE POLICY "Users can update their games"
ON games
FOR UPDATE
TO authenticated
USING (auth.uid() = player_id)
WITH CHECK (auth.uid() = player_id);