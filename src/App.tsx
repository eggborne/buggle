import { useState } from 'react'
import './App.css'
import Header from './components/Header'
import TitleScreen from './components/TitleScreen'
import SelectScreen from './components/SelectScreen'
import GameScreen from './components/GameScreen'
import OptionsScreen from './components/OptionsScreen'

function App() {

  const [phase, setPhase] = useState<string>('title');
  const [letterMatrix, setLetterMatrix] = useState<string[][]>([
    ['a','b','c','d'],
    ['e','f','g','h'],
    ['i','j','k','l'],
    ['m','n','o','p'],
  ]);


  const changePhase = (newPhase: string) => {
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
