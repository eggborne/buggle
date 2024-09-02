import styles from './LobbyScreen.module.css'
import { useUser } from '../../context/UserContext'
import { useState, useRef, useEffect, useCallback } from 'react';
import { database, fetchPuzzleById } from '../../scripts/firebase';
import { ref, DataSnapshot, off, onValue } from "firebase/database";
import { ChallengeData, CurrentGameData, PendingOutgoingChallengeData, UserData } from '../../types/types';
import { useFirebase } from '../../context/FirebaseContext';
import { triggerShowMessage } from '../../hooks/useMessageBanner';
import ChallengeListItem from '../ChallengeListItem';
import ChatWindow from '../ChatWindow';
import { stringTo2DArray } from '../../scripts/util';
import ChallengeModal from '../ChallengeModal/ChallengeModal';

interface LobbyScreenProps {
  hidden: boolean;
}

function LobbyScreen({ hidden }: LobbyScreenProps) {
  const { user, sentChallenges, changePhase, setSentChallenges } = useUser();
  const { challenges, markChallengeAccepted, revokeOutgoingChallenge, startNewGame } = useFirebase();
  const [currentPlayerList, setCurrentPlayerList] = useState<UserData[]>([]);
  const [pendingOutgoingChallenge, setPendingOutgoingChallenge] = useState<PendingOutgoingChallengeData | null>(null);
  const [challengeList, setChallengeList] = useState<ChallengeData[]>([]);
  // const [sizeSelected, setSizeSelected] = useState<number>(5);
  const lobbyScreenRef = useRef<HTMLSelectElement>(null);
  const previousPlayerListRef = useRef<UserData[]>([]);


  const hasRelevantChanges = useCallback((prevList: UserData[], newList: UserData[]) => {
    if (prevList.length !== newList.length) return true;
    return false;
  }, []);

  useEffect(() => {
    requestAnimationFrame(() => {
      if (lobbyScreenRef.current) {
        lobbyScreenRef.current.classList.add(styles.showing);
      }
    });

    const playerListRef = ref(database, '/players');
    const handlePlayerList = (snapshot: DataSnapshot) => {
      const data: { [key: string]: UserData } = snapshot.val();
      const newPlayerList = Object.values(data || {});

      if (hasRelevantChanges(previousPlayerListRef.current, newPlayerList)) {
        console.warn('--- SETTING currentPlayerList', newPlayerList);
        setCurrentPlayerList(newPlayerList);
        previousPlayerListRef.current = newPlayerList;
      }
    };

    onValue(playerListRef, handlePlayerList);
    console.log(`players ----------> Context STARTED listener`);

    return () => {
      off(playerListRef, 'value', handlePlayerList);
      console.log('players <---------- Context STOPPED listener');
    };

  }, []);

  useEffect(() => {
    let newSentChallenges = [...sentChallenges];
    if (challenges) {
      // remove sentChallenges whiich are not in /challenges
      if (sentChallenges.length > 0) {
        newSentChallenges = newSentChallenges.filter((challenge: ChallengeData) => challenge.id ? challenges[challenge.id] : null);
      }
      // find challenges where respondent is user and player is in playerList
      const nextChallengeList = [];
      for (const challengeId in challenges) {
        const challenge = challenges[challengeId];
        const respondentIsUser = challenge.respondentUid === user?.uid;
        const instigatorExistsInPlayerList = currentPlayerList?.some(player => player.uid === challenge.instigatorUid);
        respondentIsUser && instigatorExistsInPlayerList && nextChallengeList.push(challenge);
      }
      setChallengeList(nextChallengeList)
    } else {
      // remove any sentChallenges (since none are actually existent in the DB)
      if (sentChallenges.length > 0) {
        newSentChallenges = [];
      }
    }
    setSentChallenges(newSentChallenges);

  }, [challenges, currentPlayerList.length]);

  const handleClickChallengePlayer = (opponentData: UserData) => {
    setPendingOutgoingChallenge({
      respondent: opponentData,
    });
  }

  const handleCancelChallengingPlayer = async (opponentUid: string) => {
    if (!challenges || !currentPlayerList) return;
    const idToRemove = Object.keys(challenges).find(key => challenges[key].instigatorUid === user?.uid && challenges[key].respondentUid === opponentUid);
    idToRemove && revokeOutgoingChallenge(idToRemove);
    const opponentName = currentPlayerList.filter(p => p.uid === opponentUid)[0].displayName;
    triggerShowMessage(`Challenge to ${opponentName} cancelled!`);

    setSentChallenges(prevSentChallenges => {
      return prevSentChallenges.filter(challenge => challenge.id !== idToRemove);
    })
  };

  const handleDeclineChallenge = async (opponentUid: string) => {
    if (!challenges || !currentPlayerList || !user) return;
    const idToRemove = Object.keys(challenges).find(key => challenges[key].respondentUid === user.uid && challenges[key].instigatorUid === opponentUid);
    idToRemove && revokeOutgoingChallenge(idToRemove);
    const opponentName = currentPlayerList.filter(p => p.uid === opponentUid)[0].displayName;
    triggerShowMessage(`Challenge from ${opponentName} declined!`);

    setSentChallenges(prevSentChallenges => {
      return prevSentChallenges.filter(challenge => challenge.id !== idToRemove);
    })
  };

  const handleAcceptChallenge = async (challenge: ChallengeData) => {
    if (!challenges || !currentPlayerList || !user) return;
    const { puzzleId, id: challengeId, instigatorUid, respondentUid, timeLimit, wordBonus } = challenge;
    const opponentName = currentPlayerList.filter(p => p.uid === instigatorUid)[0].displayName;
    triggerShowMessage(`Challenge from ${opponentName} accepted!`);
    const retrievedPuzzle = await fetchPuzzleById(puzzleId || '');
    if (challengeId && retrievedPuzzle) {
      if (retrievedPuzzle.allWords) {
        const letterMatrix = stringTo2DArray(retrievedPuzzle.letterString, retrievedPuzzle.dimensions.width, retrievedPuzzle.dimensions.height);
        const newGameData: CurrentGameData = {
          ...retrievedPuzzle,
          allWords: retrievedPuzzle.allWords,
          endTime: 0,
          gameOver: false,
          id: challengeId,
          letterMatrix,
          playerProgress: {
            [instigatorUid]: {
              attackPoints: 0,
              foundOpponentWords: {},
              uid: instigatorUid,
              score: 0,
              touchedCells: [],
            },
            [respondentUid]: {
              attackPoints: 0,
              foundOpponentWords: {},
              uid: respondentUid,
              score: 0,
              touchedCells: [],
            },
          },
          metadata: {
            averageWordLength: retrievedPuzzle.averageWordLength,
            dateCreated: retrievedPuzzle.dateCreated,
            commonWordAmount: retrievedPuzzle.commonWordAmount,
          },
          startTime: 0,
          timeLimit: timeLimit,
          wordBonus: wordBonus
        };
        await markChallengeAccepted(challengeId)
        console.log('---- accepted and creating/starting game', challengeId)
        await startNewGame(newGameData, challengeId); // including challengeId creates game in DB/games
        changePhase('game');
      }
    }
  };

  const opponentList = currentPlayerList?.filter(player => {
    const isOpponent = player.uid !== user?.uid;
    return isOpponent;
  });

  const lobbyScreenClass = `${styles.LobbyScreen}${hidden ? ' hidden' : ''}`;
  return (
    <main ref={lobbyScreenRef} className={lobbyScreenClass}>
      <ChatWindow hidden={hidden} />
      <div className={styles.playerListArea}>
        <h2>Challenges</h2>
        <div className={`${styles.challengeList} ${challengeList && (challengeList.length > 0) ? styles.showing : styles.hidden}`}>
          {challengeList?.map(challenge => {
            // find the instigator in /players
            const opponentData = currentPlayerList?.find(player => player.uid === challenge.instigatorUid);
            return (
              <ChallengeListItem
                challenge={challenge}
                opponentData={opponentData || null}
                handleDeclineChallenge={handleDeclineChallenge}
                handleAcceptChallenge={handleAcceptChallenge}
              />
            );
          })}
        </div>
      </div>
      <div className={styles.playerListArea}>
        <h2>Players</h2>
        <div className={styles.playerList}>
          <div
            className={styles.playerListItem}
            style={{
              backgroundColor: user?.preferences?.style?.gameBackgroundColor
            }}
          >
            <span><img className='profile-pic' src={user?.photoURL || undefined} /></span>
            <span>{user?.displayName} (you!)</span>
            <span>{user?.phase}</span>
            <div className='button-group row'>
              <button style={{ visibility: 'hidden' }} onClick={() => null}>Challenge</button>
            </div>
          </div>
          {opponentList &&
            opponentList.map(playerData => {
              const alreadyChallenged = sentChallenges.some(c => c.respondentUid === playerData.uid);
              return (<div
                key={playerData.uid}
                className={styles.playerListItem}
                style={{
                  backgroundColor: playerData.preferences?.style?.gameBackgroundColor,
                  outline: alreadyChallenged ? '0.1rem solid red' : 'none',
                }}
              >
                <span><img className='profile-pic' src={playerData.photoURL || undefined} /></span>
                <span>{playerData.displayName}</span>
                <span>{playerData.phase}</span>
                <div className='button-group row'>
                  {alreadyChallenged ?
                    <button onClick={() => handleCancelChallengingPlayer(playerData.uid)} className={'cancel'}>Cancel</button>
                    :
                    <button style={{ visibility: playerData.uid === user?.uid ? 'hidden' : 'visible' }} onClick={() => handleClickChallengePlayer(playerData)}>Challenge</button>
                  }
                </div>
                {alreadyChallenged && <div className={styles.challengingLabel}>CHALLENGING</div>}
              </div>)
            })}
        </div>
      </div>
      {pendingOutgoingChallenge && <ChallengeModal
        sentChallenges={sentChallenges}
        setSentChallenges={setSentChallenges}
        pendingOutgoingChallenge={pendingOutgoingChallenge}
        setPendingOutgoingChallenge={setPendingOutgoingChallenge}
      />}
    </main>
  )
}

export default LobbyScreen;