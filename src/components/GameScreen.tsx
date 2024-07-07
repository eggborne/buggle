import GameBoard from './GameBoard';
import styles from './GameScreen.module.css';


interface GameScreenProps {
  letterMatrix: string[][];
  changePhase: (phase: string) => void;
};

function GameScreen({ letterMatrix, changePhase }: GameScreenProps) {

  return (
    <main
      className={styles.gameScreen}

    >
      <GameBoard letterMatrix={letterMatrix} />
      <button onClick={() => changePhase('title')}>Back</button>
    </main>
  )
}

export default GameScreen;