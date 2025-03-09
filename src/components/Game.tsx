import React, { useState, useEffect, Fragment } from 'react';
import { Trophy, Flag, AlertTriangle, ChevronDown } from 'lucide-react';
import { Dialog, Transition, Disclosure } from '@headlessui/react';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';
import { BlueHelmet, RedHelmet } from './game/TeamIcons';
import { announcements, contractValues, suits } from './game/constants';
import type { Team, Suit, Contract, Player, GameState, Round, BiddingState } from './game/types';
import GameSetup from './game/GameSetup';

const AnnouncementCard = ({ title, points, isSelected, onClick, disabled, count }: { 
  title: string; 
  points: number;
  isSelected: boolean;
  onClick: () => void;
  disabled: boolean;
  count?: number;
}) => {
  const isMultipleAllowed = ['Tierce', 'Cinquante', 'Cent'].includes(title);
  const displayTitle = isMultipleAllowed && count && count > 0 ? `${title} (${count})` : title;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`${
          isSelected 
            ? 'bg-[#0342AF]/10 border-[#0342AF] ring-2 ring-[#0342AF]' 
            : disabled
              ? 'bg-gray-100 border-gray-300 cursor-not-allowed opacity-50'
              : 'bg-white hover:bg-gray-50 border-gray-200'
        } p-4 rounded-lg border transition-all duration-200 focus:outline-none w-full text-left min-h-[80px]`}
      >
        <h4 className="font-medium text-gray-900">{displayTitle}</h4>
        <p className="text-sm text-gray-500">{points} points</p>
      </button>
      
      {isMultipleAllowed && isSelected && (
        <div className="absolute right-2 top-2 flex items-center space-x-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClick(); // This will decrease the count
            }}
            className="w-8 h-8 flex items-center justify-center bg-red-100 text-red-600 rounded-full hover:bg-red-200"
          >
            -
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClick(); // This will increase the count
            }}
            className="w-8 h-8 flex items-center justify-center bg-[#0342AF]/10 text-[#0342AF] rounded-full hover:bg-[#0342AF]/20"
          >
            +
          </button>
        </div>
      )}
    </div>
  );
};

export default function Game() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<GameState>({
    isSetup: false,
    gameId: null,
    players: {
      nous1: null,
      nous2: null,
      eux1: null,
      eux2: null,
    },
  });
  
  const [biddingState, setBiddingState] = useState<BiddingState>({
    isBiddingPhase: true,
    currentBid: {
      team: 'blue',
      contract: '80',
      suit: '♥',
    },
  });

  const [isEndGameModalOpen, setIsEndGameModalOpen] = useState(false);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [currentRound, setCurrentRound] = useState<Round>({
    team: 'blue',
    contract: '80',
    contractType: 'normale',
    points: 0,
    blueTeam: {
      beloteRebelote: false,
      announcements: [],
    },
    redTeam: {
      beloteRebelote: false,
      announcements: [],
    },
    contractFulfilled: false,
    suit: '♥',
    bluePoints: 0,
    redPoints: 0,
  });

  const [blueScore, setBlueScore] = useState(0);
  const [redScore, setRedScore] = useState(0);

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, trigramme')
      .order('trigramme');

    if (error) {
      console.error('Error fetching players:', error);
      return;
    }

    setAvailablePlayers(data || []);
  };

  const isPlayerSelected = (playerId: string) => {
    return Object.values(gameState.players).some(p => p?.id === playerId);
  };

  const handlePlayerSelect = (position: keyof GameState['players'], player: Player | null) => {
    setGameState(prev => ({
      ...prev,
      players: {
        ...prev.players,
        [position]: player,
      },
    }));
  };

  const areAllPlayersSelected = () => {
    return Object.values(gameState.players).every(player => player !== null);
  };

  const handleStartGame = async () => {
    try {
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .insert([{
          player_id: (await supabase.auth.getUser()).data.user?.id,
          score_nous: 0,
          score_eux: 0,
        }])
        .select()
        .single();

      if (gameError) throw gameError;

      setGameState(prev => ({
        ...prev,
        isSetup: true,
        gameId: gameData.id,
      }));
    } catch (error) {
      console.error('Error starting game:', error);
    }
  };

  const handleEndGame = async () => {
    try {
      const isBlueWinning = blueScore > redScore;
      const bluePlayers = [gameState.players.nous1?.id, gameState.players.nous2?.id].filter(Boolean);
      const redPlayers = [gameState.players.eux1?.id, gameState.players.eux2?.id].filter(Boolean);

      const allPlayers = [...bluePlayers, ...redPlayers];

      if (allPlayers.length === 0) {
        console.error("Aucun joueur valide trouvé !");
        return;
      }

      if (gameState.gameId) {
        const { error: gameError } = await supabase
          .from('games')
          .update({
            score_nous: blueScore,
            score_eux: redScore,
            winning_team_player1_id: isBlueWinning ? bluePlayers[0] : redPlayers[0],
            winning_team_player2_id: isBlueWinning ? bluePlayers[1] : redPlayers[1],
          })
          .eq('id', gameState.gameId);

        if (gameError) {
          console.error("Erreur lors de la mise à jour du jeu :", gameError);
          return;
        }
      }

      const { data: profiles, error: fetchError } = await supabase
        .from('profiles')
        .select('id, games_played, games_won, games_lost')
        .in('id', allPlayers);

      if (fetchError) {
        console.error("Erreur lors de la récupération des joueurs :", fetchError);
        return;
      }

      const updates = profiles.map((profile) => {
        const isWinner = isBlueWinning ? bluePlayers.includes(profile.id) : redPlayers.includes(profile.id);

        return supabase
          .from('profiles')
          .update({
            games_played: profile.games_played + 1,
            games_won: profile.games_won + (isWinner ? 1 : 0),
            games_lost: profile.games_lost + (isWinner ? 0 : 1),
            win_percentage: ((profile.games_won + (isWinner ? 1 : 0)) / (profile.games_played + 1)) * 100,
          })
          .eq('id', profile.id);
      });

      await Promise.all(updates);

      navigate('/');
    } catch (error) {
      console.error('Erreur lors de la fin du jeu :', error);
    }
  };

  const calculateRoundScore = (round) => {
    let blueScore = 0;
    let redScore = 0;
    
    const contractValue = round.contract === 'capot' ? 250 : parseInt(round.contract);
    const lastTrickPoints = 10; // Points du dernier pli
    const totalPoints = round.bluePoints + round.redPoints;
  
    // Vérifier si l'équipe preneuse a atteint au moins 82 points (y compris dernier pli)
    const isContractFulfilled = round.team === 'blue' 
      ? (round.bluePoints + lastTrickPoints >= 82 && round.bluePoints + lastTrickPoints > round.redPoints) 
      : (round.redPoints + lastTrickPoints >= 82 && round.redPoints + lastTrickPoints > round.bluePoints);
    
    if (isContractFulfilled) {
      if (round.team === 'blue') {
        blueScore = round.bluePoints + lastTrickPoints + contractValue;
        redScore = round.redPoints;
      } else {
        redScore = round.redPoints + lastTrickPoints + contractValue;
        blueScore = round.bluePoints;
      }
    } else {
      // L'équipe adverse prend tous les points + la valeur du contrat
      if (round.team === 'blue') {
        redScore = 162 + contractValue;
      } else {
        blueScore = 162 + contractValue;
      }
    }
  
    // Ajouter la belote-rebelote si applicable
    if (round.blueTeam.beloteRebelote) {
      blueScore += 20;
    }
    if (round.redTeam.beloteRebelote) {
      redScore += 20;
    }
  
    // Comparer les annonces et ne garder que la plus forte (seulement si l'équipe gagne le tour)
    const getAnnouncementPoints = (announcements) => 
      announcements.map(a => ({ title: a, points: announcements.find(x => x.title === a)?.points || 0 }))
      .sort((a, b) => b.points - a.points)[0]?.points || 0;
    
    const blueAnnouncePoints = getAnnouncementPoints(round.blueTeam.announcements);
    const redAnnouncePoints = getAnnouncementPoints(round.redTeam.announcements);
    
    if (blueScore > redScore) {
      blueScore += blueAnnouncePoints;
    } else if (redScore > blueScore) {
      redScore += redAnnouncePoints;
    }
  
    return { bluePoints: blueScore, redPoints: redScore };
  };
  

  const handleBidSubmit = () => {
    setCurrentRound(prev => ({
      ...prev,
      team: biddingState.currentBid.team,
      contract: biddingState.currentBid.contract,
      suit: biddingState.currentBid.suit,
      contractType: 'normale',
    }));
    setBiddingState(prev => ({ ...prev, isBiddingPhase: false }));
  };

  const handlePointsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const totalPoints = currentRound.bluePoints + currentRound.redPoints;
    const contractValue = currentRound.contract === 'capot' ? 250 : parseInt(currentRound.contract);
    const isContractFulfilled = currentRound.team === 'blue' ? 
      currentRound.bluePoints >= contractValue : 
      currentRound.redPoints >= contractValue;

    const roundScore = calculateRoundScore({
      ...currentRound,
      contractFulfilled: isContractFulfilled,
    });
    
    setBlueScore(prev => prev + roundScore.bluePoints);
    setRedScore(prev => prev + roundScore.redPoints);

    setRounds(prev => [...prev, { 
      ...currentRound, 
      points: roundScore.bluePoints + roundScore.redPoints,
      contractFulfilled: isContractFulfilled,
    }]);
    
    setBiddingState({
      isBiddingPhase: true,
      currentBid: {
        team: 'blue',
        contract: '80',
        suit: '♥',
      },
    });
    setCurrentRound({
      team: 'blue',
      contract: '80',
      contractType: 'normale',
      points: 0,
      blueTeam: {
        beloteRebelote: false,
        announcements: [],
      },
      redTeam: {
        beloteRebelote: false,
        announcements: [],
      },
      contractFulfilled: false,
      suit: '♥',
      bluePoints: 0,
      redPoints: 0,
    });
  };

  const toggleAnnouncement = (team: 'blueTeam' | 'redTeam', announcement: string) => {
    setCurrentRound(prev => {
      const currentAnnouncements = prev[team].announcements;
      const otherTeam = team === 'blueTeam' ? 'redTeam' : 'blueTeam';
      
      // Special handling for Belote-Rebelote
      if (announcement === 'Belote-Rebelote') {
        // If the other team has Belote-Rebelote, don't allow it
        if (prev[otherTeam].beloteRebelote) {
          return prev;
        }
        return {
          ...prev,
          [team]: {
            ...prev[team],
            beloteRebelote: !prev[team].beloteRebelote
          }
        };
      }
      
      // For Tierce, Cinquante, and Cent, allow multiple instances
      if (['Tierce', 'Cinquante', 'Cent'].includes(announcement)) {
        const newAnnouncements = [...currentAnnouncements];
        const count = currentAnnouncements.filter(a => a === announcement).length;
        
        // Add a new instance
        newAnnouncements.push(announcement);
        
        return {
          ...prev,
          [team]: {
            ...prev[team],
            announcements: newAnnouncements
          }
        };
      }
      
      // For other announcements (Carrés), if the other team has it, don't allow it
      if (prev[otherTeam].announcements.includes(announcement)) {
        return prev;
      }
      
      const newAnnouncements = currentAnnouncements.includes(announcement)
        ? currentAnnouncements.filter(a => a !== announcement)
        : [...currentAnnouncements, announcement];
      
      return {
        ...prev,
        [team]: {
          ...prev[team],
          announcements: newAnnouncements
        }
      };
    });
  };

  const removeAnnouncement = (team: 'blueTeam' | 'redTeam', announcement: string) => {
    setCurrentRound(prev => {
      const currentAnnouncements = prev[team].announcements;
      const lastIndex = currentAnnouncements.lastIndexOf(announcement);
      
      if (lastIndex === -1) return prev;
      
      const newAnnouncements = [...currentAnnouncements];
      newAnnouncements.splice(lastIndex, 1);
      
      return {
        ...prev,
        [team]: {
          ...prev[team],
          announcements: newAnnouncements
        }
      };
    });
  };

  if (!gameState.isSetup) {
    return (
      <GameSetup
        gameState={gameState}
        availablePlayers={availablePlayers}
        handlePlayerSelect={handlePlayerSelect}
        handleStartGame={handleStartGame}
        isPlayerSelected={isPlayerSelected}
        areAllPlayersSelected={areAllPlayersSelected}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center">
            <Trophy className="w-8 h-8 text-[#0342AF] mr-2" />
            <h1 className="text-2xl sm:text-3xl font-bold">Axxone Coinche</h1>
          </div>
          <button
            onClick={() => setIsEndGameModalOpen(true)}
            className="flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 w-full sm:w-auto text-base"
          >
            <Flag className="w-5 h-5 mr-2" />
            Terminer la partie
          </button>
        </div>

        {/* Score Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-2 flex items-center text-blue-600">
              <BlueHelmet />
              <span className="ml-2">Blue Team</span>
            </h2>
            <div className="text-sm text-gray-600 mb-2">
              {gameState.players.nous1?.trigramme} - {gameState.players.nous2?.trigramme}
            </div>
            <p className="text-3xl font-bold text-blue-800">{blueScore}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-2 flex items-center text-red-600">
              <RedHelmet />
              <span className="ml-2">Red Team</span>
            </h2>
            <div className="text-sm text-gray-600 mb-2">
              {gameState.players.eux1?.trigramme} - {gameState.players.eux2?.trigramme}
            </div>
            <p className="text-3xl font-bold text-red-800">{redScore}</p>
          </div>
        </div>

        {biddingState.isBiddingPhase ? (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold mb-6">Phase d'Enchères</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Équipe</label>
                <select
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#0342AF] focus:ring-[#0342AF] text-base py-3"
                  value={biddingState.currentBid.team}
                  onChange={(e) => setBiddingState(prev => ({
                    ...prev,
                    currentBid: { ...prev.currentBid, team: e.target.value as Team }
                  }))}
                >
                  <option value="blue">Blue Team</option>
                  <option value="red">Red Team</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contrat</label>
                <select
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#0342AF] focus:ring-[#0342AF] text-base py-3"
                  value={biddingState.currentBid.contract}
                  onChange={(e) => setBiddingState(prev => ({
                    ...prev,
                    currentBid: { ...prev.currentBid, contract: e.target.value as Contract }
                  }))}
                >
                  {contractValues.map(value => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Couleur</label>
              <div className="grid grid-cols-4 gap-2">
                {suits.map(suit => (
                  <button
                    key={suit}
                    type="button"
                    onClick={() => setBiddingState(prev => ({
                      ...prev,
                      currentBid: { ...prev.currentBid, suit }
                    }))}
                    className={`p-4 text-2xl rounded-lg ${
                      biddingState.currentBid.suit === suit
                        ? 'bg-[#0342AF]/10 border-2 border-[#0342AF]'
                        : 'bg-gray-100 hover:bg-gray-200'
                    } ${
                      suit === '♥' || suit === '♦' ? 'text-red-600' : 'text-gray-900'
                    } aspect-square flex items-center justify-center`}
                  >
                    {suit}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleBidSubmit}
              className="w-full bg-[#0342AF] text-white py-4 px-4 rounded-lg hover:bg-[#0342AF]/90 focus:outline-none focus:ring-2 focus:ring-[#0342AF] focus:ring-offset-2 text-lg font-medium mt-8"
            >
              Valider l'Enchère
            </button>
          </div>
        ) : (
          <form onSubmit={handlePointsSubmit} className="space-y-6">
            <h3 className="text-xl font-semibold mb-6">Points du Tour</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Points Blue Team
                </label>
                <input
                  type="number"
                  value={currentRound.bluePoints}
                  onChange={(e) => setCurrentRound(prev => ({
                    ...prev,
                    bluePoints: parseInt(e.target.value) || 0
                  }))}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#0342AF] focus:ring-[#0342AF] text-base py-3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Points Red Team
                </label>
                <input
                  type="number"
                  value={currentRound.redPoints}
                  onChange={(e) => setCurrentRound(prev => ({
                    ...prev,
                    redPoints: parseInt(e.target.value) || 0
                  }))}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#0342AF] focus:ring-[#0342AF] text-base py-3"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Disclosure>
                {({ open }) => (
                  <>
                    <Disclosure.Button className="flex justify-between w-full px-4 py-3 text-base font-medium text-left text-[#0342AF] bg-[#0342AF]/10 rounded-lg hover:bg-[#0342AF]/20 focus:outline-none focus-visible:ring focus-visible:ring-[#0342AF] focus-visible:ring-opacity-75">
                      <span>Annonces Blue Team</span>
                      <ChevronDown
                        className={`${
                          open ? 'transform rotate-180' : ''
                        } w-5 h-5 text-[#0342AF]`}
                      />
                    </Disclosure.Button>
                    <Disclosure.Panel className="px-4 pt-4 pb-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {announcements.map(announcement => {
                          const count = currentRound.blueTeam.announcements.filter(a => a === announcement.title).length;
                          return (
                            <AnnouncementCard
                              key={announcement.title}
                              title={announcement.title}
                              points={announcement.points}
                              isSelected={
                                announcement.title === 'Belote-Rebelote'
                                  ? currentRound.blueTeam.beloteRebelote
                                  : count > 0
                              }
                              onClick={() => toggleAnnouncement('blueTeam', announcement.title)}
                              disabled={
                                announcement.title === 'Belote-Rebelote'
                                  ? currentRound.redTeam.beloteRebelote
                                  : !['Tierce', 'Cinquante', 'Cent'].includes(announcement.title) && 
                                    currentRound.redTeam.announcements.includes(announcement.title)
                              }
                              count={count}
                            />
                          );
                        })}
                      </div>
                    </Disclosure.Panel>
                  </>
                )}
              </Disclosure>

              <Disclosure>
                {({ open }) => (
                  <>
                    <Disclosure.Button className="flex justify-between w-full px-4 py-3 text-base font-medium text-left text-red-600 bg-red-100 rounded-lg hover:bg-red-200 focus:outline-none focus-visible:ring focus-visible:ring-red-500 focus-visible:ring-opacity-75">
                      <span>Annonces Red Team</span>
                      <ChevronDown
                        className={`${
                          open ? 'transform rotate-180' : ''
                        } w-5 h-5 text-red-600`}
                      />
                    </Disclosure.Button>
                    <Disclosure.Panel className="px-4 pt-4 pb-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {announcements.map(announcement => {
                          const count = currentRound.redTeam.announcements.filter(a => a === announcement.title).length;
                          return (
                            <AnnouncementCard
                              key={announcement.title}
                              title={announcement.title}
                              points={announcement.points}
                              isSelected={
                                announcement.title === 'Belote-Rebelote'
                                  ? currentRound.redTeam.beloteRebelote
                                  : count > 0
                              }
                              onClick={() => toggleAnnouncement('redTeam', announcement.title)}
                              disabled={
                                announcement.title === 'Belote-Rebelote'
                                  ? currentRound.blueTeam.beloteRebelote
                                  : !['Tierce', 'Cinquante', 'Cent'].includes(announcement.title) && 
                                    currentRound.blueTeam.announcements.includes(announcement.title)
                              }
                              count={count}
                            />
                          );
                        })}
                      </div>
                    </Disclosure.Panel>
                  </>
                )}
              </Disclosure>
            </div>

            <button
              type="submit"
              className="w-full bg-[#0342AF] text-white py-4 px-4 rounded-lg hover:bg-[#0342AF]/90 focus:outline-none focus:ring-2 focus:ring-[#0342AF] focus:ring-offset-2 text-lg font-medium mt-8"
            >
              Valider le Tour
            </button>
          </form>
        )}

        <div className="mt-8">
          <Disclosure>
            {({ open }) => (
              <>
                <Disclosure.Button className="flex justify-between w-full px-4 py-3 text-base font-medium text-left text-gray-900 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus-visible:ring focus-visible:ring-gray-500 focus-visible:ring-opacity-75">
                  <span>Historique des Tours</span>
                  <ChevronDown
                    className={`${
                      open ? 'transform rotate-180' : ''
                    } w-5 h-5 text-gray-500`}
                  />
                </Disclosure.Button>
                <Disclosure.Panel className="px-4 pt-4 pb-2">
                  <div className="space-y-4">
                    {rounds.map((round, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg ${
                          round.team === 'blue' ? 'bg-blue-50' : 'bg-red-50'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-semibold">
                              {round.team === 'blue' ? 'Blue Team' : 'Red Team'} - {round.contract} {round.suit}
                            </span>
                          </div>
                          <span className={`font-bold ${round.contractFulfilled ? 'text-green-600' : 'text-red-600'}`}>
                            {round.contractFulfilled ? 'Réussi' : 'Chuté'}
                          </span>
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                          Points: Blue {round.bluePoints} - Red {round.redPoints}
                        </div>
                        {(round.blueTeam.announcements.length > 0 || round.blueTeam.beloteRebelote) && (
                          <div className="mt-1 text-sm text-blue-600">
                            Blue Team: {[
                              ...round.blueTeam.announcements,
                              round.blueTeam.beloteRebelote ? 'Belote-Rebelote' : ''
                            ].filter(Boolean).join(', ')}
                          </div>
                        )}
                        {(round.redTeam.announcements.length > 0 || round.redTeam.beloteRebelote) && (
                          <div className="mt-1 text-sm text-red-600">
                            Red Team: {[
                              ...round.redTeam.announcements,
                              round.redTeam.beloteRebelote ? 'Belote-Rebelote' : ''
                            ].filter(Boolean).join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </Disclosure.Panel>
              </>
            )}
          </Disclosure>
        </div>
      </div>

     <Transition appear show={isEndGameModalOpen} as={Fragment}>
  <Dialog as="div" className="relative z-10" onClose={() => setIsEndGameModalOpen(false)}>
    <Transition.Child
      as={Fragment}
      enter="ease-out duration-300"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="ease-in duration-200"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <div className="fixed inset-0 bg-black bg-opacity-25" />
    </Transition.Child>

    <div className="fixed inset-0 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          <div className="bg-white rounded-lg shadow-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Bientôt 14h ?</h2>
            <p className="text-gray-600 mb-4">Voulez-vous vraiment terminer la partie ?</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setIsEndGameModalOpen(false)}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Annuler
              </button>
              <button
                onClick={handleEndGame}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Terminer
              </button>
            </div>
          </div>
        </Transition.Child>
      </div>
    </div>
  </Dialog>
</Transition>
    </div>
  );
}