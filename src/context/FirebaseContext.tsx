import { createContext, useEffect, useState, ReactNode, useContext, Dispatch, SetStateAction } from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';
import { ChallengeData, CurrentGameData, UserData } from '../types/types';
import { database } from '../scripts/firebase';

interface FirebaseContextProps {
  playerList: UserData[] | null;
  challenges: ChallengeData[] | null;
  currentMatch: CurrentGameData | null;
  setGameId: (id: string | null) => void;
  setPlayerList: Dispatch<SetStateAction<UserData[] | null>>;
}

const FirebaseContext = createContext<FirebaseContextProps | undefined>(undefined);

export const FirebaseProvider = ({ children }: { children: ReactNode }) => {
  const [playerList, setPlayerList] = useState<UserData[] | null>(null);
  const [challenges, setChallenges] = useState<ChallengeData[] | null>(null);
  const [currentMatch, setCurrentMatch] = useState<CurrentGameData | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);

  useEffect(() => {
    console.warn('>>>>>> FirebaseContext useEffect[] running!')
    const playerListRef = ref(database, '/players');
    const unsubscribePlayers = onValue(playerListRef, (snapshot) => {
      const data: { [key: string]: UserData } = snapshot.val();
      setPlayerList(Object.values(data));
    });
    console.warn(`----------------> Context STARTED /players listener`);

    const challengesRef = ref(database, '/challenges');
    const unsubscribeChallenges = onValue(challengesRef, (snapshot) => {
      const data: { [key: string]: ChallengeData } = snapshot.val();
      setChallenges(Object.values(data));
    });
    console.warn(`STARTED /challenges listener`);

    return () => {
      unsubscribePlayers();
      console.warn('<---------------- Context STOPPED /players listener');
      unsubscribeChallenges();
      console.warn('STOPPED /challenges listener');
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
    <FirebaseContext.Provider value={{ playerList, challenges, currentMatch, setPlayerList, setGameId }}>
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
