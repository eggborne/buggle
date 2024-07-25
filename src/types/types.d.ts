export interface BannerOptions {
    message: string;
    duration?: number;
    style?: Record<string, string>;
}
export interface PlayerData {
    score: number;
    wordsFound: Set<string>;
}
export interface UserData {
    currentGame?: CurrentGameData;
    displayName: string | null;
    photoURL: string | null;
    phase: string | null;
    preferences?: OptionsData | null;
    uid: string;
}
export interface BoardCustomizations {
    requiredWords?: {
        wordList: string[];
        convertQ?: boolean;
    };
    customLetters?: {
        letterList: string[];
        convertQ?: boolean;
        shuffle?: boolean;
    };
}
export interface ComparisonFilterData {
    comparison: string;
    value: number;
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
export interface StoredPuzzleData {
    allWords: string[];
    dimensions: PuzzleDimensions;
    letterString: string;
    metadata: PuzzleMetadata;
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
    totalWordLimits?: {
        min?: number;
        max?: number;
    };
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
}
export interface GeneratedBoardData {
    attempts: number;
    matrix: string[][];
    wordList: string[];
    metadata: PuzzleMetadata;
    customizations?: BoardCustomizations;
    filters?: BoardFilters;
}
export interface CurrentGameData {
    allWords: Set<string>;
    dimensions: PuzzleDimensions;
    letterMatrix: string[][];
    metadata: {
        key?: Record<string, string>;
        percentUncommon: number;
    };
    customizations?: BoardCustomizations;
    filters?: BoardFilters;
    timeLimit?: number;
}
export interface GameOptions {
    difficulty: string;
    dimensions: PuzzleDimensions;
    timeLimit: number;
}
export interface PointValues {
    [key: number]: number;
}
export interface ChatMessageData {
    author: UserData;
    date: number;
    message: string;
}
export interface LobbyData {
    messages: ChatMessageData[];
}
export interface ChallengeData {
    difficulty: string;
    instigator: string;
    respondent: string;
    dimensions: {
        width: number;
        height: number;
    };
    timeLimit: number;
}
export interface OptionsData {
    cubeColor: string;
    cubeTextColor: string;
    footerHeight: number;
    cubeGap: number;
    cubeRoundness: number;
    gameBackgroundColor: string;
    gameBoardBackgroundColor: string;
    gameBoardPadding: number;
    gameBoardSize: number;
    swipeBuffer: number;
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
