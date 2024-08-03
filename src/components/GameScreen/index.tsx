import { ConfirmData, UserData } from '../../types/types';
import GameBoard from '../GameBoard';
import styles from './GameScreen.module.css';
import GameStatusDisplay from '../GameStatusDisplay';
import { useEffect, useState } from 'react';
import Modal from '../Modal';
import { useFirebase } from '../../context/FirebaseContext';
import { useUser } from '../../context/UserContext';
import { get, child, ref } from 'firebase/database';
import { database } from '../../scripts/firebase';

interface GameScreenProps {
  hidden: boolean;
  showConfirmModal: (confirmData: ConfirmData) => void;
  uploadPuzzle: () => void;
}

function GameScreen({ hidden, showConfirmModal, uploadPuzzle }: GameScreenProps) {
  const [wordListShowing, setWordListShowing] = useState<boolean>(false);
  const { isLoggedIn, user } = useUser();
  const { currentMatch } = useFirebase();
  const [opponentData, setOpponentData] = useState<UserData | null>(null);
  const isMultiplayer = !!(isLoggedIn && currentMatch && currentMatch.id && currentMatch.respondent && currentMatch.instigator);

  useEffect(() => {
    if (currentMatch && isMultiplayer && !opponentData) {
      const getOpponentData = async (opponentUid: string) => {
        const snapshot = await get(child(ref(database), `players/${opponentUid}`));
        if (snapshot.exists()) {
          const opponentData = snapshot.val();
          setOpponentData(opponentData);
        }
      }
      const initialOpponentUid = (isMultiplayer && currentMatch.instigator?.uid === user?.uid) ? currentMatch.respondent?.uid : currentMatch.instigator?.uid;
      if (!initialOpponentUid) return;
      getOpponentData(initialOpponentUid);
    }
  }, [currentMatch]);

  let requiredWordList: string[] = [];
  if (currentMatch?.customizations?.requiredWords?.wordList) {
    requiredWordList = currentMatch.customizations.requiredWords.wordList
      .map(word => word.toLowerCase())
      .sort((a, b) => b.length - a.length);
  }

  const gameScreenClass = `${styles.GameScreen}${hidden ? ' hidden' : ''}`;

  return (
    <main className={gameScreenClass} >
      <GameStatusDisplay isMultiplayer={isMultiplayer} opponentData={opponentData} showConfirmModal={showConfirmModal} />
      <GameBoard
        opponentData={opponentData}
      />
      <div className={`lower-button-area ${styles.gameButtons}`}>
        <button className={`knob`}></button>
        <button className={`knob`}></button>
        <button className={`knob`}></button>
      </div>
      {wordListShowing && currentMatch && user &&
        <Modal isOpen={wordListShowing} onClose={() => setWordListShowing(false)}>
          {requiredWordList.map(word =>
            <div style={{
              color: '#5f5',
              textTransform: 'uppercase',
              textDecoration: currentMatch.foundWordsRecord && currentMatch.foundWordsRecord[word] === user.uid ? 'line-through' : 'none',
            }}>
              {word}
            </div>
          )}
          {Array.from(currentMatch.allWords).sort((a, b) => b.length - a.length).map(word =>
            <div style={{
              textTransform: 'uppercase',
              textDecoration: currentMatch.foundWordsRecord && currentMatch.foundWordsRecord[word] === user.uid ? 'line-through' : 'none',
              opacity: currentMatch.foundWordsRecord && currentMatch.foundWordsRecord[word] === user.uid ? '0.75' : '1',
            }}
              key={word}>
              {word}
            </div>
          )}
        </Modal>
      }
      {process.env.NODE_ENV === 'development' && <div className={`dev-window`}>
        {<button onClick={uploadPuzzle}>Upload</button>}
        <button onClick={() => setWordListShowing(true)}>Word List</button>
      </div>}
    </main>
  )
}

export default GameScreen;