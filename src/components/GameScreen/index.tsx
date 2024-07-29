import { PlayerData, CurrentGameData, ConfirmData } from '../../types/types';
import GameBoard from '../GameBoard';
import styles from './GameScreen.module.css';
import GameStatusDisplay from '../GameStatusDisplay';
import { useState } from 'react';
import Modal from '../Modal';
import { useUser } from '../../context/UserContext';

interface GameScreenProps {
  gameId?: string;
  currentGame: CurrentGameData;
  player: PlayerData;
  hidden: boolean;
  handleValidWord: (word: string) => void;
  showConfirmModal: (confirmData: ConfirmData) => void;
  uploadPuzzle: () => void;
}

function GameScreen({ gameId, currentGame, player, hidden, handleValidWord, showConfirmModal, uploadPuzzle }: GameScreenProps) {
  const { isLoggedIn } = useUser();
  const [wordListShowing, setWordListShowing] = useState<boolean>(false);

  // const { currentMatch, setGameId } = useFirebase();
  // useEffect(() => {
  //   setGameId(gameId);

  //   return () => {
  //     setGameId(null);
  //   };
  // }, [gameId, setGameId]);

  let requiredWordList: string[] = [];
  if (currentGame.customizations?.requiredWords?.wordList) {
    requiredWordList = currentGame.customizations.requiredWords.wordList
      .map(word => word.toLowerCase())
      .sort((a, b) => b.length - a.length);
  }

  const gameScreenClass = `${styles.GameScreen}${hidden ? ' hidden' : ''}`;
  return (
    <main className={gameScreenClass} >
      <GameStatusDisplay player={player} currentGame={currentGame} showConfirmModal={showConfirmModal} />
      <GameBoard
        gameId={gameId}
        player={player}
        currentGame={currentGame}
        onValidWord={handleValidWord}
      />
      <div className={styles.lowerButtonArea}>
        {process.env.NODE_ENV === 'development' && <button onClick={uploadPuzzle}>Upload</button>}
        <button onClick={() => setWordListShowing(true)}>Word List</button>
      </div>
      {wordListShowing &&
        <Modal isOpen={wordListShowing} onClose={() => setWordListShowing(false)}>
          {requiredWordList.map(word =>
            <div style={{
              color: '#5f5',
              textTransform: 'uppercase',
              textDecoration: player.wordsFound.has(word) ? 'line-through' : 'none',
            }}>
              {word}
            </div>
          )}
          {Array.from(currentGame.allWords).sort((a, b) => b.length - a.length).map(word =>
            <div style={{
              textTransform: 'uppercase',
              textDecoration: player.wordsFound.has(word) ? 'line-through' : 'none',
              opacity: player.wordsFound.has(word) ? '0.75' : '1',

            }}
              key={word}>
              {word}
            </div>
          )}
        </Modal>
      }
    </main>
  )
}

export default GameScreen;