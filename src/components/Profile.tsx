import React, { useEffect, useState } from "react";
import {
  Trophy,
  Award,
  Target,
  XCircle,
  Percent,
  Clock,
  User,
} from "lucide-react";
import { supabase } from "../supabase";
import { useAuth } from "../hooks/useAuth";

interface ProfileData {
  trigramme: string;
  games_played: number;
  games_won: number;
  games_lost: number;
  win_percentage: number;
}

interface GameHistory {
  id: string;
  created_at: string;
  score_nous: number;
  score_eux: number;
  winning_team_player1_id: string;
  winning_team_player2_id: string;
  losing_team_player1_id: string;
  losing_team_player2_id: string;
}

export default function Profile() {
  const { session } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [gameHistory, setGameHistory] = useState<GameHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        if (!session?.user?.id) return;

        const userId = session.user.id.trim();

        // ✅ Récupérer le profil
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (profileError) throw profileError;

        // ✅ Récupérer toutes les parties où l'utilisateur a joué
        const { data: games, error: gamesError } = await supabase
          .from("games")
          .select("*")
          .or(
            `player_id.eq.${userId},winning_team_player1_id.eq.${userId},winning_team_player2_id.eq.${userId},losing_team_player1_id.eq.${userId},losing_team_player2_id.eq.${userId}`
          )
          .order("created_at", { ascending: false });

        if (gamesError) {
          console.error(
            "Erreur lors de la récupération des parties :",
            gamesError
          );
          return;
        }

        // ✅ Mettre à jour l'état
        setProfile(profileData);
        setGameHistory(games);
      } catch (error: any) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    if (session?.user) {
      loadProfile();
    }
  }, [session]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br flex items-center justify-center">
        <div className="text-white">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <User className="w-8 h-8 text-[#0342AF] mr-2" />
            <h1 className="text-3xl font-bold">Profil</h1>
          </div>
        </div>

        {error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-gray-800">
                {profile?.trigramme}
              </h2>
              <p className="text-gray-600 mt-2">
                Membre depuis{" "}
                {new Date(session?.user?.created_at || "").toLocaleDateString()}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <Target className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Parties jouées</p>
                <p className="text-2xl font-bold text-gray-800">
                  {profile?.games_played}
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg text-center">
                <Award className="w-6 h-6 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Victoires</p>
                <p className="text-2xl font-bold text-gray-800">
                  {profile?.games_won}
                </p>
              </div>

              <div className="bg-red-50 p-4 rounded-lg text-center">
                <XCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Défaites</p>
                <p className="text-2xl font-bold text-gray-800">
                  {profile?.games_lost}
                </p>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg text-center">
                <Percent className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">% Victoires</p>
                <p className="text-2xl font-bold text-gray-800">
                  {profile?.win_percentage?.toFixed(1)}%
                </p>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Historique des parties
              </h3>
              <div className="space-y-4">
                {gameHistory.length === 0 ? (
                  <p className="text-center text-gray-500">
                    Aucune partie jouée
                  </p>
                ) : (
                  gameHistory.map((game) => {
                    const isWinner =
                      game.winning_team_player1_id === session?.user?.id ||
                      game.winning_team_player2_id === session?.user?.id;
                    const isLoser =
                      game.losing_team_player1_id === session?.user?.id ||
                      game.losing_team_player2_id === session?.user?.id;

                    return (
                      <div
                        key={game.id}
                        className={`p-4 rounded-lg ${
                          isWinner
                            ? "bg-green-50"
                            : isLoser
                            ? "bg-red-50"
                            : "bg-gray-50"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-semibold">
                              {isWinner
                                ? "Victoire"
                                : isLoser
                                ? "Défaite"
                                : "Inconnu"}
                            </span>
                            <span className="text-sm text-gray-600 ml-2">
                              {new Date(game.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold">
                              {game.score_nous} - {game.score_eux}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
