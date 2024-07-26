import { createContext, useEffect, useState, ReactNode, useContext, Dispatch, SetStateAction } from 'react';
import { getDatabase, ref, onValue, remove } from 'firebase/database';
import { ChallengeData, CurrentGameData, UserData } from '../types/types';
import { database } from '../scripts/firebase';

interface FirebaseContextProps {
  playerList: UserData[] | null;
  challenges: Record<string, ChallengeData> | null;
  currentMatch: CurrentGameData | null;
  revokeOutgoingChallenges: (uid: string) => void;
  setGameId: (id: string | null) => void;
  setPlayerList: Dispatch<SetStateAction<UserData[] | null>>;
}

const FirebaseContext = createContext<FirebaseContextProps | undefined>(undefined);

export const FirebaseProvider = ({ children }: { children: ReactNode }) => {
  const [playerList, setPlayerList] = useState<UserData[] | null>(null);
  const [challenges, setChallenges] = useState<Record<string, ChallengeData> | null>(null);
  const [currentMatch, setCurrentMatch] = useState<CurrentGameData | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);

  const revokeOutgoingChallenges = async (uid: string) => {
    if (challenges) {
      const challengesToRemove = Object.values(challenges).filter(challenge => challenge.instigator === uid);
      challengesToRemove.forEach(async (challenge) => {
        const idToRemove = Object.keys(challenges).find(key => challenges[key].instigator === uid && challenges[key].respondent === challenge.respondent);
        await remove(ref(database, `challenges/${idToRemove}`));
      });
    }
  };

  useEffect(() => {
    console.warn('>>>>>> FirebaseContext useEffect[] running!')
    const playerListRef = ref(database, '/players');
    const unsubscribePlayers = onValue(playerListRef, (snapshot) => {
      const data: { [key: string]: UserData } = snapshot.val();
      setPlayerList(Object.values(data || {}));
    });
    console.warn(`----------------> Context STARTED /players listener`);

    const challengesRef = ref(database, '/challenges');
    const unsubscribeChallenges = onValue(challengesRef, (snapshot) => {
      const data: { [key: string]: ChallengeData } = snapshot.val();
      setChallenges(data || {});
    });
    console.warn(`----------------> Context STARTED /challenges listener`);

    return () => {
      unsubscribePlayers();
      console.warn('<---------------- Context STOPPED /players listener');
      unsubscribeChallenges();
      console.warn('<---------------- Context STOPPED /challenges listener');
    };
  }, []);

  useEffect(() => {
    if (gameId) {
      const db = getDatabase();
      const gameRef = ref(db, `/games/${gameId}`);
      const unsubscribeGame = onValue(gameRef, (snapshot) => {
        const data: CurrentGameData = snapshot.val();
        setCurrentMatch(data);
      });

      return () => unsubscribeGame();
    }
  }, [gameId]);

  return (
    <FirebaseContext.Provider value={{
      challenges,
      currentMatch,
      playerList,
      revokeOutgoingChallenges,
      setPlayerList,
      setGameId,
    }}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};
