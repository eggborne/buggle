import { useState } from 'react'
import './App.css'
import Header from './components/Header'
import TitleScreen from './components/TitleScreen'
import SelectScreen from './components/SelectScreen'
import GameScreen from './components/GameScreen'
import OptionsScreen from './components/OptionsScreen'
import { generateBoard } from './scripts/generate'


function App() {

  const [phase, setPhase] = useState<string>('title');
  const [letterMatrix, setLetterMatrix] = useState<string[][]>([
    ['a','b','c','d'],
    ['e','f','g','h'],
    ['i','j','k','l'],
    ['m','n','o','p'],
  ]);

  const getPuzzle = async () => {
    const nextPuzzle = await generateBoard(4);
    console.log('nextpuzzle', nextPuzzle.wordList)
    if (nextPuzzle.wordList.size < 6) {
      getPuzzle()
    } else {
      setLetterMatrix(nextPuzzle.randomMatrix);
    }
  }

  const changePhase = (newPhase: string) => {
    if (newPhase === 'game-board') {
      getPuzzle();
    }
    setPhase(newPhase);
  }

  return (
    <>
      {phase === 'title' && <TitleScreen changePhase={changePhase}/>}
      {phase === 'options' && <OptionsScreen changePhase={changePhase}/>}
      {phase === 'select' && <SelectScreen changePhase={changePhase}/>}
      {phase === 'game-board' && <GameScreen letterMatrix={letterMatrix} changePhase={changePhase} />}
      <Header />
    </>
  )
}

export default App
