import { useState, useEffect } from 'react'
import './App.css'
import Footer from './components/Footer.tsx'
// import StatusBar from './components/StatusBar'
import TitleScreen from './components/TitleScreen'
import LobbyScreen from './components/LobbyScreen.tsx'
import GameScreen from './components/GameScreen'
import OptionsScreen from './components/OptionsScreen'
import AdminScreen from './components/AdminScreen'
import { set, get, ref, child } from 'firebase/database';
import { database } from './scripts/firebase';
import { createDictionary, generateBoard } from './scripts/generate.ts';
import { stringTo2DArray, randomInt } from "./scripts/util.ts";


interface PuzzleDimensions {
  width: number;
  height: number;
}

export interface SinglePlayerOptions {
  puzzleSize: PuzzleDimensions;
}

export interface CreatePuzzleOptions {
  puzzleSize: PuzzleDimensions;
  minimumWordAmount: number;
  maximumPathLength: number;
}

export interface PlayerData {
  score: number;
  wordsFound: Set<string>;
}

export interface CurrentGameData {
  allWords: Set<string>;
  timeLimit: number;
  gridSize: PuzzleDimensions;
}

interface PointValues {
  [key: number]: number;
}

export interface PuzzleData {
  allWords: Set<string>;
  letters: string;
  gridSize: PuzzleDimensions;
}

export interface OptionsData {
  cubeRoundness: number;
  gameBackgroundColor: string;
};

const defaultOptions = {
  cubeRoundness: 30,
  gameBackgroundColor: '#223300',
};

const pointValues: PointValues = { 3: 1, 4: 1, 5: 2, 6: 3, 7: 5, 8: 11 }

function App() {
  // const [statusMessage, setStatusMessage] = useState<string>('');
  // const [statusShowing, setStatusShowing] = useState<boolean>(false);
  const [options, setOptions] = useState<OptionsData | null>(null);
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
    timeLimit: 60,
  });

  useEffect(() => {
    createDictionary();
    setOptions(defaultOptions)
  }, []);

  useEffect(() => {
    for (const optionKey in options) {
      const varName = '--' + optionKey.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
      let newValue = options[optionKey as keyof OptionsData].toString();
      if (optionKey === 'cubeRoundness') {
        newValue += '%';
      }
      document.documentElement.style.setProperty(varName, newValue)
    }

  }, [options])

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

  function uploadPuzzle() {
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

    console.warn('uploading', newPuzzleId, nextPuzzleData)

    set(ref(database, 'puzzles/' + newPuzzleId), nextPuzzleData);
  }

  const fetchRandomPuzzle = async (size: PuzzleDimensions): Promise<PuzzleData> => {
    const dbRef = ref(database);
    const snapshot = await get(child(dbRef, `puzzles/`));
    const data: PuzzleData[] = snapshot.val();
    const randomPool = Object.values(data).filter(puzzle => puzzle.gridSize.width === size.width && puzzle.gridSize.height === size.height);
    const randomPuzzle: PuzzleData = randomPool[randomInt(0, randomPool.length - 1)];
    return randomPuzzle;
  }

  const getPuzzle = async (options: CreatePuzzleOptions) => {
    const nextPuzzle = await generateBoard(options);
    if (nextPuzzle.wordList.size < options.minimumWordAmount) {
      getPuzzle(options);
    } else {
      setLetterMatrix(nextPuzzle.randomMatrix);

      const nextGameData = {
        allWords: nextPuzzle.wordList,
        timeLimit: 60,
        gridSize: {
          width: options.puzzleSize.width,
          height: options.puzzleSize.height,
        },
      }
      setCurrentGame(nextGameData)
    }
  }

  const startPuzzle = (puzzle: PuzzleData) => {
    document.documentElement.style.setProperty('--puzzle-width', puzzle.gridSize.width.toString());
    document.documentElement.style.setProperty('--puzzle-height', puzzle.gridSize.height.toString());
    console.log('starting', puzzle);
    const nextMatrix = stringTo2DArray(puzzle.letters, puzzle.gridSize.width, puzzle.gridSize.height);
    setLetterMatrix(nextMatrix);
    const nextGameData = {
      allWords: new Set(puzzle.allWords),
      timeLimit: 60,
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
    const randomPuzzle = await fetchRandomPuzzle(options.puzzleSize);
    startPuzzle(randomPuzzle);
  }

  const startCreatedPuzzlePreview = async (options: CreatePuzzleOptions) => {
    await getPuzzle(options);
    setPhase('game-board');
  }

  const changeOption = (optionKey: string, newValue: string | number) => {
    console.log('changing', optionKey, 'to', newValue);
    setOptions(prevOptions => {
      if (!prevOptions) return null;
      return {
        ...prevOptions,
        [optionKey]: newValue,
      };
    });
  }
  return (
    <>
      {/* <StatusBar message={statusMessage} showing={statusShowing} /> */}
      {phase === 'title' && <TitleScreen changePhase={changePhase} startSinglePlayerGame={startSinglePlayerGame} />}
      {phase === 'options' && <OptionsScreen options={options} changeOption={changeOption} />}
      {phase === 'admin' && <AdminScreen handleClickPremadePuzzle={startPuzzle} startSinglePlayerGame={startSinglePlayerGame} startCreatedPuzzlePreview={startCreatedPuzzlePreview} />}
      {phase === 'select' && <LobbyScreen />}
      {phase === 'game-board' &&
        <GameScreen
          player={player}
          currentGame={currentGame}
          letterMatrix={letterMatrix}
          handleValidWord={handleValidWord}
          uploadPuzzle={uploadPuzzle}
        />}
      <Footer phase={phase} changePhase={changePhase} />
    </>
  )
}

export default App
