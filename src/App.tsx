import { useState } from 'react'
import './App.css'
import Header from './components/Header'
import TitleScreen from './components/TitleScreen'
import SelectScreen from './components/SelectScreen'
import GameScreen from './components/GameScreen'
import OptionsScreen from './components/OptionsScreen'
import { generateBoard } from './scripts/generate'

interface puzzleDimenstions {
  width: number;
  height: number;
}

export interface SinglePlayerOptions {
  puzzleSize: puzzleDimenstions;
  minimumWordAmount: number;
}

function App() {

  const [phase, setPhase] = useState<string>('title');
  const [letterMatrix, setLetterMatrix] = useState<string[][]>([]);

  const [puzzleSize, setPuzzleSize] = useState<puzzleDimenstions>({ width: 4, height: 4 });
  const [minimumWordAmount, setMinimumWordAmount] = useState<number>(20);


  const getPuzzle = async (options: SinglePlayerOptions) => {
    const nextPuzzle = await generateBoard(options.puzzleSize.width, options.puzzleSize.height);
    if (nextPuzzle.wordList.size < options.minimumWordAmount) {
      getPuzzle(options);
    } else {
      setLetterMatrix(nextPuzzle.randomMatrix);
    }
  }

  const changePhase = (newPhase: string) => {
    setPhase(newPhase);
  }

  const startSinglePlayerGame = async (options: SinglePlayerOptions) => {
    setPuzzleSize({
      width: options.puzzleSize.width,
      height: options.puzzleSize.height
    });
    setMinimumWordAmount(options.minimumWordAmount);
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
          letterMatrix={letterMatrix}
          changePhase={changePhase}
        />}
      <Header />
    </>
  )
}

export default App
