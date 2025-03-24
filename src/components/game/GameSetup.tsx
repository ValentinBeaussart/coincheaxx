import React from "react";
import { BlueHelmet, RedHelmet } from "./TeamIcons";
import { GameState, Player } from "./types";
import Logo from "../../assets/icons/ace.svg";
import { useAuth } from "../../hooks/useAuth"; // 👈 Ajouter import
import Garde from "../../assets/icons/garde-imperial.webp";

interface GameSetupProps {
  gameState: GameState;
  availablePlayers: Player[];
  handlePlayerSelect: (
    position: keyof GameState["players"],
    player: Player | null
  ) => void;
  handleStartGame: () => void;
  isPlayerSelected: (playerId: string) => boolean;
  areAllPlayersSelected: () => boolean;
}


export default function GameSetup({
  gameState,
  availablePlayers,
  handlePlayerSelect,
  handleStartGame,
  isPlayerSelected,
  areAllPlayersSelected,
}: GameSetupProps) {
  const { session } = useAuth(); // 👈 Hook d'auth

  const isAuthorized =
    session?.user?.email === "valentin.beaussart@gmail.com"; // 👈 Vérifie l'email

  if (!isAuthorized) {
    return (
      <div className="text-center py-10 text-red-600 font-semibold">
        Accès refusé - Cette page est réservée à Napoléon
        <div className="mt-4 justify-center flex items-center">
          <img src={Garde} alt="Garde" className="w-50 h-50" />
        </div>
      </div>
    );
  }
  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <img src={Logo} alt="Logo" className="w-11 h-11" />
            <h1 className="text-xl sm:text-3xl font-bold">Nouvelle Partie</h1>
          </div>
        </div>

        <div className="mb-8">
          <div className="space-y-6 sm:space-y-8">
            {/* Blue Team */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h2 className="text-lg sm:text-xl font-semibold flex items-center text-blue-600 mb-4">
                <BlueHelmet />
                <span className="ml-2">Blue Team</span>
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Joueur 1
                  </label>
                  <select
                    className="w-full p-3 border rounded-lg bg-white focus:border-[#0342AF] focus:ring-[#0342AF] text-base"
                    value={gameState.players.nous1?.id || ""}
                    onChange={(e) => {
                      const player = availablePlayers.find(
                        (p) => p.id === e.target.value
                      );
                      handlePlayerSelect("nous1", player || null);
                    }}
                  >
                    <option value="">Sélectionner un joueur</option>
                    {availablePlayers.map((player) => (
                      <option
                        key={player.id}
                        value={player.id}
                        disabled={isPlayerSelected(player.id)}
                      >
                        {player.trigramme}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Joueur 2
                  </label>
                  <select
                    className="w-full p-3 border rounded-lg bg-white focus:border-[#0342AF] focus:ring-[#0342AF] text-base"
                    value={gameState.players.nous2?.id || ""}
                    onChange={(e) => {
                      const player = availablePlayers.find(
                        (p) => p.id === e.target.value
                      );
                      handlePlayerSelect("nous2", player || null);
                    }}
                  >
                    <option value="">Sélectionnez un joueur</option>
                    {availablePlayers.map((player) => (
                      <option
                        key={player.id}
                        value={player.id}
                        disabled={isPlayerSelected(player.id)}
                      >
                        {player.trigramme}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Red Team */}
            <div className="bg-red-50 rounded-lg p-4">
              <h2 className="text-lg sm:text-xl font-semibold flex items-center text-red-600 mb-4">
                <RedHelmet />
                <span className="ml-2">Red Team</span>
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Joueur 1
                  </label>
                  <select
                    className="w-full p-3 border rounded-lg bg-white focus:border-[#0342AF] focus:ring-[#0342AF] text-base"
                    value={gameState.players.eux1?.id || ""}
                    onChange={(e) => {
                      const player = availablePlayers.find(
                        (p) => p.id === e.target.value
                      );
                      handlePlayerSelect("eux1", player || null);
                    }}
                  >
                    <option value="">Sélectionner un joueur</option>
                    {availablePlayers.map((player) => (
                      <option
                        key={player.id}
                        value={player.id}
                        disabled={isPlayerSelected(player.id)}
                      >
                        {player.trigramme}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Joueur 2
                  </label>
                  <select
                    className="w-full p-3 border rounded-lg bg-white focus:border-[#0342AF] focus:ring-[#0342AF] text-base"
                    value={gameState.players.eux2?.id || ""}
                    onChange={(e) => {
                      const player = availablePlayers.find(
                        (p) => p.id === e.target.value
                      );
                      handlePlayerSelect("eux2", player || null);
                    }}
                  >
                    <option value="">Sélectionner un joueur</option>
                    {availablePlayers.map((player) => (
                      <option
                        key={player.id}
                        value={player.id}
                        disabled={isPlayerSelected(player.id)}
                      >
                        {player.trigramme}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleStartGame}
          disabled={!areAllPlayersSelected()}
          className={`w-full py-4 px-4 rounded-lg text-lg ${
            areAllPlayersSelected()
              ? "bg-[#0342AF] hover:bg-[#0342AF]/90 text-white"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          } focus:outline-none focus:ring-2 focus:ring-[#0342AF] focus:ring-offset-2`}
        >
          Commencer la partie
        </button>
      </div>
    </div>
  );
}
