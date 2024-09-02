import { createContext, useEffect, useState, ReactNode, useContext, Dispatch, SetStateAction, useCallback } from 'react';
import { ref, onValue, remove, off, get, runTransaction, set, update, DataSnapshot, push, child } from 'firebase/database';
import { CellObj, ChallengeData, CurrentGameData, DefaultPowerupData, DeployedPowerupData, PointValues, StoredPuzzleData, UserData } from '../types/types';
import { database, firestore } from '../scripts/firebase';
import { useUser } from './UserContext';
import { pointValues } from '../config.json';
import { triggerShowMessage } from '../hooks/useMessageBanner';
import { doc, setDoc } from 'firebase/firestore';

interface FirebaseContextProps {
  playerList: UserData[] | null;
  challenges: Record<string, ChallengeData> | null;
  currentMatch: CurrentGameData | null;
  totalPlayers: number;
  activatePowerup: (powerup: DeployedPowerupData) => void;
  addAvailablePower: (playerId: string, powerup: DefaultPowerupData) => void;
  deactivatePowerup: (powerupId: string) => void;
  destroyGame: (gameId: string) => void;
  endGame: (gameId: string) => void;
  joinNewGame: (newGameId: string | null) => void;
  markChallengeAccepted: (challegeId: string) => void;
  pruneEndedGames: () => void;
  revokeAllOutgoingChallenges: (uid: string) => void;
  revokeOutgoingChallenge: (challengeId: string) => void;
  setCurrentMatch: Dispatch<SetStateAction<CurrentGameData | null>>;
  setGameId: (id: string | null) => void;
  setPlayerList: Dispatch<SetStateAction<UserData[] | null>>;
  setPlayerReady: (playerUid: string) => void;
  setPlayerTouchedCells: (playerUid: string, newValue: CellObj[]) => void;
  startNewGame: (newGameData: CurrentGameData, newGameId?: string) => void;
  submitWord: (playerUid: string, word: string, wordStatus?: string) => void;
  subscribeToFoundWords: (callback: (foundWordsRecord: Record<string, false | string>) => void) => (() => void);
  updatePlayerAttackPoints: (playerUid: string, newValue: number, word?: string) => void;
  updatePowerupTimeLeft: (powerupId: string, newValue: number) => void;
  uploadPuzzle: (puzzleData: StoredPuzzleData) => void;
}

const FirebaseContext = createContext<FirebaseContextProps | undefined>(undefined);

const FirebaseProvider = ({ children }: { children: ReactNode }) => {
  const [challenges, setChallenges] = useState<Record<string, ChallengeData> | null>(null);
  const [currentMatch, setCurrentMatch] = useState<CurrentGameData | null>(null);
  const [totalPlayers, setTotalPlayers] = useState<number>(0);
  const [playerList, setPlayerList] = useState<UserData[] | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const { isLoggedIn, user, setPuzzleSeen } = useUser();

  useEffect(() => {
    const playersRef = ref(database, 'players');
    const unsubscribe = onValue(playersRef, (snapshot) => {
      const playerData = snapshot.val();
      if (playerData) {
        setTotalPlayers(Object.keys(playerData).length); // Get the count of players
      } else {
        setTotalPlayers(0); // Handle the case where there are no players
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      const challengesRef = ref(database, '/challenges');
      const handleChallenges = (snapshot: DataSnapshot) => {
        const data: { [key: string]: ChallengeData } = snapshot.val();
        setChallenges(data || {});
      };
      onValue(challengesRef, handleChallenges);

      pruneEndedGames();

      return () => {
        off(challengesRef, 'value', handleChallenges);
        console.log('challenges <---------- Context STOPPED listener');
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
      console.log(`game ----------> Context STARTED listener`);
      return () => {
        unsubscribeGame();
        console.log('game <---------- Context STOPPED listener');
      };
    } else {
      setCurrentMatch(null);
    }
  }, [gameId]);

  const subscribeToFoundWords = (callback: (foundWordsRecord: Record<string, false | string>) => void) => {
    if (!currentMatch?.id) {
      console.warn('No current match ID available for subscription');
      return () => { };
    }

    const foundWordsRef = ref(database, `games/${currentMatch.id}/foundWordsRecord`);

    const handleFoundWords = (snapshot: DataSnapshot) => {
      const data: Record<string, false | string> = snapshot.val();
      if (data) {
        callback(data);
      }
    };

    onValue(foundWordsRef, handleFoundWords);
    console.log(`Found words ----------> Context STARTED listener for game ${currentMatch.id}`);

    return () => {
      off(foundWordsRef);
      console.log(`Found words <---------- Context STOPPED listener for game ${currentMatch.id}`);
    };
  };

  const revokeAllOutgoingChallenges = async (uid: string) => {
    if (challenges) {
      const challengesToRemove = Object.values(challenges).filter(challenge => challenge.instigatorUid === uid);
      challengesToRemove.forEach(async (challenge) => {
        const idToRemove = Object.keys(challenges).find(key => challenges[key].instigatorUid === uid && challenges[key].respondentUid === challenge.respondentUid);
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
    console.log('startNewGame got newGameData', newGameData)
    newGameData.startTime = Date.now();
    newGameData.endTime = Date.now() + ((newGameData.timeLimit || 10) * 1000);
    const foundWordsRecord: Record<string, string | false> = {};
    Array.from(newGameData.allWords).forEach(word => {
      foundWordsRecord[word] = false;
    })
    newGameData.foundWordsRecord = foundWordsRecord;
    if (newGameId) {
      await set(ref(database, `games/${newGameId}`), newGameData);
      setGameId(newGameId); // subscribes to listener
    }
    setCurrentMatch(newGameData);
    if (isLoggedIn && user && user.uid) {
      setPuzzleSeen(newGameData, user.uid)
    }
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

  const setPlayerReady = async (playerUid: string) => {
    if (!gameId) return;
    const updates: Record<string, boolean> = {};
    updates[`games/${gameId}/playerProgress/${playerUid}/ready`] = true;
    await update(ref(database), updates);
  }

  const destroyGame = async (gameId: string) => {
    if (currentMatch && currentMatch.id) {
      await remove(ref(database, `games/${gameId}`));
      // await set(ref(database, `games/${gameId}`), null);
    }
    setCurrentMatch(null);
    setGameId(null);
  }

  const submitWord = async (playerId: string, word: string, wordStatus = 'valid') => {
    console.log(`submitting ${wordStatus} word ${word}`)
    if (!currentMatch) return;
    if (!currentMatch.id) {
      const nextCurrentMatch = { ...currentMatch };
      if (nextCurrentMatch.foundWordsRecord) {
        nextCurrentMatch.foundWordsRecord[word] = playerId;
        setCurrentMatch(nextCurrentMatch);
        submitWordForPoints(playerId, word, wordStatus);
      }
      return;
    } else {
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
  }

  const submitWordForPoints = async (playerId: string, word: string, wordStatus = 'valid') => {
    let wordValue;
    const values = pointValues as PointValues;
    if (word.length >= 8) {
      wordValue = values[8];
    } else {
      wordValue = values[word.length];
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

  const updatePlayerAttackPoints = async (playerUid: string, newValue: number, word?: string) => {
    if (!currentMatch) {
      console.error("No currentMatch");
      return;
    }
    if (currentMatch.id) {
      const updates: Record<string, string | number> = {};
      const updatePath = `games/${currentMatch.id}/playerProgress/${playerUid}/attackPoints`;
      updates[updatePath] = newValue;
      if (word) {
        const foundWordPath = `games/${currentMatch.id}/playerProgress/${playerUid}/foundOpponentWords/${word}`;
        updates[foundWordPath] = 'true';
      }
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

  const addAvailablePower = async (playerId: string, powerup: DefaultPowerupData) => {
    if (!currentMatch) return;
    if (currentMatch.id) {
      const path = `games/${currentMatch.id}/playerProgress/${playerId}/availablePowers`;
      const availablePowersRef = ref(database, path);
      const newPowerId = await push(availablePowersRef, powerup).key;
      update(ref(database, `${path}/${newPowerId}`), { id: newPowerId });
    }
  };

  const activatePowerup = async (powerup: DeployedPowerupData) => {
    if (!currentMatch) return;
    if (currentMatch.id) {
      triggerShowMessage(`Sending ${powerup.type.toUpperCase()}!`);
      const path = `games/${currentMatch.id}/activePowerups`;
      set(ref(database, `${path}/${powerup.id}`), powerup);

      const availablePowerPath = `games/${currentMatch.id}/playerProgress/${powerup.activatedBy}/availablePowers`;
      remove(ref(database, `${availablePowerPath}/${powerup.id}`));
    }
  };

  const updatePowerupTimeLeft = async (powerupId: string, newValue: number) => {
    if (!currentMatch) return;
    if (currentMatch.id) {
      const path = `games/${currentMatch.id}/activePowerups/${powerupId}`;
      update(ref(database, path), { timeLeft: newValue });
    }
  };

  const deactivatePowerup = useCallback(async (powerupId: string) => {
    if (!currentMatch) return;
    if (currentMatch.id) {
      const path = `games/${currentMatch.id}/activePowerups`;
      remove(ref(database, `${path}/${powerupId}`));
    }
  }, [currentMatch]);


  const markChallengeAccepted = async (challegeId: string) => {
    if (challenges) {
      const updates: Record<string, boolean> = {};
      updates[`challenges/${challegeId}/accepted`] = true;
      await update(ref(database), updates);
      return;
    }
  }

  const endGame = async (gameId: string) => {
    if (currentMatch) {
      if (gameId) {
        const updates: Record<string, boolean> = {};
        updates[`games/${gameId}/gameOver`] = true;
        await update(ref(database), updates);
      } else {
        console.log('single player game over ----------------------------------------')
        setCurrentMatch(prevCurrentMatch => {
          if (!prevCurrentMatch) return currentMatch;
          const nextCurrentMatch = { ...prevCurrentMatch };
          nextCurrentMatch.gameOver = true;
          return nextCurrentMatch;
        })
      }
    }
  };

  const uploadPuzzle = async (nextPuzzleData: StoredPuzzleData) => {
    if (!nextPuzzleData) return;
    console.log('uploading', nextPuzzleData);
    const newPuzzleId = `${nextPuzzleData.dimensions.width}${nextPuzzleData.dimensions.height}${nextPuzzleData.letterString}`;
    const puzzleRef = doc(firestore, `puzzles_${nextPuzzleData.dimensions.width}`, newPuzzleId);
    await setDoc(puzzleRef, nextPuzzleData);
    console.warn('Puzzle uploaded!');
  };

  const pruneEndedGames = async () => {
    const snapshot = await get(child(ref(database), 'games'));
    const games = snapshot.val();

    if (games) {
      Object.keys(games).forEach(async (gId) => {
        const game = games[gId];
        const ageLimit = Date.now() - 86400000;
        if (game.gameOver === true || (game.startTime < ageLimit)) {
          remove(ref(database, `games/${gId}`));
          console.log(`Removed ended/expired game: ${gId}`);
        }
      });
    }
  };

  return (
    <FirebaseContext.Provider value={{
      challenges,
      currentMatch,
      playerList,
      totalPlayers,
      activatePowerup,
      addAvailablePower,
      deactivatePowerup,
      destroyGame,
      endGame,
      joinNewGame,
      markChallengeAccepted,
      pruneEndedGames,
      revokeAllOutgoingChallenges,
      revokeOutgoingChallenge,
      setCurrentMatch,
      setPlayerList,
      setPlayerReady,
      setPlayerTouchedCells,
      setGameId,
      startNewGame,
      submitWord,
      subscribeToFoundWords,
      updatePlayerAttackPoints,
      updatePowerupTimeLeft,
      uploadPuzzle,
    }}>
      {children}
    </FirebaseContext.Provider>
  );
};

const useFirebase = (): FirebaseContextProps => {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};

export { FirebaseProvider, useFirebase }
