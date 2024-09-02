import { RefObject } from "react";

export interface DatabaseStructure {
  challenges: {
    [challengeId: string]: ChallengeData;
  };
  games: {
    [gameId: string]: CurrentGameData;
  };
  lobby: {
    messages: {
      [messageId: string]: ChatMessageData;
    };
  };
  players: {
    [uid: string]: UserData;
  };
  puzzles: {
    [puzzleId: string]: StoredPuzzleData;
  };
  users: {
    [uid: string]: UserData;
  };
}

export interface BannerOptions {
  message: string;
  duration?: number;
  style?: Record<string, string>;
}

export interface ConfirmData {
  typeOpen: string;
  message: string;
  targetPhase: string;
}

// players

export interface PlayerData {
  score: number;
  wordsFound: Set<string>;
}

export interface UserData {
  displayName: string | null,
  photoURL: string | null,
  phase: string | null;
  uid: string,
  seenPuzzles?: string[];
  preferences?: OptionsData | null;
  heartbeat?: number;
}

// puzzle

export interface PuzzleDimensions {
  height: number;
  width: number;
}

export interface ComparisonFilterData {
  comparison: string,
  value: number,
}

export interface PuzzleMetadata {
  averageWordLength: number;
  dateCreated: number;
  commonWordAmount: number;
  key?: Record<string, string>;
}

export type WordLengthPreference = {
  comparison: string;
  wordLength: number;
  value: number;
};

export interface CellObj {
  letter: string;
  id: string;
  row: number;
  col: number;
}

export interface BoardFilters {
  averageWordLength?: ComparisonFilterData;
  commonWordAmount?: number;
  totalWordLimits?: { min?: number, max?: number };
  wordLengthLimits?: WordLengthPreference[];
}

export interface BoardCustomizations {
  requiredWords?: {
    wordList: string[],
    convertQ?: boolean,
  };
  customLetters?: {
    letterList: string[],
    convertQ?: boolean,
    shuffle?: boolean;
  };
}

export interface BoardRequestData {
  customizations?: BoardCustomizations;
  dimensions: PuzzleDimensions;
  letterDistribution?: string;
  maxAttempts: number;
  returnBest: boolean;
  filters?: BoardFilters;
  theme?: string;
}

export interface StoredPuzzleData {
  allWords?: string[];
  creatorUid?: string;
  dimensions: PuzzleDimensions;
  letterString: string;
  id?: string;
  averageWordLength: number;
  dateCreated: number;
  commonWordAmount: number;
  key?: Record<string, string>;
  totalWords: number;
  specialWords?: string[];
  theme?: string;
}

export interface GeneratedBoardData {
  attempts: number,
  matrix: string[][];
  wordList: string[];
  specialWords?: string[];
  metadata: PuzzleMetadata;
  customizations?: BoardCustomizations;
  filters?: BoardFilters;
  theme?: string;
}

//game

export interface PlayerMatchData {
  attackPoints: number;
  availablePowers?: DefaultPowerupData[];
  foundOpponentWords: Record<string, false>;
  ready?: boolean;
  score: number;
  touchedCells: CellObj[];
  uid: string;
}

export interface DefaultPowerupData {
  activatedBy?: string;
  category: 'curses' | 'buffs';
  cost: number;
  duration: number;
  timeLeft?: number;
  type: string;
}

export interface DeployedPowerupData {
  activatedBy: string;
  activatedAt?: number;
  category: 'curses' | 'buffs';
  cost: number;
  duration: number;
  id?: string;
  target: string;
  timeLeft?: number;
  type: string;
}

export interface CurrentGameData {
  activePowerups?: DeployedPowerupData[];
  allWords: Set<string> | string[];
  dimensions: PuzzleDimensions;
  endTime?: number;
  foundWordsRecord?: Record<string, string | false>
  gameOver: boolean;
  id?: string;
  letterMatrix: string[][];
  instigatorUid?: string;
  metadata: PuzzleMetadata;
  playerProgress: Record<string, PlayerMatchData>;


  respondentUid?: string;
  specialWords?: string[];
  startTime?: number;
  theme?: string;
  timeLimit: number;
  wordBonus: number | string;
}

export interface GameOptions {
  difficulty: string;
  dimensions: PuzzleDimensions;
  timeLimit: number;
  wordBonus: number | string;
}

export interface PointValues {
  [key: number]: number;
}

// lobby

export interface ChatMessageData {
  author: UserData;
  date: number;
  message: string;
}

export interface LobbyData {
  messages: ChatMessageData[];
}

export interface PendingOutgoingChallengeData {
  respondent: UserData;
  puzzleId?: string
}

export interface ChallengeData {
  accepted: boolean;
  difficulty: string;
  instigatorUid: string;
  respondentUid: string;
  timeLimit: number;
  wordBonus: number | string;
  id?: string;
  puzzleId?: string;
}


// options

export interface StylePreferencesData {
  cubeColor: string;
  cubeTextColor: string;
  footerHeight: number;
  cubeScale: number;
  cubeRoundness: number;
  gameBackgroundColor: string;
  gameBoardBackgroundColor: string;
  gameBoardSize: number;
}

export interface GameplayPreferencesData {
  swipeBuffer: number;
}

export interface OptionsData {
  style: StylePreferencesData;
  gameplay: GameplayPreferencesData;
}

export interface OptionInputData {
  label: string;
  name: string;
  type: string;
  value?: string | number;
  defaultValue?: string | number;
  min?: number;
  max?: number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPointerUp?: (e: React.PointerEvent<HTMLInputElement>) => void;
}

export interface OptionTypeData {
  label: string;
  inputDataList: OptionInputData[];
}

interface BestListData {
  totalWords: number,
  averageWordLength: number,
  commonWordAmount: number
}

export type BestLists = Record<string, BestListData>;

export type DifficultyLevel = 'easy' | 'medium' | 'hard';


export interface InputRefsData {
  customizations: {
    customLetters: {
      letterList: string[];
      shuffle: RefObject<HTMLInputElement>;
    };
    requiredWords: {
      wordList: string[];
    };
  };
  filters: {
    averageWordLength: {
      comparison: React.RefObject<HTMLSelectElement>;
      value: React.RefObject<HTMLInputElement>;
    };
    commonWordAmount: React.RefObject<HTMLInputElement>;
    totalWordLimits: {
      min: React.RefObject<HTMLInputElement>;
      max: React.RefObject<HTMLInputElement>;
    };
  };
  maxAttempts: React.RefObject<HTMLInputElement>;
  theme: React.RefObject<HTMLInputElement>;
}
