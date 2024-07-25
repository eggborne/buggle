import { PlayerData, CurrentGameData } from '../../types/types';
import GameBoard from '../GameBoard';
import styles from './GameScreen.module.css';
import GameStatusDisplay from '../GameStatusDisplay';

interface GameScreenProps {
  gameId?: string;
  currentGame: CurrentGameData;
  player: PlayerData;
  hidden: boolean;
  handleValidWord: (word: string) => void;
  uploadPuzzle: () => void;
}

function GameScreen({ gameId, currentGame, player, hidden, handleValidWord, uploadPuzzle }: GameScreenProps) {
  // const { currentMatch, setGameId } = useFirebase();
  // useEffect(() => {
  //   setGameId(gameId);

  //   return () => {
  //     setGameId(null);
  //   };
  // }, [gameId, setGameId]);

  const gameScreenClass = `${styles.GameScreen}${hidden ? ' hidden' : ''}`;
  return (
    <main className={gameScreenClass} >
      <GameStatusDisplay player={player} currentGame={currentGame} />
      <GameBoard
        gameId={gameId}
        player={player}
        currentGame={currentGame}
        onValidWord={handleValidWord}
        uploadPuzzle={uploadPuzzle}
      />
    </main>
  )
}

export default GameScreen;