import { useState, useEffect } from 'react'
import './App.css'
import Footer from './components/Footer.tsx'
// import StatusBar from './components/StatusBar'
import TitleScreen from './components/TitleScreen'
import LobbyScreen from './components/LobbyScreen.tsx'
import SelectScreen from './components/SelectScreen.tsx'
import GameScreen from './components/GameScreen'
import OptionsScreen from './components/OptionsScreen'
import CreateScreen from './components/CreateScreen.tsx'
import { set, get, ref, child } from 'firebase/database';
import { database } from './scripts/firebase';
import { generateBoard } from './scripts/generate.ts';
import { stringTo2DArray, randomInt, saveToLocalStorage, getFromLocalStorage } from "./scripts/util.ts";


export type Difficulty = 'easy' | 'medium' | 'hard';
interface PuzzleDimensions {
  height: number;
  width: number;
}

export interface SinglePlayerOptions {
  difficulty: Difficulty;
  puzzleSize: PuzzleDimensions;
}

interface WordRequirement {
  minRequiredWordAmount: number;
  requiredWordLength: number;
}

export interface CreatePuzzleOptions {
  letterDistribution: string;
  lengthRequirements: WordRequirement[];
  maximumPathLength: number;
  minimumWordAmount: number;
  maximumWordAmount: number;
  puzzleSize: PuzzleDimensions;
}

export interface PlayerData {
  score: number;
  wordsFound: Set<string>;
}

export interface CurrentGameData {
  allWords: Set<string>;
  gridSize: PuzzleDimensions;
  letterMatrix: string[][];
  timeLimit: number;
}

interface PointValues {
  [key: number]: number;
}

export interface PuzzleData {
  allWords: Set<string>;
  gridSize: PuzzleDimensions;
  letters: string;
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
  medium: { min: 100, max: 200 },
  hard: { min: 1, max: 100 }
};
const pointValues: PointValues = { 3: 1, 4: 1, 5: 2, 6: 3, 7: 5, 8: 11 };

function App() {
  // const [statusMessage, setStatusMessage] = useState<string>('');
  // const [statusShowing, setStatusShowing] = useState<boolean>(false);
  const [dictionaryBuilt, setDictionaryBuilt] = useState<boolean>(false);
  const [options, setOptions] = useState<OptionsData>(defaultOptions);
  const [phase, setPhase] = useState<string>('title');
  const [letterMatrix, setLetterMatrix] = useState<string[][]>([]);

  const [player, setPlayer] = useState<PlayerData>({
    score: 0,
    wordsFound: new Set(),
  });

  const [currentGame, setCurrentGame] = useState<CurrentGameData>({
    allWords: new Set(),
    gridSize: {
      width: 5,
      height: 5,
    },
    letterMatrix: [],
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
        newValue = (parseInt(newValue)/10) + 'rem';
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

  async function uploadPuzzle() {
    const puzzleData = {
      allWords: Array.from(currentGame.allWords),
      gridSize: currentGame.gridSize,
      letters: letterMatrix.map(row => row.join('')).join(''),
    }
    const newPuzzleId = puzzleData.gridSize.width === puzzleData.gridSize.height ? `${puzzleData.gridSize.width}${puzzleData.letters}` : `${puzzleData.gridSize.width}${puzzleData.gridSize.height}${puzzleData.letters}`;
    const nextPuzzleData = {
      allWords: puzzleData.allWords,
      letters: puzzleData.letters,
      gridSize: puzzleData.gridSize,
    }
    console.log('uploading', newPuzzleId)
    await set(ref(database, 'puzzles/' + newPuzzleId), nextPuzzleData);
    console.warn('puzzle uploaded!')
  }
  const fetchRandomPuzzle = async ({ puzzleSize, difficulty }: SinglePlayerOptions): Promise<CurrentGameData> => {
    const dbRef = ref(database);
    const snapshot = await get(child(dbRef, `puzzles/`));
    const data: PuzzleData[] = snapshot.val();
    const wordLimits = difficultyWordAmounts[difficulty];
    const randomPool = Object.values(data).filter(puzzle => {
      const sizeMatches = puzzle.gridSize.width === puzzleSize.width && puzzle.gridSize.height === puzzleSize.height;
      const notTooFewWords = Array.from(puzzle.allWords).length >= wordLimits.min;
      const notTooManyWords = Array.from(puzzle.allWords).length <= wordLimits.max;
      if (!sizeMatches) {
        console.error('wrong size!');
      }
      if (!notTooFewWords) {
        console.error('too few words!');
      }
      if (!notTooManyWords) {
        console.error('too many words!');
      }
      return (sizeMatches && notTooFewWords && notTooManyWords);
    });
    if (randomPool.length === 0) {
      console.error('NO PUZZLES FOUND!');
    }
    const randomPuzzle: PuzzleData = randomPool[randomInt(0, randomPool.length - 1)];
    const nextMatrix = stringTo2DArray(randomPuzzle.letters, puzzleSize.width, puzzleSize.height);
    const nextGameData: CurrentGameData = {
      allWords: new Set(randomPuzzle.allWords),
      timeLimit: 60,
      letterMatrix: nextMatrix,
      gridSize: {
        width: puzzleSize.width,
        height: puzzleSize.height,
      },
    }
    return nextGameData;
  }

  const createPuzzle = async (options: CreatePuzzleOptions): Promise<CurrentGameData> => {
    console.log('creating puzzle with options', options)
    const nextPuzzle = await generateBoard(options);
    const totalWordAmount = nextPuzzle.wordList.size;
    const lengthRequirements = options.lengthRequirements[0];
    const notEnoughTotalWords = totalWordAmount < options.minimumWordAmount;
    const tooManyTotalWords = totalWordAmount > options.maximumWordAmount;
    const amountOfRequiredWords = Array.from(nextPuzzle.wordList).filter(word => word.length === lengthRequirements.requiredWordLength).length;
    const notEnoughRequiredLengthWords = amountOfRequiredWords < lengthRequirements.minRequiredWordAmount;
    if (notEnoughTotalWords) {
      console.error(totalWordAmount, 'is notEnoughTotalWords!')
    } else if (tooManyTotalWords) {
      console.error(totalWordAmount, 'is tooManyTotalWords!')
    } else if (notEnoughRequiredLengthWords) {
      console.error(amountOfRequiredWords, 'is not enough', lengthRequirements.requiredWordLength, '-letter words!')
    }
    if (notEnoughTotalWords || tooManyTotalWords || notEnoughRequiredLengthWords) {
      return createPuzzle(options);
    } else {
      const nextMatrix = stringTo2DArray(nextPuzzle.letters, options.puzzleSize.width, options.puzzleSize.height);
      const nextGameData: CurrentGameData = {
        allWords: new Set(nextPuzzle.wordList),
        timeLimit: 60,
        letterMatrix: nextMatrix,
        gridSize: {
          width: options.puzzleSize.width,
          height: options.puzzleSize.height,
        },
      }
      console.log('created', nextGameData)
      return nextGameData;
    }
  }

  const startPremadePuzzle = (puzzle: PuzzleData) => {
    console.log('starting', puzzle);
    const nextMatrix = stringTo2DArray(puzzle.letters, puzzle.gridSize.width, puzzle.gridSize.height);
    setLetterMatrix(nextMatrix);
    const nextGameData = {
      allWords: new Set(puzzle.allWords),
      timeLimit: 60,
      letterMatrix: nextMatrix,
      gridSize: {
        width: puzzle.gridSize.width,
        height: puzzle.gridSize.height,
      },
    }
    setCurrentGame(nextGameData)
    changePhase('game-board')
  }

  const changePhase = (newPhase: string) => {
    setPhase(newPhase);
  }

  const startSinglePlayerGame = async (options: SinglePlayerOptions) => {
    const randomPuzzle = await fetchRandomPuzzle(options);
    setLetterMatrix(randomPuzzle.letterMatrix);
    setCurrentGame(randomPuzzle);
    setPhase('game-board');
  }

  const startCreatedPuzzlePreview = async (options: CreatePuzzleOptions) => {
    const newPuzzlePreview = await createPuzzle(options);
    setLetterMatrix(newPuzzlePreview.letterMatrix);
    setCurrentGame(newPuzzlePreview)
    setPhase('game-board');
  }

  const changeOption = (optionKey: string, newValue: string | number) => {
    console.log('changing', optionKey, 'to', newValue);
    saveToLocalStorage('buggle-options', { ...options, [optionKey]: newValue })
    setOptions(prevOptions => {
      return {
        ...prevOptions,
        [optionKey]: newValue,
      };
    });
  }
  return (
    <>
      {/* <StatusBar message={statusMessage} showing={statusShowing} /> */}
      {phase === 'title' && <TitleScreen
        changePhase={changePhase}
      />}
      {phase === 'options' && <OptionsScreen
        options={options}
        changeOption={changeOption}
      />}
      {phase === 'create' && <CreateScreen
        onBuildDictionary={() => setDictionaryBuilt(true)}
        dictionaryBuilt={dictionaryBuilt}
        handleClickPremadePuzzle={startPremadePuzzle}
        startCreatedPuzzlePreview={startCreatedPuzzlePreview}
      />}
      {phase === 'select' && <SelectScreen
        startSinglePlayerGame={startSinglePlayerGame}
      />}
      {phase === 'game-board' &&
        <GameScreen
          player={player}
          currentGame={currentGame}
          options={options}
          letterMatrix={letterMatrix}
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
