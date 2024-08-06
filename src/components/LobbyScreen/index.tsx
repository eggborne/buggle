import styles from './LobbyScreen.module.css'
import { useUser } from '../../context/UserContext'
import { useState, useRef, useEffect } from 'react';
import { database, fetchRandomPuzzle } from '../../scripts/firebase';
import { ref, push, update } from "firebase/database";
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
  const { challenges, playerList, markChallengeAccepted, revokeOutgoingChallenge, startNewGame } = useFirebase();
  const [pendingOutgoingChallenge, setPendingOutgoingChallenge] = useState<UserData | null>(null);

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
  }, []);

  useEffect(() => {
    let newSentChallenges = [...sentChallenges];
    if (challenges && sentChallenges.length > 0) {
      newSentChallenges = newSentChallenges.filter((challenge: ChallengeData) => challenge.id ? challenges[challenge.id] : null);
    }
    setSentChallenges(newSentChallenges);

  }, [challenges]);

  const sendChallenge = async () => {
    if (user && pendingOutgoingChallenge && difficultyInputRef.current && timeLimitInputRef.current) {
      if (sentChallenges.length > 0 && sentChallenges.some(c => c.respondent === pendingOutgoingChallenge.uid)) {
        // should never be able to occur as there is no button
        console.warn('already challenging');
        triggerShowMessage(`Already challenging ${pendingOutgoingChallenge.displayName}!`);
        return;
      }
      const challengesRef = ref(database, 'challenges/');
      const newChallenge: ChallengeData = {
        difficulty: difficultyInputRef.current.value,
        instigator: user.uid,
        respondent: pendingOutgoingChallenge.uid,
        timeLimit: parseInt(timeLimitInputRef.current.value),
        dimensions: {
          width: sizeSelected,
          height: sizeSelected
        },
        accepted: false,
      }
      const newChallengUid = await push(challengesRef, newChallenge).key;
      triggerShowMessage(`Challenge sent to ${pendingOutgoingChallenge.displayName}!`);
      setSentChallenges(prevSentChallenges => {
        const nextSentChallenges = [...prevSentChallenges];
        const newChallengeData = { ...newChallenge, id: newChallengUid };
        nextSentChallenges.push(newChallengeData);
        return nextSentChallenges;
      });
      await update(ref(database, `challenges/${newChallengUid}`), { id: newChallengUid });
      setPendingOutgoingChallenge(null);
    }
  };

  const handleClickChallengePlayer = (opponentData: UserData) => {
    setPendingOutgoingChallenge(opponentData);
  }

  const handleCancelChallengingPlayer = async (opponentUid: string) => {
    if (!challenges || !playerList) return;
    const idToRemove = Object.keys(challenges).find(key => challenges[key].instigator === user?.uid && challenges[key].respondent === opponentUid);
    idToRemove && revokeOutgoingChallenge(idToRemove);
    const opponentName = playerList.filter(p => p.uid === opponentUid)[0].displayName;
    triggerShowMessage(`Challenge to ${opponentName} cancelled!`);

    setSentChallenges(prevSentChallenges => {
      return prevSentChallenges.filter(challenge => challenge.id !== idToRemove);
    })
  };

  const handleDeclineChallenge = async (opponentUid: string) => {
    if (!challenges || !playerList || !user) return;
    const idToRemove = Object.keys(challenges).find(key => challenges[key].respondent === user.uid && challenges[key].instigator === opponentUid);
    idToRemove && revokeOutgoingChallenge(idToRemove);
    const opponentName = playerList.filter(p => p.uid === opponentUid)[0].displayName;
    triggerShowMessage(`Challenge from ${opponentName} declined!`);

    setSentChallenges(prevSentChallenges => {
      return prevSentChallenges.filter(challenge => challenge.id !== idToRemove);
    })
  };

  const handleAcceptChallenge = async (challenge: ChallengeData) => {
    if (!challenges || !playerList || !user) return;
    const { dimensions, difficulty, id: challengeId, instigator: instigatorId, respondent: respondentId, timeLimit } = challenge;
    const opponentName = playerList.filter(p => p.uid === instigatorId)[0].displayName;
    triggerShowMessage(`Challenge from ${opponentName} accepted!`);
    const randomPuzzle = await fetchRandomPuzzle({ dimensions, difficulty, timeLimit });
    if (challengeId) {
      const newGameData: CurrentGameData = {
        ...randomPuzzle,
        allWords: Array.from(randomPuzzle.allWords),
        endTime: 0,
        id: challengeId,
        instigator: {
          uid: instigatorId,
          score: 0,
          touchedCells: [],
          attackPoints: 0,
          foundOpponentWords: {},
        },
        playerProgress: {
          [instigatorId]: {
            attackPoints: 0,
            foundOpponentWords: {},
            uid: instigatorId,
            score: 0,
            touchedCells: [],      
          },
          [respondentId]: {
            attackPoints: 0,
            foundOpponentWords: {},
            uid: respondentId,
            score: 0,
            touchedCells: [],
          },
        },
        respondent: {
          attackPoints: 0,
          foundOpponentWords: {},
          uid: respondentId,
          score: 0,
          touchedCells: [],
        },
        startTime: 0,
      }
      console.group('---- starting game')
      await startNewGame(newGameData, challengeId); // including challengeId creates game in DB/games
      await markChallengeAccepted(challengeId)
      changePhase('game');
    }
  };

  const opponentList = playerList?.filter(player => {
    const isOpponent = player.uid !== user?.uid;
    return isOpponent;
  });

  const challengeList = challenges ? Object.values(challenges).filter(challenge => {
    const isChallengingUser = challenge.respondent === user?.uid;
    const instigatorExistsInPlayerList = playerList?.some(player => player.uid === challenge.instigator);
    return isChallengingUser && instigatorExistsInPlayerList;
  }) : null;

  const lobbyScreenClass = `${styles.LobbyScreen}${hidden ? ' hidden' : ''}`;
  return (
    <main ref={lobbyScreenRef} className={lobbyScreenClass}>
      <ChatWindow hidden={hidden} />
      <div className={styles.playerListArea}>
        <h2>Challenges</h2>
        <div className={styles.challengeList}>
          {challengeList && challengeList.length > 0 ?
            challengeList?.map(challenge => {
              const opponentData = playerList?.find(player => player.uid === challenge.instigator);
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
              const alreadyChallenged = sentChallenges.some(c => c.respondent === playerData.uid);
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
            <select ref={difficultyInputRef}>
              <option value='easy'>Easy</option>
              <option value='medium'>Medium</option>
              <option value='hard'>Hard</option>
            </select>
            <select ref={timeLimitInputRef}>
              <option value='60'>1 minute</option>
              <option value='180'>3 minutes</option>
              <option value='300'>5 minutes</option>
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