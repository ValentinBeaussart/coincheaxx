import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "react-router-dom";

interface Player {
  id: string;
  trigramme: string;
  games_played: number;
  games_won: number;
  games_lost: number;
  win_percentage: number;
}

interface Game {
  id: string;
  created_at: string;
  score_nous: number;
  score_eux: number;
  winning_team_player1_id: string;
  winning_team_player2_id: string;
  losing_team_player1_id: string;
  losing_team_player2_id: string;
}

export default function AllPlayers() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);
  const [gamesMap, setGamesMap] = useState<Record<string, Game[]>>({});
  const [playersMap, setPlayersMap] = useState<Record<string, string>>({});

  useEffect(() => {
    async function fetchPlayers() {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, trigramme, games_played, games_won, games_lost, win_percentage");
      if (profiles) setPlayers(profiles);
    }

    fetchPlayers();
  }, []);

  const toggleExpand = async (playerId: string) => {
    if (expandedPlayer === playerId) {
      setExpandedPlayer(null);
    } else {
      setExpandedPlayer(playerId);
      if (!gamesMap[playerId]) {
        const { data: games } = await supabase
          .from("games")
          .select("*")
          .or(
            `winning_team_player1_id.eq.${playerId},winning_team_player2_id.eq.${playerId},losing_team_player1_id.eq.${playerId},losing_team_player2_id.eq.${playerId}`
          )
          .order("created_at", { ascending: false })
          .limit(5);

        if (games) {
          const ids = new Set<string>();
          games.forEach((g) => {
            ids.add(g.winning_team_player1_id);
            ids.add(g.winning_team_player2_id);
            ids.add(g.losing_team_player1_id);
            ids.add(g.losing_team_player2_id);
          });
          const { data: otherPlayers } = await supabase
            .from("profiles")
            .select("id, trigramme")
            .in("id", Array.from(ids));

          const map = Object.fromEntries(
            otherPlayers?.map((p) => [p.id, p.trigramme]) || []
          );

          setPlayersMap((prev) => ({ ...prev, ...map }));
          setGamesMap((prev) => ({ ...prev, [playerId]: games }));
        }
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
    <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
      <h1 className="text-2xl font-bold text-center mb-6">Les Coincheurs</h1>
      <div className="space-y-4">
        {players.map((player) => (
          <div
            key={player.id}
            className="border rounded-lg shadow p-4 bg-gray-50"
          >
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => toggleExpand(player.id)}
            >
              <div>
                <Link
                  to={`/profile/${player.trigramme}`}
                  className="text-lg font-semibold text-blue-600 hover:underline"
                >
                  {player.trigramme}
                </Link>
                <p className="text-sm text-gray-500 font-bold">
                  {player.games_played} PJ - {player.games_won} V / {player.games_lost} D
                </p>
              </div>
              {expandedPlayer === player.id ? <ChevronUp /> : <ChevronDown />}
            </div>

            {expandedPlayer === player.id && (
              <div className="mt-4 space-y-3">
                {gamesMap[player.id]?.length > 0 ? (
                  gamesMap[player.id].map((game) => {
                    const isWinner =
                      game.winning_team_player1_id === player.id ||
                      game.winning_team_player2_id === player.id;
                    const isLoser =
                      game.losing_team_player1_id === player.id ||
                      game.losing_team_player2_id === player.id;

                    return (
                      <div
                        key={game.id}
                        className={`p-3 rounded-md text-sm shadow-sm border ${
                          isWinner
                            ? "bg-green-50 border-green-200"
                            : isLoser
                            ? "bg-red-50 border-red-200"
                            : "bg-gray-100 border-gray-200"
                        }`}
                      >
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700">
                            {new Date(game.created_at).toLocaleDateString()}
                          </span>
                          <span className="font-bold">
                            {game.score_nous} - {game.score_eux}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          <strong>Gagnants:</strong> {playersMap[game.winning_team_player1_id]} & {playersMap[game.winning_team_player2_id]}<br />
                          <strong>Perdants:</strong> {playersMap[game.losing_team_player1_id]} & {playersMap[game.losing_team_player2_id]}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-gray-500 italic">Aucune partie trouvée.</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
    </div>
  );
}
