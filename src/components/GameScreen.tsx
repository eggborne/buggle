import { PlayerData, CurrentGameData, OptionsData } from '../App';
import GameBoard from './GameBoard';
import styles from './GameScreen.module.css';
import GameStatusDisplay from './GameStatusDisplay';


interface GameScreenProps {
  player: PlayerData;
  currentGame: CurrentGameData;
  options: OptionsData;
  letterMatrix: string[][];
  handleValidWord: (word: string) => void;
  uploadPuzzle: () => void;
}

function GameScreen({ player, currentGame, options, letterMatrix, handleValidWord, uploadPuzzle }: GameScreenProps) {
  return (
    <main
      className={styles.gameScreen}
    >
      <GameStatusDisplay player={player} currentGame={currentGame} />
      <GameBoard
        player={player}
        currentGame={currentGame}
        options={options}
        letterMatrix={letterMatrix}
        onValidWord={handleValidWord}
        uploadPuzzle={uploadPuzzle} />
    </main>
  )
}

export default GameScreen;