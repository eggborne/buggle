import { ConfirmData, DeployedPowerupData, UserData } from '../../types/types';
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
  const { isLoggedIn, user } = useUser();
  const { currentMatch } = useFirebase();
  const [currentEffects, setCurrentEffects] = useState<{
    user: DeployedPowerupData[] | [];
    opponent: DeployedPowerupData[] | [];
  } | null>(null);
  const [wordListShowing, setWordListShowing] = useState<boolean>(false);
  const [opponentData, setOpponentData] = useState<UserData | null>(null);

  // const prevFoundWordsRef = useRef<{
  //   user: string[];
  //   opponent: string[];
  // }>({
  //   user: [],
  //   opponent: [],
  // });

  const isMultiplayer = !!(isLoggedIn && currentMatch && currentMatch.id);

  // useEffect(() => {
  //   let unsubscribe: (() => void);

  //   console.log('calling subscribeToFoundWords');
  //   unsubscribe = subscribeToFoundWords((foundWordsRecord: Record<string, false | string>) => {
  //     const currentUserFoundWords = Object.entries(foundWordsRecord)
  //       .filter(([_, value]) => value === user?.uid)
  //       .map(([key, _]) => key);
      
  //     const currentOpponentFoundWords = Object.entries(foundWordsRecord)
  //       .filter(([_, value]) => value === opponentData?.uid)
  //       .map(([key, _]) => key);
        
  //     prevFoundWordsRef.current = {
  //       user: currentUserFoundWords,
  //       opponent: currentOpponentFoundWords,
  //     }
  //   });

  //   return () => {
  //     if (unsubscribe) {
  //       console.log('unsubbing subscribeToFoundWords')
  //       unsubscribe();
  //     }
  //   };
  // }, []);

  useEffect(() => {
    if (currentMatch && isMultiplayer && !opponentData) {
      const getOpponentData = async (opponentUid: string) => {
        const snapshot = await get(child(ref(database), `players/${opponentUid}`));
        if (snapshot.exists()) {
          const opponentData = snapshot.val();
          setOpponentData(opponentData);
        }
      }
      // find player in playerProgress who is not user (opponent)
      const initialOpponentUid = Object.keys(currentMatch.playerProgress).filter(key => key !== user?.uid)[0];
      if (!initialOpponentUid) return;
      getOpponentData(initialOpponentUid);
    }
  }, [currentMatch]);

  useEffect(() => {
    console.warn('powerups changed');
    const powerupsTargetingUser = (Object.values(currentMatch?.activePowerups || {})).filter(p => p.target === user?.uid);
    const powerupsTargetingOpponent = (Object.values(currentMatch?.activePowerups || {})).filter(p => p.target === opponentData?.uid);
    setCurrentEffects({
      user: powerupsTargetingUser,
      opponent: powerupsTargetingOpponent,
    });
  }, [currentMatch?.activePowerups, user?.uid, opponentData?.uid]);

  if (!currentMatch) return;
  const { playerProgress } = currentMatch;

  const gameScreenClass = `${styles.GameScreen}${hidden ? ' hidden' : ''}`;

  return (
    <main className={gameScreenClass} >
      {currentMatch &&
        <GameStatusDisplay currentEffects={currentEffects} gameStarted={opponentData ? playerProgress[opponentData.uid].ready === true : true} isMultiplayer={isMultiplayer} opponentData={opponentData} showConfirmModal={showConfirmModal} />
      }
      <GameBoard
        opponentData={opponentData}
        currentEffects={currentEffects}
      />
      {user && currentMatch &&
        <AttackButtons
          availablePowers={playerProgress[user.uid].availablePowers}
          userProgress={playerProgress[user.uid]}
          behind={opponentData ? playerProgress[opponentData.uid].score > playerProgress[user.uid].score : undefined}
          opponentData={opponentData ? opponentData : undefined}
        />
      }
      {wordListShowing && currentMatch && user &&
        <Modal isOpen={wordListShowing} onClose={() => setWordListShowing(false)}>
          <h2>{[...currentMatch.allWords].length} words</h2>
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