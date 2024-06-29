import GameBoard from './GameBoard';
import './GameScreen.css'

interface GameScreenProps {
  letterMatrix: string[][];
  changePhase: (phase: string) => void;
};

function GameScreen({ letterMatrix, changePhase }: GameScreenProps) {
  return (
    <main
      className='game-screen'
      
    >
      <div className='debug'>
        
      </div>
      <GameBoard letterMatrix={letterMatrix} />
      <button onClick={() => changePhase('title')}>Back</button>
    </main>
  )
}

export default GameScreen;