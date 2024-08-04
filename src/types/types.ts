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
  preferences?: OptionsData | null;
  heartbeat?: number;
}

// puzzle

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

export interface ComparisonFilterData {
  comparison: string,
  value: number,
}

export interface PuzzleDimensions {
  height: number;
  width: number;
}

export interface PuzzleMetadata {
  averageWordLength: number;
  dateCreated: number;
  percentUncommon: number;
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
  averageWordLengthFilter?: ComparisonFilterData;
  totalWordLimits?: { min?: number, max?: number };
  uncommonWordLimit?: ComparisonFilterData;
  wordLengthLimits?: WordLengthPreference[];
}

export interface BoardRequestData {
  dimensions: PuzzleDimensions;
  letterDistribution?: string;
  maxAttempts: number;
  returnBest: boolean;
  customizations?: BoardCustomizations;
  filters?: BoardFilters;
  theme?: string;
}

export interface StoredPuzzleData {
  allWords: string[];
  dimensions: PuzzleDimensions;
  letterString: string;
  metadata: PuzzleMetadata;
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
  uid: string;
  score: number;
  touchedCells: CellObj[];
}

export interface CurrentGameData {
  allWords: Set<string> | string[];
  specialWords?: string[];
  dimensions: PuzzleDimensions;
  letterMatrix: string[][];
  metadata: PuzzleMetadata;
  playerProgress: Record<string, PlayerMatchData>;
  customizations?: BoardCustomizations;
  filters?: BoardFilters;
  timeLimit?: number;
  
  id?: string;
  instigator?: PlayerMatchData;
  respondent?: PlayerMatchData;
  startTime?: number;
  theme?: string;
  endTime?: number;
  foundWordsRecord?: Record<string, string | boolean>
}

export interface GameOptions {
  difficulty: string;
  dimensions: PuzzleDimensions;
  timeLimit: number;
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

export interface ChallengeData {
  accepted: boolean;
  difficulty: string;
  instigator: string;
  respondent: string;
  dimensions: {
    width: number;
    height: number;
  };
  timeLimit: number;
  id?: string | null;
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

