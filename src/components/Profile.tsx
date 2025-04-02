import React, { useEffect, useState, useMemo } from "react";
import {
  Trophy,
  Award,
  Target,
  XCircle,
  Percent,
  Clock,
  Skull,
} from "lucide-react";
import { supabase } from "../supabase";
import { useAuth } from "../hooks/useAuth";
import { useParams, useNavigate } from "react-router-dom";
import UltimateBadge from "./UltimateBadge";
import Paysan from "../assets/icons/villager.svg";
import Forgeron from "../assets/icons/blacksmith.svg";
import Paysanne from "../assets/icons/paysanne.svg";
import Bouffon from "../assets/icons/jester.svg";
import Bourreau from "../assets/icons/executioner.svg";
import Roi from "../assets/icons/roi.svg";
import Garde from "../assets/icons/soldier.svg";
import Chevalier from "../assets/icons/knight.svg";
import Prince from "../assets/icons/prince.svg";
import Napoleon from "../assets/icons/napoleon.svg";
import Angry from "../assets/icons/angry.svg";
import Slayer from "../assets/icons/slayer.svg";
import Two from "../assets/icons/2kills.png";
import Three from "../assets/icons/3kills.png";
import Five from "../assets/icons/5kills.png";
import Ten from "../assets/icons/10kills.png";
import Nap from "../assets/icons/napnap.jpg";

import { Badge } from "../components/Badge";

interface ProfileData {
  id: string;
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
  status?: string;
}

export default function Profile() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [gameHistory, setGameHistory] = useState<GameHistory[]>([]);
  const [showAllGames, setShowAllGames] = useState(false);
  const [showLockedBadges, setShowLockedBadges] = useState(false);
  const [nemesis, setNemesis] = useState<string | null>(null);
  const [bestAlly, setBestAlly] = useState<string | null>(null);
  const [worstAlly, setWorstAlly] = useState<string | null>(null);
  const [playersMap, setPlayersMap] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const { trigramme } = useParams<{ trigramme?: string }>();

  useEffect(() => {
    async function loadProfile() {
      try {
        let targetTrigramme = trigramme;
        if (!targetTrigramme && session?.user) {
          const { data: userProfile, error: userProfileError } = await supabase
            .from("profiles")
            .select("trigramme")
            .eq("id", session.user.id)
            .single();

          if (userProfileError) throw userProfileError;
          targetTrigramme = userProfile.trigramme;
          navigate(`/profile/${targetTrigramme}`);
        }

        if (!targetTrigramme) return;

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("trigramme", targetTrigramme)
          .single();

        if (profileError) throw profileError;

        const { data: games, error: gamesError } = await supabase
          .from("games")
          .select("*")
          .or(
            `winning_team_player1_id.eq.${profileData.id},winning_team_player2_id.eq.${profileData.id},losing_team_player1_id.eq.${profileData.id},losing_team_player2_id.eq.${profileData.id}`
          )
          .order("created_at", { ascending: false });

        if (gamesError) throw gamesError;

        const playerIds = new Set<string>();
        games.forEach((game) => {
          playerIds.add(game.winning_team_player1_id);
          playerIds.add(game.winning_team_player2_id);
          playerIds.add(game.losing_team_player1_id);
          playerIds.add(game.losing_team_player2_id);
        });

        const { data: players, error: playersError } = await supabase
          .from("profiles")
          .select("id, trigramme")
          .in("id", Array.from(playerIds));

        if (playersError) throw playersError;

        const playerMap = Object.fromEntries(
          players.map((p) => [p.id, p.trigramme])
        );
        setPlayersMap(playerMap);

        setProfile(profileData);
        setGameHistory(games);

        const playerStats: Record<
          string,
          {
            winsWith: number;
            lossesWith: number;
            winsAgainst: number;
            lossesAgainst: number;
          }
        > = {};

        games.forEach((game) => {
          const isWinner =
            game.winning_team_player1_id === profileData.id ||
            game.winning_team_player2_id === profileData.id;

          const isLoser =
            game.losing_team_player1_id === profileData.id ||
            game.losing_team_player2_id === profileData.id;

          const teammates = isWinner
            ? [game.winning_team_player1_id, game.winning_team_player2_id]
            : [game.losing_team_player1_id, game.losing_team_player2_id];

          const opponents = isWinner
            ? [game.losing_team_player1_id, game.losing_team_player2_id]
            : [game.winning_team_player1_id, game.winning_team_player2_id];

          teammates.forEach((mate) => {
            if (mate === profileData.id) return;
            if (!playerStats[mate])
              playerStats[mate] = {
                winsWith: 0,
                lossesWith: 0,
                winsAgainst: 0,
                lossesAgainst: 0,
              };
            if (isWinner) playerStats[mate].winsWith++;
            else playerStats[mate].lossesWith++;
          });

          opponents.forEach((opponent) => {
            if (opponent === profileData.id) return;
            if (!playerStats[opponent])
              playerStats[opponent] = {
                winsWith: 0,
                lossesWith: 0,
                winsAgainst: 0,
                lossesAgainst: 0,
              };
            if (isLoser) playerStats[opponent].winsAgainst++;
            else playerStats[opponent].lossesAgainst++;
          });
        });

        function getBestAlly(stats: typeof playerStats) {
          let bestId = "";
          let bestRatio = -1;

          for (const [id, stat] of Object.entries(stats)) {
            const total = stat.winsWith + stat.lossesWith;
            if (total >= 3) {
              const ratio = stat.winsWith / total;
              if (ratio > bestRatio) {
                bestRatio = ratio;
                bestId = id;
              }
            }
          }

          return bestId;
        }

        function getWorstAlly(stats: typeof playerStats) {
          let worstId = "";
          let worstRatio = Infinity;

          for (const [id, stat] of Object.entries(stats)) {
            const total = stat.winsWith + stat.lossesWith;
            if (total >= 3) {
              const ratio = stat.winsWith / total;
              if (ratio < worstRatio) {
                worstRatio = ratio;
                worstId = id;
              }
            }
          }

          return worstId;
        }

        function getNemesis(stats: typeof playerStats) {
          let nemesisId = "";
          let maxLosses = 0;

          for (const [id, stat] of Object.entries(stats)) {
            if (stat.lossesAgainst > maxLosses) {
              maxLosses = stat.lossesAgainst;
              nemesisId = id;
            }
          }

          return nemesisId;
        }

        setBestAlly(playerMap[getBestAlly(playerStats)] || "N/A");
        setWorstAlly(playerMap[getWorstAlly(playerStats)] || "N/A");
        setNemesis(playerMap[getNemesis(playerStats)] || "N/A");
      } catch (error: any) {
        setError(error.message);
      }
    }

    loadProfile();
  }, [trigramme, session]);

  const marcId = useMemo(() => {
    return Object.entries(playersMap).find(([, trig]) => trig === "MBA")?.[0];
  }, [playersMap]);

  const winsAgainstMarc = useMemo(() => {
    if (!profile?.id || !marcId) return 0;
    return gameHistory.filter(
      (game) =>
        (game.winning_team_player1_id === profile.id ||
          game.winning_team_player2_id === profile.id) &&
        (game.losing_team_player1_id === marcId ||
          game.losing_team_player2_id === marcId)
    ).length;
  }, [gameHistory, profile?.id, marcId]);

  const consecutiveWins = useMemo(() => {
    if (!profile?.id) return 0;
    const startDate = new Date("2025-03-24");
    const filteredGames = gameHistory
      .filter((game) => new Date(game.created_at) >= startDate);
    return getBestConsecutiveWins(profile.id, filteredGames);
  }, [gameHistory, profile?.id]);

  const sadVBE = useMemo(() => {
    if (!profile?.id || !playersMap) return false;
    const vbeId = Object.entries(playersMap).find(
      ([, trig]) => trig === "VBE"
    )?.[0];
    if (!vbeId) return false;
    return gameHistory.some((game) => {
      const isVbeLoser = [
        game.losing_team_player1_id,
        game.losing_team_player2_id,
      ].includes(vbeId);
      const isPlayerWinner = [
        game.winning_team_player1_id,
        game.winning_team_player2_id,
      ].includes(profile.id);
      const isJune18 =
        new Date(game.created_at).getMonth() === 5 &&
        new Date(game.created_at).getDate() === 18;
      return isVbeLoser && isPlayerWinner && isJune18;
    });
  }, [gameHistory, profile?.id, playersMap]);

  function getBestConsecutiveWins(profileId: string, games: GameHistory[]): number {
    let maxStreak = 0;
    let currentStreak = 0;
  
    for (const game of [...games].sort((a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )) {
      const isWinner =
        game.winning_team_player1_id === profileId ||
        game.winning_team_player2_id === profileId;
      const isLoser =
        game.losing_team_player1_id === profileId ||
        game.losing_team_player2_id === profileId;
  
      if (!isWinner && !isLoser) continue;
  
      if (isWinner) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }
  
    return maxStreak;
  }  

  const badgeList = [
    {
      label: "Paysan",
      icon: <img src={Paysan} className="w-11 h-11" />,
      description: "Jouer 1 partie",
      condition: profile?.games_played >= 1,
      current: profile?.games_played || 0,
      target: 1,
      className: "yellow",
    },
    {
      label: "Bouffon",
      icon: <img src={Bouffon} className="w-11 h-11" />,
      description: "Jouer 10 parties",
      condition: profile?.games_played >= 10,
      current: profile?.games_played || 0,
      target: 10,
      className: "orange",
    },
    {
      label: "Forgeron",
      icon: <img src={Forgeron} className="w-11 h-11" />,
      description: "Jouer 30 parties",
      condition: profile?.games_played >= 30,
      current: profile?.games_played || 0,
      target: 30,
      className: "silver",
    },
    {
      label: "Prince",
      icon: <img src={Prince} className="w-11 h-11" />,
      description: "Jouer 50 parties",
      condition: profile?.games_played >= 50,
      current: profile?.games_played || 0,
      target: 50,
      className: "red",
    },
    {
      label: "Roi",
      icon: <img src={Roi} className="w-11 h-11" />,
      description: "Jouer 100 parties",
      condition: profile?.games_played >= 100,
      current: profile?.games_played || 0,
      target: 100,
      className: "purple",
    },
    {
      label: "Paysanne",
      icon: <img src={Paysanne} className="w-11 h-11" />,
      description: "Gagner 1 partie",
      condition: profile?.games_won >= 1,
      current: profile?.games_won || 0,
      target: 1,
      className: "teal",
    },
    {
      label: "Bourreau",
      icon: <img src={Bourreau} className="w-11 h-11" />,
      description: "Gagner 10 parties",
      condition: profile?.games_won >= 10,
      current: profile?.games_won || 0,
      target: 10,
      className: "blue",
    },
    {
      label: "Garde",
      icon: <img src={Garde} className="w-11 h-11" />,
      description: "Gagner 30 parties",
      condition: profile?.games_won >= 30,
      current: profile?.games_won || 0,
      target: 30,
      className: "pink",
    },
    {
      label: "Chevalier",
      icon: <img src={Chevalier} className="w-11 h-11" />,
      description: "Gagner 50 parties",
      condition: profile?.games_won >= 50,
      current: profile?.games_won || 0,
      target: 50,
      className: "green",
    },
    {
      label: "Napoléon",
      icon: <img src={Napoleon} className="w-11 h-11" />,
      description: "Gagner 100 parties",
      condition: profile?.games_won >= 100,
      current: profile?.games_won || 0,
      target: 100,
      className: "blue-dark",
    },
    {
      label: "Marc Bad Mood",
      icon: <img src={Angry} className="w-11 h-11" />,
      description: "Vaincre Marc 1 fois",
      condition: winsAgainstMarc >= 1,
      current: winsAgainstMarc,
      target: 1,
      className: "green-dark",
    },
    {
      label: "Marc Slayer",
      icon: <img src={Slayer} className="w-11 h-11" />,
      description: "Vaincre Marc 20 fois",
      condition: winsAgainstMarc >= 20,
      current: winsAgainstMarc,
      target: 20,
      className: "berry",
    },
    {
      label: "Double Kill",
      icon: <img src={Two} className="w-11 h-11" />,
      description: "2 victoires consécutives",
      condition: consecutiveWins >= 2,
      current: consecutiveWins,
      target: 2,
      className: "aqua-glow",
    },
    {
      label: "Triple Kill",
      icon: <img src={Three} className="w-11 h-11" />,
      description: "3 victoires consécutives",
      condition: consecutiveWins >= 3,
      current: consecutiveWins,
      target: 3,
      className: "night",
    },
    {
      label: "Penta Kill",
      icon: <img src={Five} className="w-11 h-11" />,
      description: "5 victoires consécutives",
      condition: consecutiveWins >= 5,
      current: consecutiveWins,
      target: 5,
      className: "sunset",
    },
    {
      label: "Holy Shit",
      icon: <img src={Ten} className="w-11 h-11" />,
      description: "10 victoires consécutives",
      condition: consecutiveWins >= 10,
      current: consecutiveWins,
      target: 10,
      className: "gold",
    },
    {
      label: "Sad VBE",
      icon: <img src={Nap} className="w-11 h-11 rounded-full" />,
      description: "Vaincre NapNap un 18 juin...",
      condition: sadVBE,
      current: sadVBE ? 1 : 0,
      target: 1,
      className: "gray-dark",
    },
  ];

  const hasUnlockedUltimateBadge =
    profile?.games_played >= 100 && profile?.games_won >= 100;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
        {/* En-tête du profil */}
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-gray-800">
            {profile?.trigramme}
          </h2>
        </div>

        <div className="flex justify-center mb-8">
          <UltimateBadge unlocked={hasUnlockedUltimateBadge} />
        </div>

        {/* Affichage des badges */}
        <div className="main-wrapper grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 justify-center mb-2">
          {badgeList
            .sort((a, b) => Number(!a.condition) - Number(!b.condition))
            .filter((badge) => {
              const trigramme = profile?.trigramme;
              if (!showLockedBadges && !badge.condition) return false;
              if (badge.label === "Sad VBE" && trigramme === "VBE")
                return false;
              if (
                ["Marc Bad Mood", "Marc Slayer"].includes(badge.label) &&
                trigramme === "MBA"
              )
                return false;
              return true;
            })
            .map((badge, index) => {
              const showProgress =
                !badge.condition &&
                badge.current !== undefined &&
                badge.target !== undefined;
              const percentage = showProgress
                ? Math.min(
                    100,
                    Math.round((badge.current / badge.target) * 100)
                  )
                : 0;
              return (
                <div
                  key={index}
                  className={`text-center transform transition-transform duration-200 hover:scale-105 hover:opacity-100 ${
                    badge.condition ? "" : "opacity-100"
                  } ${
                    badge.condition && badge.justUnlocked ? "animate-pulse" : ""
                  }`}
                  title={badge.description}
                >
                  <Badge
                    label={badge.label}
                    className={badge.className}
                    icon={badge.icon}
                    description={badge.description}
                    disabled={!badge.condition}
                    progress={
                      showProgress
                        ? `${badge.current}/${badge.target}`
                        : undefined
                    }
                  />
                  {showProgress && (
                    <div className="mt-2 px-2">
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-600 font-medium mt-1">
                        {badge.current}/{badge.target} ({percentage}%)
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
        </div>

        {/* Checkbox d'affichage améliorée */}
        <div className="mb-10 mt-6">
          <label className="inline-flex cursor-pointer">
            <span className="mr-3 text-sm text-gray-700 font-medium">
              Voir tous les badges
            </span>
            <div className="relative">
              <input
                type="checkbox"
                checked={showLockedBadges}
                onChange={(e) => setShowLockedBadges(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 transition-all"></div>
              <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white border rounded-full shadow transform peer-checked:translate-x-full transition-transform"></div>
            </div>
          </label>
        </div>

        {/* Statistiques du joueur */}
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

        {/* Infos alliés / ennemis */}
        <div className="p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-red-50 p-4 rounded-lg text-center w-full">
              <Skull className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Nemesis</p>
              <p className="text-lg font-bold text-gray-800">
                {nemesis || "N/A"}
              </p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg text-center w-full">
              <Award className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Meilleur allié</p>
              <p className="text-lg font-bold text-gray-800">
                {bestAlly || "N/A"}
              </p>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg text-center w-full">
              <XCircle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Pire allié</p>
              <p className="text-lg font-bold text-gray-800">
                {worstAlly || "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Historique des parties */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Historique des parties
          </h3>
          <div className="space-y-4">
            {gameHistory.length === 0 ? (
              <p className="text-center text-gray-500">Aucune partie jouée</p>
            ) : (
              gameHistory
                .slice(0, showAllGames ? gameHistory.length : 5)
                .map((game) => {
                  const isWinner =
                    game.winning_team_player1_id === profile?.id ||
                    game.winning_team_player2_id === profile?.id;
                  const isLoser =
                    game.losing_team_player1_id === profile?.id ||
                    game.losing_team_player2_id === profile?.id;

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
                              : "Match neutre"}
                          </span>
                          <span className="text-sm text-gray-600 ml-2">
                            {new Date(game.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-right font-bold">
                          {game.score_nous} - {game.score_eux}
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        <p>
                          <strong>Vainqueurs :</strong>{" "}
                          {playersMap[game.winning_team_player1_id]} &{" "}
                          {playersMap[game.winning_team_player2_id]}
                        </p>
                        <p>
                          <strong>Noobs :</strong>{" "}
                          {playersMap[game.losing_team_player1_id]} &{" "}
                          {playersMap[game.losing_team_player2_id]}
                        </p>
                      </div>
                    </div>
                  );
                })
            )}
          </div>

          {gameHistory.length > 5 && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setShowAllGames((prev) => !prev)}
                className="text-[#0342AF] font-medium hover:underline"
              >
                {showAllGames ? "Voir moins" : "Voir plus"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
