import { useState, useEffect } from 'react'
import './App.css'
import Footer from './components/Footer.tsx'
import TitleScreen from './components/TitleScreen'
import LobbyScreen from './components/LobbyScreen.tsx'
import SelectScreen from './components/SelectScreen.tsx'
import GameScreen from './components/GameScreen'
import OptionsScreen from './components/OptionsScreen'
import CreateScreen from './components/CreateScreen.tsx'
import { set, get, ref, child } from 'firebase/database';
import { database } from './scripts/firebase';
import { stringTo2DArray, randomInt, saveToLocalStorage, getFromLocalStorage, decodeMatrix, encodeMatrix } from "./scripts/util.ts";

// export type WordLength = 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;
export type WordLength = number;
export type Comparison = string;
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface PlayerData {
  score: number;
  wordsFound: Set<string>;
}

interface PuzzleMetadata {
  dateCreated: number;
  key?: Record<string, string>;
  percentUncommon: number;
}

interface PuzzleDimensions {
  height: number;
  width: number;
}

export interface ComparisonFilterData {
  comparison: Comparison,
  value: number,
}

export interface SinglePlayerOptions {
  difficulty: Difficulty;
  dimensions: PuzzleDimensions;
}

export interface StoredPuzzleData {
  allWords: string[];
  dimensions: PuzzleDimensions;
  letterString: string;
  metadata: PuzzleMetadata;
}

export type WordLengthPreference = {
  comparison: Comparison;
  wordLength: WordLength;
  value: number;
};

export interface BoardRequestData {
  dimensions: PuzzleDimensions;
  letterDistribution: string;
  filters?: {
    averageWordLengthFilter?: ComparisonFilterData;
    totalWordLimits?: { min?: number, max?: number };
    uncommonWordLimit?: ComparisonFilterData;
    wordLengthLimits?: WordLengthPreference[];
  };
  maxAttempts?: number;
}

interface GeneratedBoardData {
  matrix: string[][];
  wordList: string[];
  metadata: PuzzleMetadata;
}

export interface CurrentGameData {
  allWords: Set<string>;
  dimensions: PuzzleDimensions;
  letterMatrix: string[][];
  metadata: {
    key?: Record<string, string>;
    percentUncommon: number;
  };
  timeLimit: number;
}

interface PointValues {
  [key: number]: number;
}

export interface OptionsData {
  cubeRoundness: number;
  gameBackgroundColor: string;
  swipeBuffer: number;
  cubeGap: number;
}

const defaultOptions = {
  cubeRoundness: 25,
  gameBackgroundColor: '#223300',
  swipeBuffer: 75,
  cubeGap: 5,
};

const difficultyWordAmounts: Record<Difficulty, { min: number, max: number }> = {
  easy: { min: 200, max: 10000 },
  medium: { min: 150, max: 250 },
  hard: { min: 1, max: 150 }
};
const pointValues: PointValues = { 3: 1, 4: 1, 5: 2, 6: 3, 7: 5, 8: 11 };

function App() {
  const [options, setOptions] = useState<OptionsData>(defaultOptions);
  const [phase, setPhase] = useState<string>('title');

  const [player, setPlayer] = useState<PlayerData>({
    score: 0,
    wordsFound: new Set(),
  });

  const [currentGame, setCurrentGame] = useState<CurrentGameData>({
    allWords: new Set(),
    dimensions: {
      width: 5,
      height: 5,
    },
    letterMatrix: [],
    metadata: {
      percentUncommon: 0,
      key: undefined,
    },
    timeLimit: 60,
  });

  useEffect(() => {
    window.addEventListener('popstate', function () {
      history.pushState(null, '', document.URL);
    });
    history.pushState(null, '', document.URL);
    const localOptions = getFromLocalStorage('buggle-options') as OptionsData;
    setOptions(localOptions || defaultOptions);
  }, []);

  useEffect(() => {
    for (const optionKey in options) {
      const varName = '--' + optionKey.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
      let newValue = options[optionKey as keyof OptionsData].toString();
      if (optionKey === 'cubeRoundness') {
        newValue += '%';
      }
      if (optionKey === 'cubeGap') {
        newValue = (parseInt(newValue) / 10) + 'rem';
      }
      document.documentElement.style.setProperty(varName, newValue)
    }

  }, [options]);

  const handleValidWord = (word: string) => {
    let wordValue;
    if (word.length >= 8) {
      wordValue = pointValues[8];
    } else {
      wordValue = pointValues[word.length];
    }
    const nextPlayer = { ...player };
    nextPlayer.score += wordValue;
    nextPlayer.wordsFound.add(word);
    setPlayer(nextPlayer);
  };

  const uploadPuzzle = async () => {
    const nextPuzzleData = {
      allWords: Array.from(currentGame.allWords),
      dimensions: currentGame.dimensions,
      letterString: encodeMatrix(currentGame.letterMatrix, currentGame.metadata.key).map(row => row.join('')).join(''),
      metadata: currentGame.metadata,
    };
    const newPuzzleId = nextPuzzleData.dimensions.width === nextPuzzleData.dimensions.height ? `${nextPuzzleData.letterString}` : `${currentGame.dimensions.width}${currentGame.dimensions.height}${nextPuzzleData.letterString}`;
    console.log('uploading', nextPuzzleData)
    await set(ref(database, 'puzzles/' + newPuzzleId), nextPuzzleData);
    console.warn('puzzle uploaded!')
  };

  const fetchRandomPuzzle = async ({ dimensions, difficulty }: SinglePlayerOptions): Promise<CurrentGameData> => {
    const dbRef = ref(database);
    const snapshot = await get(child(dbRef, `puzzles/`));
    const data: StoredPuzzleData[] = snapshot.val();
    console.warn('got puzzles from Firebase DB:', Object.values(data))
    console.warn('args', dimensions, difficulty);
    const wordLimits = difficultyWordAmounts[difficulty];
    const randomPool = Object.values(data).filter(puzzle => {
      console.log('list type', puzzle.allWords.length)
      const sizeMatches = puzzle.dimensions.width === dimensions.width && puzzle.dimensions.height === dimensions.height;
      const notTooFewWords = puzzle.allWords.length >= wordLimits.min;
      const notTooManyWords = puzzle.allWords.length <= wordLimits.max;
      sizeMatches && console.log('size match?', sizeMatches);
      notTooFewWords && console.log('notTooFewWords?', notTooFewWords);
      notTooManyWords && console.log('notTooManyWords?', notTooManyWords, '\n\n');
      return (sizeMatches && notTooFewWords && notTooManyWords);
    });
    if (randomPool.length === 0) {
      console.error('NO PUZZLES FOUND!');
    }
    const randomPuzzle: StoredPuzzleData = randomPool[randomInt(0, randomPool.length - 1)];
    const nextMatrix = stringTo2DArray(randomPuzzle.letterString, dimensions.width, dimensions.height);
    const nextGameData: CurrentGameData = {
      allWords: new Set(randomPuzzle.allWords),
      timeLimit: 60,
      letterMatrix: decodeMatrix(nextMatrix, randomPuzzle.metadata.key),
      metadata: randomPuzzle.metadata,
      dimensions: {
        width: dimensions.width,
        height: dimensions.height,
      },
    }
    return nextGameData;
  }

  const generateUrl = process.env.NODE_ENV === 'development' ? `${location.protocol}//${location.hostname}:3000/language-api/generateBoggle/` : 'https://mikedonovan.dev/language-api/generateBoggle/'

  const createSolvedPuzzle = async (options: BoardRequestData): Promise<GeneratedBoardData | undefined> => {
    console.log('Using API to create puzzle with options', options);
    const fetchStart = Date.now();
    try {
      const response = await fetch(generateUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', },
        body: JSON.stringify(options),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: GeneratedBoardData = await response.json();
      console.warn('API PRODUCED PUZZLE IN', (Date.now() - fetchStart), 'ms', data)
      return data;
    } catch (error) {
      console.error('Error fetching puzzle:', error);
      return undefined;
    }
  };

  const createPuzzle = async (options: BoardRequestData): Promise<CurrentGameData | undefined> => {
    const nextPuzzle = await createSolvedPuzzle(options);
    console.log(nextPuzzle);
    if (nextPuzzle) {
      const nextGameData: CurrentGameData = {
        allWords: new Set(nextPuzzle.wordList),
        letterMatrix: nextPuzzle.matrix,
        dimensions: {
          width: options.dimensions.width,
          height: options.dimensions.height,
        },
        metadata: nextPuzzle.metadata,
        timeLimit: 60,
      }
      return nextGameData;
    } else {
      return undefined;
    }
  }

  const startPremadePuzzle = (puzzle: StoredPuzzleData) => {
    const nextMatrix = stringTo2DArray(puzzle.letterString, puzzle.dimensions.width, puzzle.dimensions.height);
    const nextGameData = {
      allWords: new Set(puzzle.allWords),
      timeLimit: 60,
      letterMatrix: decodeMatrix(nextMatrix, puzzle.metadata.key),
      dimensions: {
        width: puzzle.dimensions.width,
        height: puzzle.dimensions.height,
      },
      metadata: puzzle.metadata
    }
    setCurrentGame(nextGameData)
    changePhase('game-board')
  }

  const changePhase = (newPhase: string) => {
    setPhase(newPhase);
  }

  const startSinglePlayerGame = async (options: SinglePlayerOptions) => {
    const randomPuzzle = await fetchRandomPuzzle(options);
    setCurrentGame(randomPuzzle);
    setPhase('game-board');
  }

  const startCreatedPuzzlePreview = async (options: BoardRequestData) => {
    const newPuzzlePreview = await createPuzzle(options);
    if (newPuzzlePreview) {
      setCurrentGame(newPuzzlePreview)
      setPhase('game-board');
    }
  }

  const changeOption = (optionKey: string, newValue: string | number) => {
    console.log('changing', optionKey, 'to', newValue);
    saveToLocalStorage('buggle-options', { ...options, [optionKey]: newValue })
    setOptions(prevOptions => {
      return { ...prevOptions, [optionKey]: newValue };
    });
  }
  return (
    <>
      {phase === 'title' && <TitleScreen changePhase={changePhase} />}
      {phase === 'options' && <OptionsScreen options={options} changeOption={changeOption} />}
      {phase === 'create' && <CreateScreen
        handleClickPremadePuzzle={startPremadePuzzle}
        startCreatedPuzzlePreview={startCreatedPuzzlePreview}
      />}
      {phase === 'select' && <SelectScreen handleClickPremadePuzzle={startPremadePuzzle} startSinglePlayerGame={startSinglePlayerGame} />}
      {phase === 'game-board' &&
        <GameScreen
          player={player}
          currentGame={currentGame}
          options={options}
          handleValidWord={handleValidWord}
          uploadPuzzle={uploadPuzzle}
        />}
      {phase === 'lobby' && <LobbyScreen />}
      <Footer
        phase={phase}
        changePhase={changePhase}
      />
    </>
  )
}

export default App
