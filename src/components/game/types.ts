export type Team = 'blue' | 'red';
export type Suit = '♥' | '♠' | '♣' | '♦';
export type Contract = '80' | '90' | '100' | '110' | '120' | '130' | '140' | '150' | '160' | 'capot';
export type ContractType = 'normale';

export interface Player {
  id: string;
  trigramme: string;
}

export interface GameState {
  isSetup: boolean;
  gameId: string | null;
  players: {
    nous1: Player | null;
    nous2: Player | null;
    eux1: Player | null;
    eux2: Player | null;
  };
}

export interface TeamAnnouncements {
  beloteRebelote: boolean;
  announcements: string[];
  lastTrick: boolean;
}

export interface Round {
  team: Team;
  contract: Contract;
  contractType: ContractType;
  points: number;
  blueTeam: TeamAnnouncements;
  redTeam: TeamAnnouncements;
  contractFulfilled: boolean;
  suit: Suit;
  bluePoints: number;
  redPoints: number;
  isCoinched: boolean;
  isSurCoinched: boolean;
}

export interface BiddingState {
  isBiddingPhase: boolean;
  currentBid: {
    team: Team;
    contract: Contract;
    suit: Suit;
    isCoinched: boolean;
    isSurCoinched: boolean;
  };
}

export interface Announcement {
  title: string;
  points: number;
}