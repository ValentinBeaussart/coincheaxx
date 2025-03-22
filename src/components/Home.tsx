import React, { useEffect, useState } from "react";
import { PlayCircle, Trophy, Medal, Club, Frown } from "lucide-react";
import { supabase } from "../supabase";
import { Link } from "react-router-dom";
import bronze from "../assets/icons/bronze.png";
import argent from "../assets/icons/silver.png";
import or from "../assets/icons/gold.png";
import master from "../assets/icons/master.png";
import grandmaster from "../assets/icons/grandmaster.png";
import challenger from "../assets/icons/challenger.png";

interface Player {
  trigramme: string;
  win_percentage: number;
  games_played: number;
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

export default function Home() {
  const [topPlayers, setTopPlayers] = useState<Player[]>([]);
  const [worstPlayers, setWorstPlayers] = useState<Player[]>([]);
  const [recentGames, setRecentGames] = useState<Game[]>([]);
  const [playersMap, setPlayersMap] = useState<Record<string, string>>({});

  useEffect(() => {
    async function fetchPlayers() {
      const { data: allPlayers } = await supabase
        .from("profiles")
        .select("trigramme, win_percentage, games_played")
        .gte("games_played", 10);

      if (allPlayers) {
        const sortedPlayers = allPlayers.sort(
          (a, b) => b.win_percentage - a.win_percentage
        );
        const topFiltered = sortedPlayers.slice(0, 3);
        const worstFiltered = sortedPlayers
          .filter((player) => !topFiltered.includes(player))
          .sort((a, b) => a.win_percentage - b.win_percentage)
          .slice(0, 3);

        setTopPlayers(topFiltered);
        setWorstPlayers(worstFiltered);
      }
    }

    async function fetchRecentGames() {
      const { data: games } = await supabase
        .from("games")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      if (games) {
        const playerIds = new Set<string>();
        games.forEach((game) => {
          playerIds.add(game.winning_team_player1_id);
          playerIds.add(game.winning_team_player2_id);
          playerIds.add(game.losing_team_player1_id);
          playerIds.add(game.losing_team_player2_id);
        });

        const { data: players } = await supabase
          .from("profiles")
          .select("id, trigramme")
          .in("id", Array.from(playerIds));

        const map = Object.fromEntries(players.map((p) => [p.id, p.trigramme]));
        setPlayersMap(map);
        setRecentGames(games);
      }
    }

    fetchPlayers();
    fetchRecentGames();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {topPlayers.length > 0 && (
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h2 className="text-2xl font-bold text-center mb-8">Les GOATS</h2>
          <div className="flex justify-center items-end gap-3 sm:gap-8">
            {topPlayers[1] && (
              <div className="text-center">
                <div className="w-24 h-32 bg-gray-100 rounded-t-lg flex items-center justify-center mb-4">
                  <img
                    src={grandmaster}
                    alt="2e"
                    className="w-23 h-23 object-contain"
                  />
                </div>
                <div className="bg-gray-100 p-4 rounded-lg">
                  <Link
                    to={`/profile/${topPlayers[1].trigramme}`}
                    className="text-blue-500 hover:underline font-bold"
                  >
                    {topPlayers[1].trigramme}
                  </Link>
                  <p className="text-gray-600">
                    {topPlayers[1].win_percentage.toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-500">
                    {topPlayers[1].games_played} PJ
                  </p>
                </div>
              </div>
            )}
            {topPlayers[0] && (
              <div className="text-center -mb-4">
                <div className="w-28 h-40 bg-[#0342AF]/10 rounded-t-lg flex items-center justify-center mb-4">
                  <img
                    src={challenger}
                    alt="1er"
                    className="w-23 h-23 object-contain"
                  />
                </div>
                <div className="bg-[#0342AF]/10 p-4 rounded-lg">
                  <Link
                    to={`/profile/${topPlayers[0].trigramme}`}
                    className="text-blue-500 hover:underline font-bold"
                  >
                    {topPlayers[0].trigramme}
                  </Link>
                  <p className="text-gray-600 font-semibold">
                    {topPlayers[0].win_percentage.toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-500">
                    {topPlayers[0].games_played} PJ
                  </p>
                </div>
              </div>
            )}
            {topPlayers[2] && (
              <div className="text-center -mb-2">
                <div className="w-24 h-28 bg-orange-100 rounded-t-lg flex items-center justify-center mb-4">
                  <img
                    src={master}
                    alt="3e"
                    className="w-23 h-23 object-contain"
                  />
                </div>
                <div className="bg-orange-100 p-4 rounded-lg">
                  <Link
                    to={`/profile/${topPlayers[2].trigramme}`}
                    className="text-blue-500 hover:underline font-bold"
                  >
                    {topPlayers[2].trigramme}
                  </Link>
                  <p className="text-gray-600">
                    {topPlayers[2].win_percentage.toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-500">
                    {topPlayers[2].games_played} PJ
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {worstPlayers.length > 0 && (
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h2 className="text-2xl font-bold text-center mb-8">
            Les joueurs en difficultés...
          </h2>
          <div className="flex justify-center items-end space-x-3 sm:space-x-8 mb-8">
            {worstPlayers[1] && (
              <div className="text-center">
                <div className="w-24 h-32 bg-gray-100 rounded-t-lg flex items-center justify-center mb-4">
                  <img src={argent} alt="2e" className="w-25 h-25" />
                </div>
                <div className="bg-gray-100 p-4 rounded-lg">
                  <Link
                    to={`/profile/${worstPlayers[1].trigramme}`}
                    className="text-blue-500 hover:underline font-bold"
                  >
                    {worstPlayers[1].trigramme}
                  </Link>
                  <p className="text-gray-600">
                    {worstPlayers[1].win_percentage.toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-500">
                    {worstPlayers[1].games_played} PJ
                  </p>
                </div>
              </div>
            )}
            {worstPlayers[0] && (
              <div className="text-center -mb-4">
                <div className="w-28 h-40 bg-red-100 rounded-t-lg flex items-center justify-center mb-4">
                  <img src={bronze} alt="1er" className="w-25 h-25" />
                </div>
                <div className="bg-red-100 p-4 rounded-lg">
                  <Link
                    to={`/profile/${worstPlayers[0].trigramme}`}
                    className="text-blue-500 hover:underline font-bold"
                  >
                    {worstPlayers[0].trigramme}
                  </Link>
                  <p className="text-gray-600 font-semibold">
                    {worstPlayers[0].win_percentage.toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-500">
                    {worstPlayers[0].games_played} PJ
                  </p>
                </div>
              </div>
            )}
            {worstPlayers[2] && (
              <div className="text-center">
                <div className="w-24 h-28 bg-orange-100 rounded-t-lg flex items-center justify-center mb-4">
                  <img src={or} alt="3e" className="w-25 h-25" />
                </div>
                <div className="bg-orange-100 p-4 rounded-lg">
                  <Link
                    to={`/profile/${worstPlayers[2].trigramme}`}
                    className="text-blue-500 hover:underline font-bold"
                  >
                    {worstPlayers[2].trigramme}
                  </Link>
                  <p className="text-gray-600">
                    {worstPlayers[2].win_percentage.toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-500">
                    {worstPlayers[2].games_played} PJ
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🔥 Dernières parties en dehors des autres blocs */}
      {recentGames.length > 0 && (
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h3 className="text-xl font-semibold text-center mb-6">
            Derniers combats
          </h3>
          <div className="space-y-4">
            {recentGames.map((game) => (
              <div
                key={game.id}
                className="bg-gray-100 border border-gray-300 p-4 rounded-xl shadow-sm text-sm flex flex-col gap-3"
              >
                <div className="text-center text-xs text-gray-500">
                  {new Date(game.created_at).toLocaleDateString()}
                </div>
                <div className="flex items-center justify-center gap-2 text-xl font-bold text-gray-800">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded shadow">
                    {playersMap[game.winning_team_player1_id]} &{" "}
                    {playersMap[game.winning_team_player2_id]}
                  </span>
                  <span className="text-red-600 text-sm font-black tracking-wide px-3">
                    VS
                  </span>
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded shadow">
                    {playersMap[game.losing_team_player1_id]} &{" "}
                    {playersMap[game.losing_team_player2_id]}
                  </span>
                </div>
                <div className="text-center text-sm font-medium text-gray-700 mt-2">
                  Score final : {game.score_nous} - {game.score_eux}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
