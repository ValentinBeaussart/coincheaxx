/*
  # Add games table for tracking game history

  1. New Tables
    - `games`
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `player_id` (uuid, references profiles)
      - `score_nous` (integer)
      - `score_eux` (integer)
      - `won` (boolean)

  2. Security
    - Enable RLS on `games` table
    - Add policies for authenticated users to:
      - Read their own games
      - Insert their own games
*/

CREATE TABLE IF NOT EXISTS games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  player_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  score_nous integer NOT NULL,
  score_eux integer NOT NULL,
  won boolean NOT NULL
);

ALTER TABLE games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own games"
  ON games
  FOR SELECT
  TO authenticated
  USING (auth.uid() = player_id);

CREATE POLICY "Users can insert their own games"
  ON games
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = player_id);