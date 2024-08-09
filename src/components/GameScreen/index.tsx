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
import AttackButtons from '../AttackButtons';
import DevWindow from '../DevWindow';

interface GameScreenProps {
  hidden: boolean;
  showConfirmModal: (confirmData: ConfirmData) => void;
}

function GameScreen({ hidden, showConfirmModal }: GameScreenProps) {
  const [wordListShowing, setWordListShowing] = useState<boolean>(false);
  const { isLoggedIn, user } = useUser();
  const { currentMatch } = useFirebase();
  const [opponentData, setOpponentData] = useState<UserData | null>(null);
  const isMultiplayer = !!(isLoggedIn && currentMatch && currentMatch.id);

  useEffect(() => {
    if (currentMatch && isMultiplayer && !opponentData) {
      const getOpponentData = async (opponentUid: string) => {
        const snapshot = await get(child(ref(database), `players/${opponentUid}`));
        if (snapshot.exists()) {
          const opponentData = snapshot.val();
          setOpponentData(opponentData);
        }
      }
      // const initialOpponentUid = (isMultiplayer && currentMatch.instigatorUid === user?.uid) ? currentMatch.respondentUid : currentMatch.instigatorUid;
      const initialOpponentUid = Object.keys(currentMatch.playerProgress).filter(key => key !== user?.uid)[0];
      if (!initialOpponentUid) return;
      getOpponentData(initialOpponentUid);
    }
  }, [currentMatch]);

  const gameScreenClass = `${styles.GameScreen}${hidden ? ' hidden' : ''}`;

  // console.log('gamescreen current match', currentMatch)

  return (
    <main className={gameScreenClass} >
      {currentMatch && <GameStatusDisplay gameStarted={opponentData ? currentMatch.playerProgress[opponentData.uid].ready === true : true} isMultiplayer={isMultiplayer} opponentData={opponentData} showConfirmModal={showConfirmModal} />}
      <GameBoard
        opponentData={opponentData}
      />
      {user && currentMatch && opponentData &&
        <AttackButtons
          availablePowers={currentMatch.playerProgress[user.uid].availablePowers}
          opponentData={opponentData}
          userProgress={currentMatch?.playerProgress[user.uid]}
          behind={currentMatch?.playerProgress[opponentData.uid].score > currentMatch?.playerProgress[user.uid].score}
        />
      }
      {wordListShowing && currentMatch && user &&
        <Modal isOpen={wordListShowing} onClose={() => setWordListShowing(false)}>
          {(currentMatch.specialWords || []).sort((a, b) => b.length - a.length).map(word =>
            <div key={word} style={{
              color: '#5f5',
              textTransform: 'uppercase',
              textDecoration: currentMatch.foundWordsRecord && currentMatch.foundWordsRecord[word] === user.uid ? 'line-through' : 'none',
            }}>
              {word}
            </div>
          )}
          {Array.from(currentMatch.allWords)
            .sort((a, b) => b.length - a.length)
            .filter(word => !currentMatch.specialWords || !currentMatch.specialWords?.includes(word))
            .map(word =>
              <div key={word} style={{
                textTransform: 'uppercase',
                textDecoration: currentMatch.foundWordsRecord && currentMatch.foundWordsRecord[word] === user.uid ? 'line-through' : 'none',
                opacity: currentMatch.foundWordsRecord && currentMatch.foundWordsRecord[word] === user.uid ? '0.75' : '1',
              }}>
                {word}
              </div>
            )}
        </Modal>
      }
      {process.env.NODE_ENV === 'development' && 
        <DevWindow currentMatch={currentMatch} showWordList={() => setWordListShowing(true)} />}
    </main>
  )
}

export default GameScreen;