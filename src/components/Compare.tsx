import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { Award, Target, Percent, XCircle, Users, BarChart2, Activity } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from "recharts";

interface ProfileData {
  id: string;
  trigramme: string;
  games_played: number;
  games_won: number;
  games_lost: number;
  win_percentage: number;
}

export default function ComparePage() {
    const [trigramme1, setTrigramme1] = useState("");
    const [trigramme2, setTrigramme2] = useState("");
    const [profile1, setProfile1] = useState<ProfileData | null>(null);
    const [profile2, setProfile2] = useState<ProfileData | null>(null);
    const [allTrigrammes, setAllTrigrammes] = useState<string[]>([]);
    const [error, setError] = useState("");
    const [duoStats, setDuoStats] = useState<{ wins: number; losses: number } | null>(null);
    const [vsStats, setVsStats] = useState<{ wins: number; losses: number } | null>(null);

  useEffect(() => {
    async function loadTrigrammes() {
      const { data, error } = await supabase.from("profiles").select("trigramme");
      if (!error && data) {
        setAllTrigrammes(data.map((p) => p.trigramme));
      }
    }
    loadTrigrammes();
  }, []);

  async function fetchProfile(trigramme: string): Promise<ProfileData | null> {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, trigramme, games_played, games_won, games_lost, win_percentage")
      .eq("trigramme", trigramme)
      .single();
    if (error) {
      console.error(error);
      return null;
    }
    return data;
  }

  async function handleCompare() {
    setError("");
    const [p1, p2] = await Promise.all([
      fetchProfile(trigramme1),
      fetchProfile(trigramme2),
    ]);

    if (!p1 || !p2) {
      setError("Impossible de charger les profils. Vérifie les trigrammes.");
      return;
    }

    setProfile1(p1);
    setProfile2(p2);

    // Statistiques en duo (même équipe)
    const { data: duoGames } = await supabase
      .from("games")
      .select("*")
      .or(`and(winning_team_player1_id.eq.${p1.id},winning_team_player2_id.eq.${p2.id}),
           and(winning_team_player1_id.eq.${p2.id},winning_team_player2_id.eq.${p1.id}),
           and(losing_team_player1_id.eq.${p1.id},losing_team_player2_id.eq.${p2.id}),
           and(losing_team_player1_id.eq.${p2.id},losing_team_player2_id.eq.${p1.id})`);

    if (duoGames) {
      let wins = 0;
      let losses = 0;
      for (const game of duoGames) {
        const ids = [game.winning_team_player1_id, game.winning_team_player2_id];
        if (ids.includes(p1.id) && ids.includes(p2.id)) wins++;
        else losses++;
      }
      setDuoStats({ wins, losses });
    }

    // Statistiques l’un contre l’autre
    const { data: vsGames } = await supabase
      .from("games")
      .select("*")
      .or(`and(winning_team_player1_id.eq.${p1.id},losing_team_player1_id.eq.${p2.id}),
           and(winning_team_player1_id.eq.${p2.id},losing_team_player1_id.eq.${p1.id}),
           and(winning_team_player2_id.eq.${p1.id},losing_team_player2_id.eq.${p2.id}),
           and(winning_team_player2_id.eq.${p2.id},losing_team_player2_id.eq.${p1.id})`);

    if (vsGames) {
      let p1Wins = 0;
      let p1Losses = 0;
      for (const game of vsGames) {
        const isP1Winner = [game.winning_team_player1_id, game.winning_team_player2_id].includes(p1.id);
        const isP2Loser = [game.losing_team_player1_id, game.losing_team_player2_id].includes(p2.id);
        const isP2Winner = [game.winning_team_player1_id, game.winning_team_player2_id].includes(p2.id);
        const isP1Loser = [game.losing_team_player1_id, game.losing_team_player2_id].includes(p1.id);

        if (isP1Winner && isP2Loser) p1Wins++;
        if (isP2Winner && isP1Loser) p1Losses++;
      }
      setVsStats({ wins: p1Wins, losses: p1Losses });
    }
  }


  function renderProfile(profile: ProfileData | null) {
    if (!profile) return null;
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center space-y-4">
        <h2 className="text-2xl font-bold text-gray-800">{profile.trigramme}</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <Target className="w-6 h-6 text-blue-500 mx-auto mb-1" />
            <p className="text-sm">Jouées</p>
            <p className="text-lg font-bold">{profile.games_played}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <Award className="w-6 h-6 text-green-500 mx-auto mb-1" />
            <p className="text-sm">Victoires</p>
            <p className="text-lg font-bold">{profile.games_won}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <XCircle className="w-6 h-6 text-red-500 mx-auto mb-1" />
            <p className="text-sm">Défaites</p>
            <p className="text-lg font-bold">{profile.games_lost}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <Percent className="w-6 h-6 text-yellow-500 mx-auto mb-1" />
            <p className="text-sm">% Victoires</p>
            <p className="text-lg font-bold">{profile.win_percentage.toFixed(1)}%</p>
          </div>
        </div>
      </div>
    );
  }

  const chartData = profile1 && profile2 ? [
    {
      name: "Jouées",
      [profile1.trigramme]: profile1.games_played,
      [profile2.trigramme]: profile2.games_played,
    },
    {
      name: "Victoires",
      [profile1.trigramme]: profile1.games_won,
      [profile2.trigramme]: profile2.games_won,
    },
    {
      name: "Défaites",
      [profile1.trigramme]: profile1.games_lost,
      [profile2.trigramme]: profile2.games_lost,
    },
    {
      name: "% Victoire",
      [profile1.trigramme]: profile1.win_percentage,
      [profile2.trigramme]: profile2.win_percentage,
    },
  ] : [];

  const radarData = profile1 && profile2 ? [
    {
      stat: "Jouées",
      [profile1.trigramme]: profile1.games_played,
      [profile2.trigramme]: profile2.games_played,
    },
    {
      stat: "Victoires",
      [profile1.trigramme]: profile1.games_won,
      [profile2.trigramme]: profile2.games_won,
    },
    {
      stat: "Défaites",
      [profile1.trigramme]: profile1.games_lost,
      [profile2.trigramme]: profile2.games_lost,
    },
    {
      stat: "% Victoires",
      [profile1.trigramme]: profile1.win_percentage,
      [profile2.trigramme]: profile2.win_percentage,
    },
  ] : [];

  const synergyScore = duoStats
    ? Math.round((duoStats.wins / (duoStats.wins + duoStats.losses)) * 100)
    : null;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-8 flex items-center justify-center">
        <Users className="w-7 h-7 mr-2 text-blue-600" /> Comparaison de joueurs
      </h1>

      <div className="flex justify-center space-x-4 mb-8">
        <select
          value={trigramme1}
          onChange={(e) => setTrigramme1(e.target.value)}
          className="border px-4 py-2 rounded-lg text-sm shadow-sm"
        >
          <option value="">Choisir joueur 1</option>
          {allTrigrammes.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <select
          value={trigramme2}
          onChange={(e) => setTrigramme2(e.target.value)}
          className="border px-4 py-2 rounded-lg text-sm shadow-sm"
        >
          <option value="">Choisir joueur 2</option>
          {allTrigrammes.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <button
          onClick={handleCompare}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Comparer
        </button>
      </div>

      {error && <p className="text-center text-red-500 mb-4">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderProfile(profile1)}
        {renderProfile(profile2)}
      </div>

      {chartData.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-center mb-4 flex items-center justify-center">
            <BarChart2 className="w-5 h-5 mr-2 text-purple-600" /> Comparaison visuelle
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey={profile1.trigramme} fill="#4f46e5" />
              <Bar dataKey={profile2.trigramme} fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {radarData.length > 0 && (
        <div className="mt-16">
          <h2 className="text-xl font-bold text-center mb-4 flex items-center justify-center">
            <Activity className="w-5 h-5 mr-2 text-rose-600" /> Radar des performances
          </h2>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart outerRadius={150} data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="stat" />
              <PolarRadiusAxis />
              <Radar
                name={profile1.trigramme}
                dataKey={profile1.trigramme}
                stroke="#6366f1"
                fill="#6366f1"
                fillOpacity={0.6}
              />
              <Radar
                name={profile2.trigramme}
                dataKey={profile2.trigramme}
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.6}
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

  
{duoStats && (
        <div className="mt-12 text-center">
          <h2 className="text-xl font-bold mb-2">Statistiques en duo</h2>
          <p className="text-gray-700">Victoires ensemble : <strong>{duoStats.wins}</strong></p>
          <p className="text-gray-700">Défaites ensemble : <strong>{duoStats.losses}</strong></p>
          {synergyScore !== null && (
            <p className="text-gray-700">Synergie d'équipe : <strong>{synergyScore}%</strong></p>
          )}
        </div>
      )}

      {vsStats && (
        <div className="mt-8 text-center">
          <h2 className="text-xl font-bold mb-2">Statistiques en confrontation directe</h2>
          <p className="text-gray-700">{profile1?.trigramme} a gagné <strong>{vsStats.wins}</strong> fois contre {profile2?.trigramme}</p>
          <p className="text-gray-700">{profile2?.trigramme} a gagné <strong>{vsStats.losses}</strong> fois contre {profile1?.trigramme}</p>
        </div>
      )}

    </div>
  );
}

