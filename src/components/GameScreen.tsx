import { PlayerData, CurrentGameData, OptionsData } from '../App';
import GameBoard from './GameBoard';
import styles from './GameScreen.module.css';
import GameStatusDisplay from './GameStatusDisplay';


interface GameScreenProps {
  currentGame: CurrentGameData;
  options: OptionsData;
  player: PlayerData;
  hidden: boolean;
  handleValidWord: (word: string) => void;
  uploadPuzzle: () => void;
}

function GameScreen({ currentGame, options, player, hidden, handleValidWord, uploadPuzzle }: GameScreenProps) {

  const gameScreenClass = `${styles.GameScreen}${hidden ? ' hidden' : ''}`;
  return (
    <main className={gameScreenClass} >
      <GameStatusDisplay player={player} currentGame={currentGame} />
      <GameBoard
        player={player}
        currentGame={currentGame}
        options={options}
        onValidWord={handleValidWord}
        uploadPuzzle={uploadPuzzle}
      />
    </main>
  )
}

export default GameScreen;