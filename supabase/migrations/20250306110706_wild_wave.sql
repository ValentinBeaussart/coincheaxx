/*
  # Add RLS policies for games table

  1. Security Changes
    - Enable RLS on games table
    - Add policies for:
      - Authenticated users can insert their own games
      - Users can view games they participated in
      - Users can update their own games
*/

-- Enable RLS
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Policy for inserting games
CREATE POLICY "Users can create their own games"
ON games
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = player_id);

-- Policy for viewing games
CREATE POLICY "Users can view games they participated in"
ON games
FOR SELECT
TO authenticated
USING (
  auth.uid() = player_id OR
  auth.uid() = winning_team_player1_id OR
  auth.uid() = winning_team_player2_id
);

-- Policy for updating games
CREATE POLICY "Users can update their own games"
ON games
FOR UPDATE
TO authenticated
USING (auth.uid() = player_id)
WITH CHECK (auth.uid() = player_id);