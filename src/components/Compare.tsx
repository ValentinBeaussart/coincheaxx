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
  bestDuo?: { trigramme: string; games: number; winRate: number };
  worstDuo?: { trigramme: string; games: number; winRate: number };
}

function Stat({
  icon,
  label,
  value,
  highlight = false,
  className = "",
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  highlight?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`p-3 rounded-md shadow-sm transition text-center ${highlight ? "bg-yellow-50 border border-yellow-300" : "border-gray-300"
        } ${className}`}
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
    <div className="grid grid-cols-1 gap-3">
      <Stat
        icon={<Flame className="text-orange-500" />}
        label="Score global"
        value={score}
        highlight
      />

      {profile.bestDuo ? (
        <Stat
          icon={<Handshake className="text-green-600" />}
          label={`Meilleur duo : ${profile.bestDuo.trigramme}`}
          value={`${profile.bestDuo.winRate.toFixed(1)}% (${profile.bestDuo.games} parties)`}
          className="bg-green-50 border border-green-200"
        />
      ) : (
        <Stat
          icon={<Handshake className="text-gray-400" />}
          label="Meilleur duo"
          value="N/A"
          className="bg-gray-50 border border-gray-200"
        />
      )}
      {profile.worstDuo ? (
        <Stat
          icon={<Handshake className="text-red-600" />}
          label={`Pire duo : ${profile.worstDuo.trigramme}`}
          value={`${profile.worstDuo.winRate.toFixed(1)}% (${profile.worstDuo.games} parties)`}
          className="bg-red-50 border border-red-200"
        />
      ) : (
        <Stat
          icon={<Handshake className="text-gray-400" />}
          label="Pire duo"
          value="N/A"
          className="bg-gray-50 border border-gray-200"
        />
      )}

    </div>
  );
}

async function getBestAndWorstDuos(playerId: string, allProfiles: ProfileData[]) {
  const { data: games } = await supabase
    .from("games")
    .select("*")
    .or(
      `winning_team_player1_id.eq.${playerId},winning_team_player2_id.eq.${playerId},losing_team_player1_id.eq.${playerId},losing_team_player2_id.eq.${playerId}`
    );

  if (!games) return { bestDuo: null, worstDuo: null };

  const teammatesStats: Record<string, { wins: number; total: number }> = {};

  for (const game of games) {
    const isWin =
      game.winning_team_player1_id === playerId ||
      game.winning_team_player2_id === playerId;
    const teamIds = isWin
      ? [game.winning_team_player1_id, game.winning_team_player2_id]
      : [game.losing_team_player1_id, game.losing_team_player2_id];

    const teammateId = teamIds.find((id) => id !== playerId);
    if (!teammateId) continue;

    if (!teammatesStats[teammateId]) {
      teammatesStats[teammateId] = { wins: 0, total: 0 };
    }

    teammatesStats[teammateId].total++;
    if (isWin) teammatesStats[teammateId].wins++;
  }

  const filtered = Object.entries(teammatesStats)
    .map(([id, { wins, total }]) => ({
      id,
      games: total,
      winRate: (wins / total) * 100,
    }))
    .filter((entry) => {
      const currentPlayer = allProfiles.find((p) => p.id === playerId);
      if (!currentPlayer) return false;
      return currentPlayer.games_played < 10 || entry.games >= 4;
    });

  if (filtered.length === 0) return { bestDuo: null, worstDuo: null };

  let bestDuo = null;
  let worstDuo = null;

  const hasLossesWithSomeone = filtered.some((entry) => entry.winRate < 100);

  if (hasLossesWithSomeone) {
    const worst = filtered.reduce((a, b) => (a.winRate < b.winRate ? a : b));
    if (worst.winRate < 100) {
      const worstTrigramme = allProfiles.find((p) => p.id === worst.id)?.trigramme || "?";
      worstDuo = {
        trigramme: worstTrigramme,
        games: worst.games,
        winRate: worst.winRate,
      };
    }
  }

  const totalWins = filtered.reduce((acc, curr) => acc + (curr.winRate > 0 ? 1 : 0), 0);
  if (totalWins > 0) {
    const best = filtered.reduce((a, b) => (a.winRate > b.winRate ? a : b));
    const bestTrigramme = allProfiles.find((p) => p.id === best.id)?.trigramme || "?";
    bestDuo = {
      trigramme: bestTrigramme,
      games: best.games,
      winRate: best.winRate,
    };
  }

  return { bestDuo, worstDuo };
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

function SelectInput({ value, onChange, options, disabledOption, placeholder }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border border-gray-300 rounded-md px-4 py-2"
    >
      <option value="" disabled hidden>{placeholder}</option>
      {options.map((opt) => (
        <option key={opt} value={opt} disabled={opt === disabledOption}>
          {opt}
        </option>
      ))}
    </select>
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
    points?: number;
  } | null>(null);

  const [vsStats, setVsStats] = useState<{
    wins: number;
    losses: number;
    p1Points?: number;
    p2Points?: number;
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
    if (trigramme1 === trigramme2) {
      alert(
        "Veuillez sélectionner deux joueurs différents pour la comparaison."
      );
      return;
    }
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
    const profiles = await supabase.from("profiles").select("*");
    const allProfiles = profiles.data || [];

    const p1Duos = await getBestAndWorstDuos(p1.id, allProfiles);
    const p2Duos = await getBestAndWorstDuos(p2.id, allProfiles);

    setProfile1({ ...p1, ...p1Duos });
    setProfile2({ ...p2, ...p2Duos });

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
    const duoPoints = duoGames.reduce((acc, game) => {
      const isWin = [game.winning_team_player1_id, game.winning_team_player2_id].includes(p1.id) &&
        [game.winning_team_player1_id, game.winning_team_player2_id].includes(p2.id);
      const isLose = [game.losing_team_player1_id, game.losing_team_player2_id].includes(p1.id) &&
        [game.losing_team_player1_id, game.losing_team_player2_id].includes(p2.id);

      if (isWin) return acc + game.score_nous;
      if (isLose) return acc + game.score_eux;
      return acc;
    }, 0);

    // POINTS EN CONFRONTATION DIRECTE
    let p1PointsVs = 0;
    let p2PointsVs = 0;

    vsGames.forEach((game) => {
      const winTeam = [game.winning_team_player1_id, game.winning_team_player2_id];
      const loseTeam = [game.losing_team_player1_id, game.losing_team_player2_id];

      if (winTeam.includes(p1.id) && loseTeam.includes(p2.id)) {
        p1PointsVs += game.score_nous;
        p2PointsVs += game.score_eux;
      } else if (winTeam.includes(p2.id) && loseTeam.includes(p1.id)) {
        p2PointsVs += game.score_nous;
        p1PointsVs += game.score_eux;
      }
    });

    setDuoStats((prev) => prev ? { ...prev, points: duoPoints } : null);
    setVsStats((prev) =>
      prev ? { ...prev, p1Points: p1PointsVs, p2Points: p2PointsVs } : null
    );
  }

  const synergyScore =
    duoStats && (duoStats.wins + duoStats.losses) > 0
      ? Math.round((duoStats.wins / (duoStats.wins + duoStats.losses)) * 100)
      : null;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-12">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold text-gray-800 flex items-center justify-center mb-6">
          <PieChart className="w-8 h-8 mr-2 text-blue-600" /> Statistiques
        </h1>
        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          <SelectInput
            value={trigramme1}
            onChange={setTrigramme1}
            options={allTrigrammes}
            disabledOption={trigramme2}
            placeholder="Trigramme Joueur 1"
          />
          <SelectInput
            value={trigramme2}
            onChange={setTrigramme2}
            options={allTrigrammes}
            disabledOption={trigramme1}
            placeholder="Trigramme Joueur 2"
          />
          <button
            onClick={handleCompare}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            disabled={!trigramme1 || !trigramme2}
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
                    className="bg-blue-50"
                  />
                  <Stat
                    icon={<Award className="text-green-500" />}
                    label="Victoires"
                    value={p.games_won}
                    className="bg-green-50"
                  />
                  <Stat
                    icon={<XCircle className="text-red-500" />}
                    label="Défaites"
                    value={p.games_lost}
                    className="bg-red-50"
                  />
                  <Stat
                    icon={<Percent className="text-yellow-500" />}
                    label="% Victoire"
                    value={`${p.win_percentage.toFixed(1)}%`}
                    className="bg-yellow-50"
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
                    {duoStats.points !== undefined && (
                      <p className="text-gray-700">
                        Points cumulés ensemble : <strong>{duoStats.points}</strong>
                      </p>
                    )}
                    {synergyScore !== null ? (
                      <p className="text-gray-700">
                        Synergie d'équipe : <strong>{synergyScore}%</strong>
                      </p>
                    ) : (
                      <p className="text-gray-700">
                        Synergie d'équipe : <strong>N/A</strong>
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
                    {vsStats.p1Points !== undefined && vsStats.p2Points !== undefined && (
                      <>
                        <p className="text-gray-700">
                          {profile1.trigramme} a marqué{" "}
                          <strong>{vsStats.p1Points}</strong> points contre{" "}
                          {profile2.trigramme}
                        </p>
                        <p className="text-gray-700">
                          {profile2.trigramme} a marqué{" "}
                          <strong>{vsStats.p2Points}</strong> points contre{" "}
                          {profile1.trigramme}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-8">
            <div className="bg-white shadow-md rounded-lg p-4 overflow-x-auto">
              <h2 className="text-xl font-semibold flex items-center justify-center gap-2 mb-4">
                <BarChart2 className="text-purple-600" /> Statistiques
                comparatives
              </h2>

              <ResponsiveContainer width="100%" height={300} minWidth={600}>
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

            <div className="bg-white shadow-md rounded-lg p-4 overflow-x-auto">
              <h2 className="text-xl font-semibold flex items-center justify-center gap-2 mb-4">
                <Activity className="text-rose-600" /> Radar des performances
              </h2>

              <ResponsiveContainer width="100%" height={400} minWidth={600}>
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
          </div>
        </div>
      )}
    </div>
  );
}
