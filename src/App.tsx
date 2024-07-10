import { useState, useEffect } from 'react'
import './App.css'
import Footer from './components/Footer.tsx'
// import StatusBar from './components/StatusBar'
import TitleScreen from './components/TitleScreen'
import SelectScreen from './components/SelectScreen'
import GameScreen from './components/GameScreen'
import OptionsScreen from './components/OptionsScreen'
import AdminScreen from './components/AdminScreen'
import { generateBoard } from './scripts/generate'
import { set, ref } from 'firebase/database';
import { database } from './scripts/firebase.ts';
import { createDictionary } from './scripts/generate.ts';
import { stringTo2DArray } from "./scripts/util.ts";


interface PuzzleDimensions {
  width: number;
  height: number;
}

export interface SinglePlayerOptions {
  puzzleSize: PuzzleDimensions;
  minimumWordAmount: number;
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

const pointValues: PointValues = { 3: 1, 4: 1, 5: 2, 6: 3, 7: 5, 8: 11, }

function App() {
  // const [statusMessage, setStatusMessage] = useState<string>('');
  // const [statusShowing, setStatusShowing] = useState<boolean>(false);
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
  }, []);

  const handleValidWord = (word: string) => {
    console.warn("Valid word:", word);
    if (player.wordsFound.has(word)) {
      console.error('already found', word)
    } else {
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
    }
  };

  function uploadPuzzle() {
    const puzzleData = {
      allWords: Array.from(currentGame.allWords),
      gridSize: currentGame.gridSize,
      letters: letterMatrix.map(row => row.join('')).join(''),
    }
    const newPuzzleId = puzzleData.gridSize.width === puzzleData.gridSize.height ? `${puzzleData.gridSize.width}${puzzleData.letters}` : `${puzzleData.gridSize.width}${puzzleData.gridSize.height}${puzzleData.letters}` ;
    const nextPuzzleData = {
      allWords: puzzleData.allWords,
      letters: puzzleData.letters,
      gridSize: puzzleData.gridSize,
    }

    console.warn('uploading', newPuzzleId, nextPuzzleData)

    set(ref(database, 'puzzles/' + newPuzzleId), nextPuzzleData);
  }

  const getPuzzle = async (options: SinglePlayerOptions) => {
    const nextPuzzle = await generateBoard(options.puzzleSize.width, options.puzzleSize.height);
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
    console.log('clicked', puzzle);
    const nextMatrix = stringTo2DArray(puzzle.letters, puzzle.gridSize.width, puzzle.gridSize.height);
    console.warn('nextMatrix', nextMatrix);
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
    await getPuzzle(options);
    setPhase('game-board');
  }

  return (
    <>
      {/* <StatusBar message={statusMessage} showing={statusShowing} /> */}
      {phase === 'title' && <TitleScreen changePhase={changePhase} startSinglePlayerGame={startSinglePlayerGame} />}
      {phase === 'options' && <OptionsScreen />}
      {phase === 'admin' && <AdminScreen handleClickPremadePuzzle={startPuzzle} />}
      {phase === 'select' && <SelectScreen />}
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
