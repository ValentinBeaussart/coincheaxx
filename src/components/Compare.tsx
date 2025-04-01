// ComparePage complet avec toutes les améliorations et logique principale intégrée

import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";
import {
  Award,
  Target,
  Percent,
  XCircle,
  BarChart2,
  Activity,
  Swords,
  Handshake,
  PieChart,
  Flame,
} from "lucide-react";
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
  PolarRadiusAxis,
} from "recharts";

interface ProfileData {
  id: string;
  trigramme: string;
  games_played: number;
  games_won: number;
  games_lost: number;
  win_percentage: number;
}

function Stat({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`p-3 rounded-md shadow-sm transition text-center ${
        highlight ? "bg-yellow-50 border border-yellow-300" : "bg-gray-50"
      }`}
    >
      <div className="flex items-center justify-center mb-1">{icon}</div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-lg font-bold text-gray-800">{value}</p>
    </div>
  );
}

function ScoreCard({ profile }: { profile: ProfileData }) {
  const score = Math.round(
    (profile.games_won / Math.max(1, profile.games_played)) * 100 +
      profile.games_played / 10
  );
  return (
    <Stat
      icon={<Flame className="text-orange-500" />}
      label="Score global"
      value={score}
      highlight
    />
  );
}

// function SummaryTable({ p1, p2 }: { p1: ProfileData; p2: ProfileData }) {
//   return (
//     <div className="overflow-x-auto mt-10">
//       <table className="w-full text-sm text-left border-collapse">
//         <thead className="bg-gray-100 text-gray-700">
//           <tr>
//             <th className="p-2">Statistique</th>
//             <th className="p-2 text-center">{p1.trigramme}</th>
//             <th className="p-2 text-center">{p2.trigramme}</th>
//           </tr>
//         </thead>
//         <tbody className="text-gray-800">
//           <tr className="border-t">
//             <td className="p-2">Parties jouées</td>
//             <td className="p-2 text-center">{p1.games_played}</td>
//             <td className="p-2 text-center">{p2.games_played}</td>
//           </tr>
//           <tr className="border-t">
//             <td className="p-2">Victoires</td>
//             <td className="p-2 text-center">{p1.games_won}</td>
//             <td className="p-2 text-center">{p2.games_won}</td>
//           </tr>
//           <tr className="border-t">
//             <td className="p-2">Défaites</td>
//             <td className="p-2 text-center">{p1.games_lost}</td>
//             <td className="p-2 text-center">{p2.games_lost}</td>
//           </tr>
//           <tr className="border-t">
//             <td className="p-2">% Victoire</td>
//             <td className="p-2 text-center">{p1.win_percentage.toFixed(1)}%</td>
//             <td className="p-2 text-center">{p2.win_percentage.toFixed(1)}%</td>
//           </tr>
//           <tr className="border-t">
//             <td className="p-2">Score global</td>
//             <td className="p-2 text-center">{Math.round((p1.games_won / Math.max(1, p1.games_played)) * 100 + p1.games_played / 10)}</td>
//             <td className="p-2 text-center">{Math.round((p2.games_won / Math.max(1, p2.games_played)) * 100 + p2.games_played / 10)}</td>
//           </tr>
//         </tbody>
//       </table>
//     </div>
//   );
// }

function AutocompleteInput({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder: string;
}) {
  return (
    <div className="relative w-full max-w-xs">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-md px-4 py-2"
        list="trigrammes"
      />
      <datalist id="trigrammes">
        {options.map((opt) => (
          <option key={opt} value={opt} />
        ))}
      </datalist>
    </div>
  );
}

export default function ComparePage() {
  const [trigramme1, setTrigramme1] = useState("");
  const [trigramme2, setTrigramme2] = useState("");
  const [profile1, setProfile1] = useState<ProfileData | null>(null);
  const [profile2, setProfile2] = useState<ProfileData | null>(null);
  const [allTrigrammes, setAllTrigrammes] = useState<string[]>([]);
  const [duoStats, setDuoStats] = useState<{
    wins: number;
    losses: number;
  } | null>(null);
  const [vsStats, setVsStats] = useState<{
    wins: number;
    losses: number;
  } | null>(null);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("trigramme")
      .then(({ data }) => {
        if (data) setAllTrigrammes(data.map((p) => p.trigramme));
      });
  }, []);

  async function handleCompare() {
    const { data: p1 } = await supabase
      .from("profiles")
      .select("*")
      .eq("trigramme", trigramme1)
      .single();
    const { data: p2 } = await supabase
      .from("profiles")
      .select("*")
      .eq("trigramme", trigramme2)
      .single();
    if (!p1 || !p2) return;
    setProfile1(p1);
    setProfile2(p2);

    const orClause = `winning_team_player1_id.eq.${p1.id},winning_team_player2_id.eq.${p1.id},losing_team_player1_id.eq.${p1.id},losing_team_player2_id.eq.${p1.id},winning_team_player1_id.eq.${p2.id},winning_team_player2_id.eq.${p2.id},losing_team_player1_id.eq.${p2.id},losing_team_player2_id.eq.${p2.id}`;
    const { data: gamesRaw } = await supabase
      .from("games")
      .select("*")
      .or(orClause);
    if (!gamesRaw) return;

    const duoGames = gamesRaw.filter((g) => {
      const win = [g.winning_team_player1_id, g.winning_team_player2_id];
      const lose = [g.losing_team_player1_id, g.losing_team_player2_id];
      return (
        (win.includes(p1.id) && win.includes(p2.id)) ||
        (lose.includes(p1.id) && lose.includes(p2.id))
      );
    });
    let duoWins = 0,
      duoLosses = 0;
    duoGames.forEach((g) => {
      const win = [g.winning_team_player1_id, g.winning_team_player2_id];
      if (win.includes(p1.id) && win.includes(p2.id)) duoWins++;
      else duoLosses++;
    });
    setDuoStats({ wins: duoWins, losses: duoLosses });

    const vsGames = gamesRaw.filter((g) => {
      const win = [g.winning_team_player1_id, g.winning_team_player2_id];
      const lose = [g.losing_team_player1_id, g.losing_team_player2_id];
      return (
        (win.includes(p1.id) && lose.includes(p2.id)) ||
        (win.includes(p2.id) && lose.includes(p1.id))
      );
    });
    let vsWins = 0,
      vsLosses = 0;
    vsGames.forEach((g) => {
      const win = [g.winning_team_player1_id, g.winning_team_player2_id];
      const lose = [g.losing_team_player1_id, g.losing_team_player2_id];
      if (win.includes(p1.id) && lose.includes(p2.id)) vsWins++;
      if (win.includes(p2.id) && lose.includes(p1.id)) vsLosses++;
    });
    setVsStats({ wins: vsWins, losses: vsLosses });
  }

  const synergyScore = duoStats
    ? Math.round((duoStats.wins / (duoStats.wins + duoStats.losses)) * 100)
    : null;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-12">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold text-gray-800 flex items-center justify-center mb-6">
          <PieChart className="w-8 h-8 mr-2 text-blue-600" /> Statistiques
        </h1>
        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          <AutocompleteInput
            value={trigramme1}
            onChange={setTrigramme1}
            options={allTrigrammes}
            placeholder="Trigramme Joueur 1"
          />
          <AutocompleteInput
            value={trigramme2}
            onChange={setTrigramme2}
            options={allTrigrammes}
            placeholder="Trigramme Joueur 2"
          />
          <button
            onClick={handleCompare}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Comparer
          </button>
        </div>
      </div>

      {profile1 && profile2 && (
        <div className="space-y-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[profile1, profile2].map((p, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-lg shadow-md text-center space-y-4"
              >
                <h2 className="text-2xl font-bold text-gray-800">
                  {p.trigramme}
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <Stat
                    icon={<Target className="text-blue-500" />}
                    label="Parties jouées"
                    value={p.games_played}
                  />
                  <Stat
                    icon={<Award className="text-green-500" />}
                    label="Victoires"
                    value={p.games_won}
                  />
                  <Stat
                    icon={<XCircle className="text-red-500" />}
                    label="Défaites"
                    value={p.games_lost}
                  />
                  <Stat
                    icon={<Percent className="text-yellow-500" />}
                    label="% Victoire"
                    value={`${p.win_percentage.toFixed(1)}%`}
                  />
                </div>
                <ScoreCard profile={p} />
              </div>
            ))}
          </div>

          {(duoStats || vsStats) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {duoStats && (
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h2 className="text-xl font-semibold mb-4 flex items-center justify-center gap-2">
                    <Handshake className="text-green-600" /> Statistiques en duo
                  </h2>
                  <div className="space-y-2 text-center">
                    <p className="text-gray-700">
                      Victoires ensemble : <strong>{duoStats.wins}</strong>
                    </p>
                    <p className="text-gray-700">
                      Défaites ensemble : <strong>{duoStats.losses}</strong>
                    </p>
                    {synergyScore !== null && (
                      <p className="text-gray-700">
                        Synergie d'équipe : <strong>{synergyScore}%</strong>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {vsStats && (
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h2 className="text-xl font-semibold mb-4 flex items-center justify-center gap-2">
                    <Swords className="text-red-600" /> Confrontation directe
                  </h2>
                  <div className="space-y-2 text-center">
                    <p className="text-gray-700">
                      {profile1.trigramme} a gagné{" "}
                      <strong>{vsStats.wins}</strong> fois contre{" "}
                      {profile2.trigramme}
                    </p>
                    <p className="text-gray-700">
                      {profile2.trigramme} a gagné{" "}
                      <strong>{vsStats.losses}</strong> fois contre{" "}
                      {profile1.trigramme}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-8">
            <h2 className="text-xl font-semibold flex items-center justify-center gap-2">
              <BarChart2 className="text-purple-600" /> Statistiques
              comparatives
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={[
                  {
                    name: "Parties jouées",
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
                ]}
              >
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar
                  dataKey={profile1.trigramme}
                  fill="#6366f1"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey={profile2.trigramme}
                  fill="#22c55e"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-8">
            <h2 className="text-xl font-semibold flex items-center justify-center gap-2">
              <Activity className="text-rose-600" /> Radar des performances
            </h2>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart
                outerRadius={150}
                data={[
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
                ]}
              >
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
                  stroke="#22c55e"
                  fill="#22c55e"
                  fillOpacity={0.6}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* <SummaryTable p1={profile1} p2={profile2} /> */}
        </div>
      )}
    </div>
  );
}
