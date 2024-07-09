import { useState } from 'react'
import './App.css'
import Header from './components/Header'
import TitleScreen from './components/TitleScreen'
import SelectScreen from './components/SelectScreen'
import GameScreen from './components/GameScreen'
import OptionsScreen from './components/OptionsScreen'
import { generateBoard } from './scripts/generate'

interface PointValues {
  [key: number]: number;
}

const pointValues: PointValues = {
  3: 1,
  4: 1,
  5: 2,
  6: 3,
  7: 5,
  8: 11,
}

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

function App() {

  const [phase, setPhase] = useState<string>('title');
  const [letterMatrix, setLetterMatrix] = useState<string[][]>([]);
  const [puzzleSize, setPuzzleSize] = useState<PuzzleDimensions>({ width: 4, height: 4 });
  const [minimumWordAmount, setMinimumWordAmount] = useState<number>(20);

  const [player, setPlayer] = useState<PlayerData>({
    score: 0,
    wordsFound: new Set(),
  });
  const [currentGame, setCurrentGame] = useState<CurrentGameData>({
    allWords: new Set(),
    timeLimit: 60,
    gridSize: {
      width: 5,
      height: 5,
    },
  })

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

  const changePhase = (newPhase: string) => {
    setPhase(newPhase);
  }

  const startSinglePlayerGame = async (options: SinglePlayerOptions) => {
    const nextPuzzleSize = {
      width: options.puzzleSize.width,
      height: options.puzzleSize.height
    };
    setPuzzleSize(nextPuzzleSize);
    setMinimumWordAmount(options.minimumWordAmount);
    console.log('starting with puzzleSize', puzzleSize, 'and minimumWordAmount', minimumWordAmount);
    setPhase('select')
    await getPuzzle(options);
    setPhase('game-board');
  }

  return (
    <>
      {phase === 'title' && <TitleScreen changePhase={changePhase} startSinglePlayerGame={startSinglePlayerGame} />}
      {phase === 'options' && <OptionsScreen changePhase={changePhase} />}
      {phase === 'select' && <SelectScreen changePhase={changePhase} />}
      {phase === 'game-board' &&
        <GameScreen
          player={player}
          currentGame={currentGame}
          letterMatrix={letterMatrix}
          handleValidWord={handleValidWord}
        />}
      <Header phase={phase} changePhase={changePhase} />
    </>
  )
}

export default App
