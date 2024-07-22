import { PlayerData, CurrentGameData, OptionsData } from '../../App';
import GameBoard from '../GameBoard/GameBoard';
import styles from './GameScreen.module.css';
import GameStatusDisplay from '../GameStatusDisplay/GameStatusDisplay';
import Modal from '../Modal';

interface GameScreenProps {
  gameId?: string;
  currentGame: CurrentGameData;
  options: OptionsData;
  player: PlayerData;
  hidden: boolean;
  handleValidWord: (word: string) => void;
  uploadPuzzle: () => void;
}

function GameScreen({ gameId, currentGame, options, player, hidden, handleValidWord, uploadPuzzle }: GameScreenProps) {

  const gameScreenClass = `${styles.GameScreen}${hidden ? ' hidden' : ''}`;
  return (
    <main className={gameScreenClass} >
      <GameStatusDisplay player={player} currentGame={currentGame} />
      <GameBoard
        gameId={gameId}
        player={player}
        currentGame={currentGame}
        options={options}
        onValidWord={handleValidWord}
        uploadPuzzle={uploadPuzzle}
      />
      <Modal isOpen={false} />
    </main>
  )
}

export default GameScreen;