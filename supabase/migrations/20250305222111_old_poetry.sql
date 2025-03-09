/*
  # Create profiles table

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `trigramme` (char(3), unique, uppercase)
      - `games_played` (integer)
      - `games_won` (integer)
      - `games_lost` (integer)
      - `win_percentage` (decimal)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `profiles` table
    - Add policies for authenticated users to:
      - Read any profile
      - Update only their own profile
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  trigramme char(3) UNIQUE NOT NULL CHECK (trigramme ~ '^[A-Z]{3}$'),
  games_played integer DEFAULT 0,
  games_won integer DEFAULT 0,
  games_lost integer DEFAULT 0,
  win_percentage decimal DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Trigger to update win_percentage and games_played
CREATE OR REPLACE FUNCTION update_profile_stats()
RETURNS TRIGGER AS $$
BEGIN
  NEW.games_played = NEW.games_won + NEW.games_lost;
  NEW.win_percentage = CASE 
    WHEN NEW.games_played > 0 
    THEN ROUND((NEW.games_won::decimal / NEW.games_played::decimal) * 100, 2)
    ELSE 0 
  END;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profile_stats_trigger
  BEFORE INSERT OR UPDATE OF games_won, games_lost
  ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_stats();