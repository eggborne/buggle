export interface FirebaseSchema {
  challenges: {
    [challengeId: string]: { // ChallengeData
      accepted: boolean;
      difficulty: string;
      instigator: string;
      respondent: string;
      dimensions: { width: number; height: number; };
      timeLimit: number;
      id?: string | null;
    };
  };
  games: {
    [gameId: string]: { // CurrentGameData
      allWords: string[];
      dimensions: { width: number; height: number; };
      endTime: number;
      foundWordsRecord: Record<string, string | boolean>
      gameOver: boolean;
      id: string;
      instigator: {
        attackPoints: number,
        score: number;
        uid: string;
      };
      letterMatrix: string[][];
      letterString: string;
      metadata: {
        averageWordLength: number;
        dateCreated: number;
        percentUncommon: number;
        key?: Record<string, string>;
      };
      playerProgress: Record<
        string, // uid
        {
          attackPoints: number,
          foundOpponentWords: Record<string, boolean>;
          ready?: boolean;
          score: number;
          touchedCells: {
            letter: string;
            id: string;
            row: number;
            col: number;
          }[];
          uid: string;
        }
      >;
      respondent: {
        attackPoints: number,
        score: number;
        uid: string;
      };
      specialWords?: string[]; 
      startTime: number;
      theme?: string;
      timeLimit: number;
    };
  };
  lobby: {
    messages: {
      [messageId: string]: { // ChatMessageData
        author: {
          displayName: string,
          photoURL: string,
          phase: string;
          uid: string,
          preferences: {
            style: {
              cubeColor: string;
              cubeTextColor: string;
              footerHeight: number;
              cubeScale: number;
              cubeRoundness: number;
              gameBackgroundColor: string;
              gameBoardBackgroundColor: string;
              gameBoardSize: number;
            };
            gameplay: {
              swipeBuffer: number;
            };
          };
          heartbeat?: number;
        };
        date: number;
        message: string;
      };
    };
  };
  players: {
    [uid: string]: { // UserData
      displayName: string,
      heartbeat?: number;
      phase: string;
      photoURL: string,
      preferences: {
        style: {
          cubeColor: string;
          cubeTextColor: string;
          footerHeight: number;
          cubeScale: number;
          cubeRoundness: number;
          gameBackgroundColor: string;
          gameBoardBackgroundColor: string;
          gameBoardSize: number;
        };
        gameplay: {
          swipeBuffer: number;
        };
      };
      uid: string,
    };
  };
  puzzles: {
    [puzzleId: string]: { // StoredPuzzleData
      allWords: string[];
      dimensions: { width: number; height: number; };
      letterString: string;
      metadata: {
        averageWordLength: number;
        dateCreated: number;
        percentUncommon: number;
        key?: Record<string, string>;
      };
      specialWords?: string[];
      theme?: string;
    };
  };
  users: {
    [uid: string]: { // UserData
      displayName: string,
      phase: string;
      photoURL: string,
      preferences?: {
        style: {
          cubeColor: string;
          cubeTextColor: string;
          footerHeight: number;
          cubeScale: number;
          cubeRoundness: number;
          gameBackgroundColor: string;
          gameBoardBackgroundColor: string;
          gameBoardSize: number;
        };
        gameplay: {
          swipeBuffer: number;
        };
      };
      uid: string,
    };
  };
}