export interface FirestoreSchema {
  users: {
    [uid: string]: { // UserData
      displayName: string;
      phase: string;
      photoURL: string;
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
      uid: string;
    };
  };
  puzzles: {
    [id: string]: {  // StoredPuzzleData
      allWords: string[];
      dimensions: {
        height: number;
        width: number;
      };
      letterString: string;
      metadata: {
        averageWordLength: number;
        dateCreated: number;
        percentCommon: number;
        key?: Record<string, string>;
      };
      specialWords?: string[];
      theme?: string;
      wordCount: number;
    }
  };
}