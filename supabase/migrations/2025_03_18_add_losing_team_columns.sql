/*
  # Update games table structure - Add losing team players

  1. Changes:
    - Add columns for losing team players
      - `losing_team_player1_id` (uuid, references profiles.id)
      - `losing_team_player2_id` (uuid, references profiles.id)

  2. Security:
    - Update RLS policies to allow losing players to see their games
*/

-- ✅ Ajouter les colonnes pour les perdants
ALTER TABLE games 
  ADD COLUMN IF NOT EXISTS losing_team_player1_id uuid REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS losing_team_player2_id uuid REFERENCES profiles(id);

-- ✅ Supprimer l'ancienne politique d'accès aux parties
DROP POLICY IF EXISTS "Users can read games they participated in" ON games;

-- ✅ Créer une nouvelle politique qui inclut les perdants
CREATE POLICY "Users can read games they participated in"
  ON games
  FOR SELECT
  TO authenticated
  USING (
    player_id = auth.uid() OR
    winning_team_player1_id = auth.uid() OR
    winning_team_player2_id = auth.uid() OR
    losing_team_player1_id = auth.uid() OR
    losing_team_player2_id = auth.uid()
  );
