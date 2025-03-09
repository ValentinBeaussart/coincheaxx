import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayCircle, Trophy, Medal, Club } from 'lucide-react';
import { supabase } from '../supabase';

interface TopPlayer {
  trigramme: string;
  win_percentage: number;
  games_played: number;
}

export default function Home() {
  const navigate = useNavigate();
  const [topPlayers, setTopPlayers] = useState<TopPlayer[]>([]);

  useEffect(() => {
    async function fetchTopPlayers() {
      const { data } = await supabase
        .from('profiles')
        .select('trigramme, win_percentage, games_played')
        .order('win_percentage', { ascending: false })
        .limit(3);

      if (data) {
        setTopPlayers(data);
      }
    }

    fetchTopPlayers();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white rounded-lg shadow-xl p-8 text-center">
        <div className="flex justify-center mb-6">
          <Club className="h-16 w-16 text-[#0342AF]" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Bienvenue sur Axxone Coinche
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Gardons une trace de nos parties et prouvons que Sir Marc n'est pas le meilleur !
        </p>
        <button
          onClick={() => navigate('/game')}
          className="inline-flex items-center px-6 py-3 bg-[#0342AF] text-white text-lg font-medium rounded-md hover:bg-[#0342AF]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0342AF]"
        >
          <PlayCircle className="h-6 w-6 mr-2" />
          Commencer une partie
        </button>
      </div>

      {topPlayers.length > 0 && (
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h2 className="text-2xl font-bold text-center mb-8">Les GOATS</h2>
          <div className="flex justify-center items-end space-x-4 mb-8">
            {/* Second Place */}
            {topPlayers[1] && (
              <div className="text-center">
                <div className="w-24 h-32 bg-gray-100 rounded-t-lg flex items-center justify-center mb-4">
                  <Medal className="w-12 h-12 text-gray-400" />
                </div>
                <div className="bg-gray-100 p-4 rounded-lg">
                  <p className="font-bold text-xl">{topPlayers[1].trigramme}</p>
                  <p className="text-gray-600">{topPlayers[1].win_percentage.toFixed(1)}%</p>
                  <p className="text-sm text-gray-500">{topPlayers[1].games_played} parties</p>
                </div>
              </div>
            )}

            {/* First Place */}
            {topPlayers[0] && (
              <div className="text-center -mb-4">
                <div className="w-28 h-40 bg-[#0342AF]/10 rounded-t-lg flex items-center justify-center mb-4">
                  <Trophy className="w-16 h-16 text-[#0342AF]" />
                </div>
                <div className="bg-[#0342AF]/10 p-4 rounded-lg">
                  <p className="font-bold text-2xl">{topPlayers[0].trigramme}</p>
                  <p className="text-gray-600 font-semibold">{topPlayers[0].win_percentage.toFixed(1)}%</p>
                  <p className="text-sm text-gray-500">{topPlayers[0].games_played} parties</p>
                </div>
              </div>
            )}

            {/* Third Place */}
            {topPlayers[2] && (
              <div className="text-center">
                <div className="w-24 h-28 bg-orange-100 rounded-t-lg flex items-center justify-center mb-4">
                  <Medal className="w-10 h-10 text-orange-500" />
                </div>
                <div className="bg-orange-100 p-4 rounded-lg">
                  <p className="font-bold text-lg">{topPlayers[2].trigramme}</p>
                  <p className="text-gray-600">{topPlayers[2].win_percentage.toFixed(1)}%</p>
                  <p className="text-sm text-gray-500">{topPlayers[2].games_played} parties</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}