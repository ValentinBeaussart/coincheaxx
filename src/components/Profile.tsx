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
import Three from "../assets/icons/3.svg";
import Five from "../assets/icons/5.svg";
import Ten from "../assets/icons/10.svg";
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

        const playerStats: Record<string, { winsWith: number; lossesWith: number; winsAgainst: number; lossesAgainst: number }> = {};

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
            if (!playerStats[mate]) playerStats[mate] = { winsWith: 0, lossesWith: 0, winsAgainst: 0, lossesAgainst: 0 };
            if (isWinner) playerStats[mate].winsWith++;
            else playerStats[mate].lossesWith++;
          });

          opponents.forEach((opponent) => {
            if (opponent === profileData.id) return;
            if (!playerStats[opponent]) playerStats[opponent] = { winsWith: 0, lossesWith: 0, winsAgainst: 0, lossesAgainst: 0 };
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
    const today = new Date();
    const recentGames = gameHistory.filter(
      (game) => new Date(game.created_at).toDateString() === today.toDateString()
    );
    return getConsecutiveWins(profile.id, recentGames);
  }, [gameHistory, profile?.id]);

  const sadVBE = useMemo(() => {
    if (!profile?.id || !playersMap) return false;
  
    const vbeId = Object.entries(playersMap).find(([, trig]) => trig === "VBE")?.[0];
    if (!vbeId) return false;
  
    return gameHistory.some((game) => {
      const isVbeLoser = [game.losing_team_player1_id, game.losing_team_player2_id].includes(vbeId);
      const isPlayerWinner = [game.winning_team_player1_id, game.winning_team_player2_id].includes(profile.id);
      const isJune18 = new Date(game.created_at).getMonth() === 5 && new Date(game.created_at).getDate() === 18;
  
      return isVbeLoser && isPlayerWinner && isJune18;
    });
  }, [gameHistory, profile?.id, playersMap]);  

  function getConsecutiveWins(profileId: string, games: GameHistory[]): number {
    let streak = 0;
    for (const game of games) {
      const isWinner =
        game.winning_team_player1_id === profileId ||
        game.winning_team_player2_id === profileId;

      const isLoser =
        game.losing_team_player1_id === profileId ||
        game.losing_team_player2_id === profileId;

      if (!isWinner && !isLoser) continue;

      if (isWinner) streak++;
      else break;
    }
    return streak;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            {/* <User className="w-8 h-8 text-[#0342AF] mr-2" /> */}
            {/* <h1 className="text-3xl font-bold">Profil</h1> */}
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
              {/* <p className="text-gray-600 mt-2">
                Membre depuis{" "}
                {new Date(session?.user?.created_at || "").toLocaleDateString()}
              </p> */}
            </div>

            <div className="main-wrapper grid grid-cols-2 lg:grid-cols-5 gap-6 justify-center mb-14">
              {[
                {
                  condition: profile?.games_played >= 1,
                  label: "Paysan",
                  className: "yellow",
                  description: "Jouer 1 partie",
                  icon: <img src={Paysan} alt="Paysan" className="w-11 h-11" />,
                },
                {
                  condition: profile?.games_played >= 10,
                  label: "Bouffon",
                  className: "orange",
                  description: "Jouer 10 parties",
                  icon: (
                    <img src={Bouffon} alt="Bouffon" className="w-11 h-11" />
                  ),
                },
                {
                  condition: profile?.games_played >= 30,
                  label: "Forgeron",
                  className: "silver",
                  description: "Jouer 30 parties",
                  icon: (
                    <img src={Forgeron} alt="Forgeron" className="w-11 h-11" />
                  ),
                },
                {
                  condition: profile?.games_played >= 50,
                  label: "Prince",
                  className: "red",
                  description: "Jouer 50 parties",
                  icon: <img src={Prince} alt="Prince" className="w-11 h-11" />,
                },
                {
                  condition: profile?.games_played >= 100,
                  label: "Roi",
                  className: "purple",
                  description: "Jouer 100 parties",
                  icon: <img src={Roi} alt="Roi" className="w-11 h-11" />,
                },
                {
                  condition: profile?.games_won >= 1,
                  label: "Paysanne",
                  className: "teal",
                  description: "Gagner 1 partie",
                  icon: (
                    <img src={Paysanne} alt="Paysanne" className="w-11 h-11" />
                  ),
                },
                {
                  condition: profile?.games_won >= 10,
                  label: "Bourreau",
                  className: "blue",
                  description: "Gagner 10 parties",
                  icon: (
                    <img src={Bourreau} alt="Bourreau" className="w-11 h-11" />
                  ),
                },
                {
                  condition: profile?.games_won >= 30,
                  label: "Garde",
                  className: "pink",
                  description: "Gagner 30 parties",
                  icon: <img src={Garde} alt="Garde" className="w-11 h-11" />,
                },
                {
                  condition: profile?.games_won >= 50,
                  label: "Chevalier",
                  className: "green",
                  description: "Gagner 50 parties",
                  icon: (
                    <img
                      src={Chevalier}
                      alt="Chevalier"
                      className="w-11 h-11"
                    />
                  ),
                },
                {
                  condition: profile?.games_won >= 100,
                  label: "Napoléon",
                  className: "blue-dark",
                  description: "Gagner 100 parties",
                  icon: (
                    <img src={Napoleon} alt="Napoléon" className="w-11 h-11" />
                  ),
                },
                {
                  condition: winsAgainstMarc >= 1,
                  label: "Marc Bad Mood",
                  className: "green-dark",
                  description: "Vaincre Marc 1 fois",
                  icon: <img src={Angry} alt="Angry" className="w-11 h-11" />,
                },
                {
                  condition: winsAgainstMarc >= 20,
                  label: "Marc Slayer",
                  className: "berry",
                  description: "Vaincre Marc 20 fois",
                  icon: <img src={Slayer} alt="Slayer" className="w-11 h-11" />,
                },
                {
                  condition: consecutiveWins >= 3,
                  label: "Multi Kill",
                  className: "night",
                  description: "3 victoires consécutives",
                  icon: <img src={Three} alt="Three" className="w-11 h-11" />,
                },
                {
                  condition: consecutiveWins >= 5,
                  label: "Ultra Kill",
                  className: "sunset",
                  description: "5 victoires consécutives",
                  icon: <img src={Five} alt="Five" className="w-11 h-11" />,
                },
                {
                  condition: consecutiveWins >= 10,
                  label: "Holy Shit",
                  className: "gold",
                  description: "10 victoires consécutives",
                  icon: <img src={Ten} alt="Ten" className="w-11 h-11" />,
                },
                {
                  condition: sadVBE,
                  label: "Sad VBE",
                  className: "gray-dark",
                  description: "Vaincre NapNap un 18 juin...",
                  icon: <img src={Nap} alt="Nap" className="w-11 h-11 rounded-full" />,
                },

              ]
                .filter((badge) => badge.condition)
                .map((badge, index) => (
                  <Badge
                    key={index}
                    label={badge.label}
                    className={badge.className}
                    icon={badge.icon}
                    description={badge.description}
                  />
                ))}
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

            <div className="max-w-4xl mx-auto">
              <div className="p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Nemesis */}
                  <div className="bg-red-50 p-4 rounded-lg text-center w-full">
                    <Skull className="w-8 h-8 text-red-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Nemesis</p>
                    <p className="text-lg font-bold text-gray-800">
                      {nemesis || "N/A"}
                    </p>
                  </div>

                  {/* Meilleur allié */}
                  <div className="bg-green-50 p-4 rounded-lg text-center w-full">
                    <Award className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Meilleur allié</p>
                    <p className="text-lg font-bold text-gray-800">
                      {bestAlly || "N/A"}
                    </p>
                  </div>

                  {/* Pire allié */}
                  <div className="bg-yellow-50 p-4 rounded-lg text-center w-full">
                    <XCircle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Pire allié</p>
                    <p className="text-lg font-bold text-gray-800">
                      {worstAlly || "N/A"}
                    </p>
                  </div>
                </div>
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
                  gameHistory
                    .slice(0, showAllGames ? gameHistory.length : 5) // ✅ Afficher seulement 5 parties par défaut
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
                            <div className="text-right">
                              <span className="font-bold">
                                {game.score_nous} - {game.score_eux}
                              </span>
                            </div>
                          </div>
                          <div className="mt-2 text-sm text-gray-600">
                            <p>
                              <strong>Vainqueurs:</strong>{" "}
                              {playersMap[game.winning_team_player1_id]} &{" "}
                              {playersMap[game.winning_team_player2_id]}
                            </p>
                            <p>
                              <strong>Noobs:</strong>{" "}
                              {playersMap[game.losing_team_player1_id]} &{" "}
                              {playersMap[game.losing_team_player2_id]}
                            </p>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>

              {/* ✅ Bouton "Voir plus" si plus de 5 parties */}
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
          </>
        )}
      </div>
    </div>
  );
}
