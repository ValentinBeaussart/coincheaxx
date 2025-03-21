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

export default function Home() {
  const [topPlayers, setTopPlayers] = useState<Player[]>([]);
  const [worstPlayers, setWorstPlayers] = useState<Player[]>([]);

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
          .slice(0, 3);
        worstFiltered.sort((a, b) => a.win_percentage - b.win_percentage);

        setTopPlayers(topFiltered);
        setWorstPlayers(worstFiltered);
      }
    }

    fetchPlayers();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {topPlayers.length > 0 && (
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h2 className="text-2xl font-bold text-center mb-8">Les GOATS</h2>
          <div className="flex justify-center items-end space-x-3 sm:space-x-8 mb-8">
            {topPlayers[1] && (
              <div className="text-center">
                <div className="w-24 h-32 bg-gray-100 rounded-t-lg flex items-center justify-center mb-4">
                  <img src={grandmaster} alt="Garde" className="w-25 h-25" />
                </div>
                <div className="bg-gray-100 p-4 rounded-lg">
                  <Link
                    to={`/profile/${topPlayers[1].trigramme}`}
                    className="text-blue-500 hover:underline font-bold"
                  >
                    {topPlayers[1].trigramme}
                  </Link>{" "}
                  <p className="text-gray-600">
                    {topPlayers[1].win_percentage.toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-500">
                    {topPlayers[1].games_played} parties
                  </p>
                </div>
              </div>
            )}
            {topPlayers[0] && (
              <div className="text-center -mb-4">
                <div className="w-28 h-40 bg-[#0342AF]/10 rounded-t-lg flex items-center justify-center mb-4">
                  <img src={challenger} alt="Garde" className="w-25 h-25" />
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
                    {topPlayers[0].games_played} parties
                  </p>
                </div>
              </div>
            )}
            {topPlayers[2] && (
              <div className="text-center">
                <div className="w-24 h-28 bg-orange-100 rounded-t-lg flex items-center justify-center mb-4">
                  <img src={master} alt="Garde" className="w-25 h-25" />
                </div>
                <div className="bg-orange-100 p-4 rounded-lg">
                  <Link
                    to={`/profile/${topPlayers[2].trigramme}`}
                    className="text-blue-500 hover:underline font-bold"
                  >
                    {topPlayers[2].trigramme}
                  </Link>{" "}
                  <p className="text-gray-600">
                    {topPlayers[2].win_percentage.toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-500">
                    {topPlayers[2].games_played} parties
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
                  <img src={argent} alt="Garde" className="w-25 h-25" />
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
                    {worstPlayers[1].games_played} parties
                  </p>
                </div>
              </div>
            )}
            {worstPlayers[0] && (
              <div className="text-center -mb-4">
                <div className="w-28 h-40 bg-red-100 rounded-t-lg flex items-center justify-center mb-4">
                  <img src={bronze} alt="Garde" className="w-25 h-25" />
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
                    {worstPlayers[0].games_played} parties
                  </p>
                </div>
              </div>
            )}
            {worstPlayers[2] && (
              <div className="text-center">
                <div className="w-24 h-28 bg-orange-100 rounded-t-lg flex items-center justify-center mb-4">
                  <img src={or} alt="Garde" className="w-25 h-25" />
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
                    {worstPlayers[2].games_played} parties
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
