import { PlayerData, CurrentGameData, OptionsData } from '../App';
import GameBoard from './GameBoard';
import styles from './GameScreen.module.css';
import GameStatusDisplay from './GameStatusDisplay';


interface GameScreenProps {
  player: PlayerData;
  currentGame: CurrentGameData;
  options: OptionsData;
  handleValidWord: (word: string) => void;
  uploadPuzzle: () => void;
}

function GameScreen({ player, currentGame, options, handleValidWord, uploadPuzzle }: GameScreenProps) {
  return (
    <main className={styles.gameScreen} >
      <GameStatusDisplay player={player} currentGame={currentGame} />
      {/* <div className={styles.gameArea}> */}
        <GameBoard
          player={player}
          currentGame={currentGame}
          options={options}
          onValidWord={handleValidWord}
          uploadPuzzle={uploadPuzzle}
        />
      {/* </div> */}
    </main>
  )
}

export default GameScreen;