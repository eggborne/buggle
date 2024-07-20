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

export type WordLength = number;
export type Comparison = string;
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface PlayerData {
  score: number;
  wordsFound: Set<string>;
}

interface PuzzleMetadata {
  averageWordLength: number;
  dateCreated: number;
  percentUncommon: number;
  key?: Record<string, string>;
}

export interface PuzzleDimensions {
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
  customizations?: {
    requiredWords?: string[];
    customLetters?: string;
  };
  maxAttempts: number;
  returnBest: boolean;
}

interface GeneratedBoardData {
  attempts: number,
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
  cubeColor: string,
  cubeTextColor: string,
  footerHeight: number,
  cubeGap: number;
  cubeRoundness: number;
  gameBackgroundColor: string;
  gameBoardBackgroundColor: string,
  gameBoardPadding: number;
  gameBoardSize: number;
  swipeBuffer: number;
}

const defaultStyleOptions = {
  cubeColor: '#aaaaaa',
  cubeGap: 44,
  cubeTextColor: '#222222',
  cubeRoundness: 32,
  footerHeight: 6,
  gameBackgroundColor: '#223300',
  gameBoardBackgroundColor: '#2a283e',
  gameBoardPadding: 32,
  gameBoardSize: 96,
  swipeBuffer: 70,
};

const difficultyWordAmounts: Record<Difficulty, { min: number, max: number }> = {
  easy: { min: 200, max: 10000 },
  medium: { min: 150, max: 250 },
  hard: { min: 1, max: 150 }
};
const pointValues: PointValues = { 3: 1, 4: 1, 5: 2, 6: 3, 7: 5, 8: 11 };

function App() {
  const [options, setOptions] = useState<OptionsData>(defaultStyleOptions);
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
    const initialOptions = localOptions || defaultStyleOptions;
    console.log('setting options', initialOptions);
    setOptions(localOptions || defaultStyleOptions);
  }, []);

  useEffect(() => {
    for (const optionKey in options) {
      const varName = '--user-' + optionKey.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
      const newValue = options[optionKey as keyof OptionsData].toString();
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
    const newPuzzleId = `${currentGame.dimensions.width}${currentGame.dimensions.height}${nextPuzzleData.letterString}`;
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
    console.log('>>>>>>>>>>>>  Using API to create puzzle with options', options);
    const fetchStart = Date.now();
    try {
      const rawResponse = await fetch(generateUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', },
        body: JSON.stringify(options),
      });
      // if (!response.ok) {
      //   throw new Error(`HTTP error! status: ${response.status}`);
      // }
      const response = await rawResponse.json();
      if (response.success) {
        const data: GeneratedBoardData = response.data
        console.warn(`${response.message} in ${Date.now() - fetchStart}ms`);
        console.warn('<<<<<<<<<<<<  returning GeneratedBoardData', response.data);
        return data;
      } else {
        console.error(response.message);
        return undefined;
      }
    } catch (error) {
      console.error('Error fetching puzzle:', error);
      return undefined;
    }
  };

  const createPuzzle = async (options: BoardRequestData): Promise<CurrentGameData | undefined> => {
    const nextPuzzle = await createSolvedPuzzle(options);
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
      console.log('made CurrentGameData nextGameData', nextGameData)
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
    changePhase('game')
  }

  const changePhase = (newPhase: string) => {
    setPhase(newPhase);
  }

  const startSinglePlayerGame = async (options: SinglePlayerOptions) => {
    const randomPuzzle = await fetchRandomPuzzle(options);
    setCurrentGame(randomPuzzle);
    setPhase('game');
  }

  const startCreatedPuzzlePreview = async (options: BoardRequestData) => {
    const newPuzzlePreview = await createPuzzle(options);
    if (newPuzzlePreview) {
      setCurrentGame(newPuzzlePreview)
      setPhase('game');
    }
    return;
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
      <div className={'screen-container'}>
        <TitleScreen hidden={phase !== 'title'} changePhase={changePhase} />
        <OptionsScreen hidden={phase !== 'options'} options={options} changeOption={changeOption} />
        <CreateScreen hidden={phase !== 'create'} handleClickPremadePuzzle={startPremadePuzzle} startCreatedPuzzlePreview={startCreatedPuzzlePreview} />
        <SelectScreen hidden={phase !== 'select'} handleClickPremadePuzzle={startPremadePuzzle} startSinglePlayerGame={startSinglePlayerGame} />
        <GameScreen hidden={phase !== 'game'} player={player} currentGame={currentGame} options={options} handleValidWord={handleValidWord} uploadPuzzle={uploadPuzzle} />
        <LobbyScreen hidden={phase !== 'lobby'} />
      </div>
      <Footer phase={phase} changePhase={changePhase} />
    </>
  )
}

export default App
