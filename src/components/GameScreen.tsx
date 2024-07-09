import { PlayerData, CurrentGameData } from '../App';
import GameBoard from './GameBoard';
import styles from './GameScreen.module.css';
import GameStatusDisplay from './GameStatusDisplay';


interface GameScreenProps {
  player: PlayerData;
  currentGame: CurrentGameData;
  letterMatrix: string[][];
  handleValidWord: (word: string) => void;
}

function GameScreen({ player, currentGame, letterMatrix, handleValidWord }: GameScreenProps) {

  return (
    <main
      className={styles.gameScreen}
    >
      <GameStatusDisplay player={player} currentGame={currentGame} />
      <GameBoard letterMatrix={letterMatrix} onValidWord={handleValidWord} />      
    </main>
  )
}

export default GameScreen;