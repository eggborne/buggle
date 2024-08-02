import { createContext, useEffect, useState, ReactNode, useContext, Dispatch, SetStateAction } from 'react';
import { ref, onValue, remove, off, get, set, update, DataSnapshot } from 'firebase/database';
import { ChallengeData, CurrentGameData, UserData } from '../types/types';
import { database } from '../scripts/firebase';
import { useUser } from './UserContext';

interface FirebaseContextProps {
  playerList: UserData[] | null;
  challenges: Record<string, ChallengeData> | null;
  currentMatch: CurrentGameData | null;
  joinNewGame: (newGameId: string | null) => void;
  markChallengeAccepted: (challegeId: string) => void;
  setCurrentMatch: Dispatch<SetStateAction<CurrentGameData | null>>;
  startNewGame: (newGameData: CurrentGameData, newGameId?: string) => void;
  revokeAllOutgoingChallenges: (uid: string) => void;
  revokeOutgoingChallenge: (challengeId: string) => void;
  setGameId: (id: string | null) => void;
  setPlayerList: Dispatch<SetStateAction<UserData[] | null>>;
  updatePlayerFoundWords: (playerUid: string, newWord: string) => void;
  updatePlayerScore: (playerUid: string, newValue: number) => void;
}

const FirebaseContext = createContext<FirebaseContextProps | undefined>(undefined);

export const FirebaseProvider = ({ children }: { children: ReactNode }) => {
  const [playerList, setPlayerList] = useState<UserData[] | null>(null);
  const [challenges, setChallenges] = useState<Record<string, ChallengeData> | null>(null);
  const [currentMatch, setCurrentMatch] = useState<CurrentGameData | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const { isLoggedIn } = useUser();

  useEffect(() => {
    const playerListRef = ref(database, '/players');
    const handlePlayerList = (snapshot: DataSnapshot) => {
      const data: { [key: string]: UserData } = snapshot.val();
      setPlayerList(Object.values(data || {}));
    };
    onValue(playerListRef, handlePlayerList);
    console.warn(`players ----------> Context STARTED listener`);

    return () => {
      off(playerListRef, 'value', handlePlayerList);
      console.warn('players <---------- Context STOPPED listener');
    };
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      const challengesRef = ref(database, '/challenges');
      const handleChallenges = (snapshot: DataSnapshot) => {
        const data: { [key: string]: ChallengeData } = snapshot.val();
        setChallenges(data || {});
      };
      onValue(challengesRef, handleChallenges);
      console.warn(`challenges ----------> Context STARTED listener`);

      return () => {
        off(challengesRef, 'value', handleChallenges);
        console.warn('challenges <---------- Context STOPPED listener');
      };
    } else {
      setChallenges(null);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (gameId) {
      const gameRef = ref(database, `/games/${gameId}`);
      const handleGame = (snapshot: DataSnapshot) => {
        const data: CurrentGameData = snapshot.val();
        setCurrentMatch(data);
      }
      const unsubscribeGame = onValue(gameRef, handleGame);
      console.warn(`game ----------> Context STARTED listener`);
      return () => {
        unsubscribeGame();
        console.warn('game <---------- Context STOPPED listener');
      };
    } else {
      setCurrentMatch(null);
    }
  }, [gameId]);

  const revokeAllOutgoingChallenges = async (uid: string) => {
    if (challenges) {
      const challengesToRemove = Object.values(challenges).filter(challenge => challenge.instigator === uid);
      challengesToRemove.forEach(async (challenge) => {
        const idToRemove = Object.keys(challenges).find(key => challenges[key].instigator === uid && challenges[key].respondent === challenge.respondent);
        await remove(ref(database, `challenges/${idToRemove}`));
      });
    }
  };

  const revokeOutgoingChallenge = async (challengeId: string) => {
    if (challenges) {
      await remove(ref(database, `challenges/${challengeId}`));      
    }
  };

  const startNewGame = async (newGameData: CurrentGameData, newGameId: string | null = null) => {
    if (newGameId) {
      await set(ref(database, `games/${newGameId}`), newGameData);
      setGameId(newGameId);
    }
    setCurrentMatch(newGameData);
    console.log('set current match to', newGameData);
  };

  const joinNewGame = async (newGameId: string | null = null) => {
    if (newGameId) {
      const snapshot = await get(ref(database, `games/${newGameId}`));
      if (snapshot.exists()) {
        const newGameData = snapshot.val();
        console.log('newGameData', newGameData);
        setCurrentMatch(newGameData);
        setGameId(newGameId);
        console.log('set current match to', newGameData);
      } else {
        console.error('NO GAME WITH THAT ID')
      }
    }
  };

  const updatePlayerFoundWords = async (playerUid: string, newWord: string) => {
    if (!currentMatch) {
      console.error("No currentMatch");
      return;
    }

    if (currentMatch.id) {
      const playerFoundWordsPath = `games/${currentMatch.id}/playerProgress/${playerUid}/foundWords`;
      try {
        const updates: Record<string, boolean> = {};
        updates[`${playerFoundWordsPath}/${newWord}`] = true;
        await update(ref(database), updates);
      } catch (error) {
        console.error("Error updating found words:", error);
        return;
      }
    } else {
      console.log('not updating DB');
      const nextCurrentMatch = { ...currentMatch };
      nextCurrentMatch.playerProgress[playerUid].foundWords[newWord] = true;
      console.log('setting next match', nextCurrentMatch);
      setCurrentMatch(nextCurrentMatch);
    }
  };

  const updatePlayerScore = async (playerUid: string, newValue: number) => {
    if (!currentMatch) {
      console.error("No currentMatch");
      return;
    }
    if (currentMatch.id) {
      const updates: Record<string, string | number> = {};
      const updatePath = `games/${currentMatch.id}/playerProgress/${playerUid}/score`;
      updates[updatePath] = newValue;
      await update(ref(database), updates);
    } else {
      const nextCurrentMatch = { ...currentMatch };
      nextCurrentMatch.playerProgress[playerUid].score = newValue;
      setCurrentMatch(nextCurrentMatch)
    }
  }

  const markChallengeAccepted = async (challegeId: string) => {
    if (challenges) {
      const updates: Record<string, boolean> = {};
      updates[`challenges/${challegeId}/accepted`] = true;
      await update(ref(database), updates);
      return;
    }
  }

  return (
    <FirebaseContext.Provider value={{
      challenges,
      currentMatch,
      playerList,
      joinNewGame,
      markChallengeAccepted,
      setCurrentMatch,
      startNewGame,
      revokeAllOutgoingChallenges,
      revokeOutgoingChallenge,
      setPlayerList,
      setGameId,
      updatePlayerFoundWords,
      updatePlayerScore,
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
