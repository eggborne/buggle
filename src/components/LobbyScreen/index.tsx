import styles from './LobbyScreen.module.css'
import { useUser } from '../../context/UserContext'
import { useState, useRef, useEffect } from 'react';
import { database, fetchRandomPuzzle } from '../../scripts/firebase';
import { ref, push, update, DataSnapshot, off, onValue } from "firebase/database";
import Modal from '../../components/Modal';
import PuzzleIcon from '../../components/PuzzleIcon';
import { ChallengeData, CurrentGameData, UserData } from '../../types/types';
import { useFirebase } from '../../context/FirebaseContext';
import { triggerShowMessage } from '../../hooks/useMessageBanner';
import ChallengeListItem from '../ChallengeListItem';
import ChatWindow from '../ChatWindow';

interface LobbyScreenProps {
  hidden: boolean;
}

function LobbyScreen({ hidden }: LobbyScreenProps) {
  const { user, sentChallenges, changePhase, setSentChallenges } = useUser();
  const { challenges, markChallengeAccepted, revokeOutgoingChallenge, startNewGame } = useFirebase();
  const [currentPlayerList, setCurrentPlayerList] = useState<UserData[]>([]);
  const [pendingOutgoingChallenge, setPendingOutgoingChallenge] = useState<UserData | null>(null);
  const [challengeList, setChallengeList] = useState<ChallengeData[]>([]);

  const [sizeSelected, setSizeSelected] = useState<number>(5);
  const difficultyInputRef = useRef<HTMLSelectElement>(null);
  const timeLimitInputRef = useRef<HTMLSelectElement>(null);
  const lobbyScreenRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    requestAnimationFrame(() => {
      if (lobbyScreenRef.current) {
        lobbyScreenRef.current.classList.add(styles.showing);
      }
    });

    console.log(`challenges ----------> Context STARTED listener`);
    
    const playerListRef = ref(database, '/players');
    const handlePlayerList = (snapshot: DataSnapshot) => {
      const data: { [key: string]: UserData } = snapshot.val();
      setCurrentPlayerList(Object.values(data || {}));
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
      if (sentChallenges.length > 0) {
        newSentChallenges = newSentChallenges.filter((challenge: ChallengeData) => challenge.id ? challenges[challenge.id] : null);
      }
      const nextChallengeList = Object.values(challenges).filter(challenge => {
        const respondentIsUser = challenge.respondentUid === user?.uid;
        const instigatorExistsInPlayerList = currentPlayerList?.some(player => player.uid === challenge.instigatorUid);
        return respondentIsUser && instigatorExistsInPlayerList;
      });
      setChallengeList(nextChallengeList)
    } else {
      if (sentChallenges.length > 0) {
        newSentChallenges = [];
      }
      console.warn('no challenges at LobbyScreen')
    }
    setSentChallenges(newSentChallenges);

  }, [challenges]);

  const sendChallenge = async () => {
    if (user && pendingOutgoingChallenge && difficultyInputRef.current && timeLimitInputRef.current) {
      if (sentChallenges.length > 0 && sentChallenges.some(c => c.respondentUid === pendingOutgoingChallenge.uid)) {
        // should never be able to occur as there is no button
        console.warn('already challenging');
        triggerShowMessage(`Already challenging ${pendingOutgoingChallenge.displayName}!`);
        return;
      }
      const challengesRef = ref(database, 'challenges/');
      const newChallenge: ChallengeData = {
        accepted: false,
        difficulty: difficultyInputRef.current.value,
        instigatorUid: user.uid,
        respondentUid: pendingOutgoingChallenge.uid,
        timeLimit: Number(timeLimitInputRef.current.value),
        dimensions: {
          width: sizeSelected,
          height: sizeSelected
        },
      }
      const newChallengeUid = await push(challengesRef, newChallenge).key;
      if (newChallengeUid) {
        triggerShowMessage(`Challenge sent to ${pendingOutgoingChallenge.displayName}!`);
        setSentChallenges(prevSentChallenges => {
          const nextSentChallenges = [...prevSentChallenges];
          const newChallengeData = { ...newChallenge, id: newChallengeUid };
          nextSentChallenges.push(newChallengeData);
          return nextSentChallenges;
        });
        await update(ref(database, `challenges/${newChallengeUid}`), { id: newChallengeUid });
        setPendingOutgoingChallenge(null);
      }
    }
  };

  const handleClickChallengePlayer = (opponentData: UserData) => {
    setPendingOutgoingChallenge(opponentData);
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
    const { dimensions, difficulty, id: challengeId, instigatorUid, respondentUid, timeLimit } = challenge;
    const opponentName = currentPlayerList.filter(p => p.uid === instigatorUid)[0].displayName;
    triggerShowMessage(`Challenge from ${opponentName} accepted!`);
    const randomPuzzle = await fetchRandomPuzzle({dimensions, difficulty, timeLimit});
    if (challengeId) {
      const newGameData: CurrentGameData = {
        ...randomPuzzle,
        allWords: Array.from(randomPuzzle.allWords),
        endTime: 0,
        gameOver: false,
        id: challengeId,
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
        startTime: 0,
        timeLimit: challenge.timeLimit
      };
      await markChallengeAccepted(challengeId)
      console.group('---- starting game', challengeId)
      await startNewGame(newGameData, challengeId); // including challengeId creates game in DB/games
      changePhase('game');
    }
  };

  const opponentList = currentPlayerList?.filter(player => {
    const isOpponent = player.uid !== user?.uid;
    return isOpponent;
  });

  // const challengeList = challenges ? Object.values(challenges).filter(challenge => {
  //   const respondentIsUser = challenge.respondentUid === user?.uid;
  //   const instigatorExistsInPlayerList = currentPlayerList?.some(player => player.uid === challenge.instigatorUid);
  //   return respondentIsUser && instigatorExistsInPlayerList;
  // }) : null;

  const lobbyScreenClass = `${styles.LobbyScreen}${hidden ? ' hidden' : ''}`;
  return (
    <main ref={lobbyScreenRef} className={lobbyScreenClass}>
      <ChatWindow hidden={hidden} />
      <div className={styles.playerListArea}>
        <h2>Challenges</h2>
        <div className={styles.challengeList}>
          {challengeList && challengeList.length > 0 ?
            challengeList?.map(challenge => {
              const opponentData = currentPlayerList?.find(player => player.uid === challenge.instigatorUid);
              return (
                <ChallengeListItem
                  challenge={challenge}
                  opponentData={opponentData || null}
                  handleDeclineChallenge={handleDeclineChallenge}
                  handleAcceptChallenge={handleAcceptChallenge}
                />
              );
            }) : <div style={{ textAlign: 'center' }}>{`No challenges :(`}</div>}
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
      <Modal isOpen={pendingOutgoingChallenge !== null} noCloseButton
        style={{
          height: 'auto',
          minHeight: '100vmin',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '2rem',
          padding: '2.5rem',
        }}
      >
        <h3>Challenging {pendingOutgoingChallenge?.displayName}</h3>
        <div className={styles.puzzleOptions}>
          <div className={styles.sizeSelections}>
            <span style={{ borderColor: sizeSelected === 4 ? '#8f8' : 'transparent' }} onClick={() => setSizeSelected(4)}><PuzzleIcon iconSize={{
              width: `4.5rem`,
              height: `4.5rem`
            }} puzzleDimensions={{ width: 4, height: 4 }} contents={[]} /></span>
            <span style={{ borderColor: sizeSelected === 5 ? '#8f8' : 'transparent' }} onClick={() => setSizeSelected(5)}><PuzzleIcon iconSize={{
              width: `4.5rem`,
              height: `4.5rem`
            }} puzzleDimensions={{ width: 5, height: 5 }} contents={[]} /></span>
            <span style={{ borderColor: sizeSelected === 6 ? '#8f8' : 'transparent' }} onClick={() => setSizeSelected(6)}><PuzzleIcon iconSize={{
              width: `4.5rem`,
              height: `4.5rem`
            }} puzzleDimensions={{ width: 6, height: 6 }} contents={[]} /></span>
          </div>
          <div className='button-group row'>
            <select defaultValue='easy' ref={difficultyInputRef}>
              <option value='easy'>Easy</option>
              <option value='medium'>Medium</option>
              <option value='hard'>Hard</option>
            </select>
            <select defaultValue='30' ref={timeLimitInputRef}>
              <option value='5'>5 seconds</option>
              <option value='10'>10 seconds</option>
              <option value='30'>30 seconds</option>
              <option value='120'>2 minutes</option>
            </select>
          </div>
        </div>
        <div className='button-group'>
          <button onClick={sendChallenge} className={'start'}>Send Challenge</button>
          <button onClick={() => setPendingOutgoingChallenge(null)} className={'cancel'}>Cancel</button>
        </div>
      </Modal>
    </main>
  )
}

export default LobbyScreen;