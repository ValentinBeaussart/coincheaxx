/*
  # Update games table structure

  1. Changes
    - Remove the `won` column
    - Add columns for winning team players
      - `winning_team_player1_id` (uuid, references profiles.id)
      - `winning_team_player2_id` (uuid, references profiles.id)

  2. Security
    - Maintain RLS policies
    - Add foreign key constraints for new columns
*/

-- Remove the won column
ALTER TABLE games DROP COLUMN IF EXISTS won;

-- Add winning team players columns
ALTER TABLE games 
  ADD COLUMN winning_team_player1_id uuid REFERENCES profiles(id),
  ADD COLUMN winning_team_player2_id uuid REFERENCES profiles(id);

-- Update RLS policies
DROP POLICY IF EXISTS "Users can read their own games" ON games;
CREATE POLICY "Users can read games they participated in"
  ON games
  FOR SELECT
  TO authenticated
  USING (
    player_id = auth.uid() OR
    winning_team_player1_id = auth.uid() OR
    winning_team_player2_id = auth.uid()
  );