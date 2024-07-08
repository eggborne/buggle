import GameBoard from './GameBoard';
import styles from './GameScreen.module.css';


interface GameScreenProps {
  letterMatrix: string[][];
  changePhase: (phase: string) => void;
};

function GameScreen({ letterMatrix, changePhase }: GameScreenProps) {

  const handleValidWord = (word: string) => {
    console.warn("Valid word:", word);
    
  };

  return (
    <main
      className={styles.gameScreen}

    >
      <GameBoard letterMatrix={letterMatrix} onValidWord={handleValidWord} />
      <button onClick={() => changePhase('title')}>Back</button>
    </main>
  )
}

export default GameScreen;