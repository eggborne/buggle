import { createContext, useEffect, useState, ReactNode, useContext, Dispatch, SetStateAction } from 'react';
import { ref, onValue, remove, off, get, runTransaction, set, update, DataSnapshot } from 'firebase/database';
import { CellObj, ChallengeData, CurrentGameData, UserData } from '../types/types';
import { database } from '../scripts/firebase';
import { useUser } from './UserContext';
import { pointValues } from '../App';

interface FirebaseContextProps {
  playerList: UserData[] | null;
  challenges: Record<string, ChallengeData> | null;
  currentMatch: CurrentGameData | null;
  destroyGame: (gameId: string) => void;
  endGame: (gameId: string) => void;
  joinNewGame: (newGameId: string | null) => void;
  markChallengeAccepted: (challegeId: string) => void;
  setCurrentMatch: Dispatch<SetStateAction<CurrentGameData | null>>;
  startNewGame: (newGameData: CurrentGameData, newGameId?: string) => void;
  revokeAllOutgoingChallenges: (uid: string) => void;
  revokeOutgoingChallenge: (challengeId: string) => void;
  setGameId: (id: string | null) => void;
  setPlayerList: Dispatch<SetStateAction<UserData[] | null>>;
  setPlayerTouchedCells: (playerUid: string, newValue: CellObj[]) => void;
  submitWord: (playerUid: string, word: string, wordStatus?: string) => void;
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
    newGameData.startTime = Date.now();
    newGameData.endTime = Date.now() + ((newGameData.timeLimit || 180) * 1000);
    let foundWordsRecord: Record<string, string | boolean> = {};
    Array.from(newGameData.allWords).forEach(word => {
      foundWordsRecord[word] = false;
    })
    newGameData.foundWordsRecord = foundWordsRecord;
    if (newGameId) {
      await set(ref(database, `games/${newGameId}`), newGameData);
      setGameId(newGameId); // subscribes to listener
    }
    setCurrentMatch(newGameData);
  };

  const joinNewGame = async (newGameId: string | null = null) => {
    if (newGameId) {
      const snapshot = await get(ref(database, `games/${newGameId}`));
      if (snapshot.exists()) {
        const newGameData = snapshot.val();
        setCurrentMatch(newGameData);
        setGameId(newGameId); // subscribes to listener
      } else {
        console.error('NO GAME WITH THAT ID')
      }
    }
  };

  const destroyGame = async (gameId: string) => {
    if (currentMatch && currentMatch.id) {
      await remove(ref(database, `games/${gameId}`));
    }
    setCurrentMatch(null);
    setGameId(null);
  }

  const submitWord = async (playerId: string, word: string, wordStatus = 'valid') => {
    console.log(`submitting ${wordStatus} word ${word}`)
    if (!currentMatch) return;
    if (!gameId) {
      const nextCurrentMatch = { ...currentMatch };
      if (nextCurrentMatch.foundWordsRecord) {
        nextCurrentMatch.foundWordsRecord[word] = playerId;
        setCurrentMatch(nextCurrentMatch);
        submitWordForPoints(playerId, word, wordStatus);
      }
      return;
    }
    if (wordStatus === 'valid' || wordStatus === 'special') {
      const wordRef = ref(database, `/games/${currentMatch.id}/foundWordsRecord/${word}`);
      const claimedSuccessfully = await runTransaction(wordRef, (currentData) => {
        if (!currentData) {
          return playerId;
        } else {
          return;
        }
      });
      if (claimedSuccessfully.committed) {
        submitWordForPoints(playerId, word, wordStatus);
      }
    } else if (gameId && wordStatus === 'redeemable') {
      submitWordForPoints(playerId, word, wordStatus);
    }
  }

  const submitWordForPoints = async (playerId: string, word: string, wordStatus = 'valid') => {
    let wordValue;
    if (word.length >= 8) {
      wordValue = pointValues[8];
    } else {
      wordValue = pointValues[word.length];
    }
    if (wordStatus === 'special') {
      wordValue *= 2;
    }
    if (wordStatus === 'valid' || wordStatus === 'special') {
      const nextScore = (currentMatch?.playerProgress[playerId].score || 0) + wordValue;
      updatePlayerScore(playerId, nextScore);
    } else if (wordStatus === 'redeemable') {
      const nextAttackPoints = (currentMatch?.playerProgress[playerId].attackPoints || 0) + wordValue;
      updatePlayerAttackPoints(playerId, nextAttackPoints, word);
    }
  }

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
      setCurrentMatch(nextCurrentMatch);
    }
  }

  const updatePlayerAttackPoints = async (playerUid: string, newValue: number, word: string) => {
    if (!currentMatch) {
      console.error("No currentMatch");
      return;
    }
    if (currentMatch.id) {
      const updates: Record<string, string | number> = {};
      const updatePath = `games/${currentMatch.id}/playerProgress/${playerUid}/attackPoints`;
      const foundWordPath = `games/${currentMatch.id}/playerProgress/${playerUid}/foundOpponentWords/${word}`;
      updates[updatePath] = newValue;
      updates[foundWordPath] = 'true';
      await update(ref(database), updates);
    } else {
      const nextCurrentMatch = { ...currentMatch };
      nextCurrentMatch.playerProgress[playerUid].attackPoints = newValue;
      setCurrentMatch(nextCurrentMatch);
    }
  }

  const setPlayerTouchedCells = async (playerId: string, newValue: CellObj[]) => {
    if (!currentMatch) return;
    if (currentMatch.id) {
      await set(ref(database, `games/${currentMatch.id}/playerProgress/${playerId}/touchedCells`), newValue);
    }
  };

  const markChallengeAccepted = async (challegeId: string) => {
    if (challenges) {
      const updates: Record<string, boolean> = {};
      updates[`challenges/${challegeId}/accepted`] = true;
      await update(ref(database), updates);
      return;
    }
  }

  const endGame = async (gameId: string) => {
    if (currentMatch && currentMatch.id === gameId) {
      const updates: Record<string, any> = {};
      updates[`games/${gameId}/gameOver`] = true;
      await update(ref(database), updates);
    }
  };

  return (
    <FirebaseContext.Provider value={{
      challenges,
      currentMatch,
      playerList,
      destroyGame,
      endGame,
      joinNewGame,
      markChallengeAccepted,
      setCurrentMatch,
      startNewGame,
      revokeAllOutgoingChallenges,
      revokeOutgoingChallenge,
      setPlayerList,
      setPlayerTouchedCells,
      setGameId,
      submitWord,
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
