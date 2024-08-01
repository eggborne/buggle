import styles from './LobbyScreen.module.css'
import { useUser } from '../../context/UserContext'
import { useState, useRef, useEffect } from 'react';
import { database, fetchRandomPuzzle } from '../../scripts/firebase';
import { ref, onValue, push, off, remove, update } from "firebase/database";
import Modal from '../../components/Modal';
import PuzzleIcon from '../../components/PuzzleIcon';
import { ChallengeData, ChatMessageData, CurrentGameData, LobbyData, UserData } from '../../types/types';
import { useFirebase } from '../../context/FirebaseContext';
import { triggerShowMessage } from '../../hooks/useMessageBanner';

interface LobbyScreenProps {
  hidden: boolean;
}

function LobbyScreen({ hidden }: LobbyScreenProps) {
  const { user, changePhase } = useUser();
  const { challenges, playerList, startNewGame, setGameId } = useFirebase();
  const [chatMessages, setChatMessages] = useState<ChatMessageData[]>([]);
  const [pendingOutgoingChallenge, setPendingOutgoingChallenge] = useState<UserData | null>(null);
  const [sentChallenges, setSentChallenges] = useState<ChallengeData[]>([]);
  // const [receivedChallenges, setReceivedChallenges] = useState<ChallengeData[]>([]);
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  const [sizeSelected, setSizeSelected] = useState<number>(5);
  const difficultyInputRef = useRef<HTMLSelectElement>(null);
  const timeLimitInputRef = useRef<HTMLSelectElement>(null);
  const lobbyScreenRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    const lobbyRef = ref(database, 'lobby/messages/');
    const messageListener = onValue(lobbyRef, (snapshot) => {
      const data: LobbyData = snapshot.val();
      const messagesArray = Object.values(data).slice(-10).reverse();
      setChatMessages(messagesArray);
    });
    console.log(`----------------> STARTED LobbyScreen /messages listener`);

    requestAnimationFrame(() => {
      if (lobbyScreenRef.current) {
        lobbyScreenRef.current.classList.add(styles.showing);
      }
    });

    return () => {
      off(lobbyRef, 'value', messageListener);
      console.log(`<---------------- STOPPED LobbyScreen /messages listener`)
    };
  }, []);

  useEffect(() => {
    let newSentChallenges = [...sentChallenges];
    if (challenges && sentChallenges.length > 0) {
      console.log('chal', challenges)
      console.log('sentChal', sentChallenges)
      newSentChallenges = newSentChallenges.filter((challenge: ChallengeData) => challenges[challenge.id || '']);
      console.log('newSentChal', newSentChallenges)
    }
    setSentChallenges(newSentChallenges);

  }, [challenges])

  const handleSubmitChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const form = e.target as HTMLFormElement;
    const messageInput = form.querySelector('input[name="chatMessage"]') as HTMLInputElement;
    const trimmedMessage = messageInput.value.trim();
    if (!trimmedMessage) return;
    const newMessage: ChatMessageData = {
      author: user,
      message: messageInput.value,
      date: Date.now(),
    };
    const lobbyRef = ref(database, 'lobby/messages/');
    await push(lobbyRef, newMessage);
    messageInput.value = '';
  };

  const sendChallenge = async () => {
    if (user && pendingOutgoingChallenge && difficultyInputRef.current && timeLimitInputRef.current) {
      console.warn(sentChallenges)
      if (sentChallenges.length > 0 && sentChallenges.some(c => c.respondent === pendingOutgoingChallenge.uid)) {
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
      console.log('new c', newChallengUid);
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
    await remove(ref(database, `challenges/${idToRemove}`));
    const opponentName = playerList.filter(p => p.uid === opponentUid)[0].displayName;
    triggerShowMessage(`Challenge to ${opponentName} cancelled!`);

    setSentChallenges(prevSentChallenges => {
      return prevSentChallenges.filter(challenge => challenge.id !== idToRemove);
    })
  };

  const handleDeclineChallenge = async (opponentUid: string) => {
    if (!challenges || !playerList || !user) return;
    const idToRemove = Object.keys(challenges).find(key => challenges[key].respondent === user.uid && challenges[key].instigator === opponentUid);
    await remove(ref(database, `challenges/${idToRemove}`));
    const opponentName = playerList.filter(p => p.uid === opponentUid)[0].displayName;
    triggerShowMessage(`Challenge from ${opponentName} declined!`);

    setSentChallenges(prevSentChallenges => {
      return prevSentChallenges.filter(challenge => challenge.id !== idToRemove);
    })
  };

  const handleAcceptChallenge = async (challenge: ChallengeData) => {
    if (!challenges || !playerList || !user) return;
    const { dimensions, difficulty, id: challengeId, instigator: instigatorId, respondent: respondentId, timeLimit } = challenge;
    console.log('idToRemove', challengeId);
    await remove(ref(database, `challenges/${challengeId}`));
    const opponentName = playerList.filter(p => p.uid === instigatorId)[0].displayName;
    triggerShowMessage(`Challenge from ${opponentName} accepted!`);
    const randomPuzzle = await fetchRandomPuzzle({ dimensions, difficulty, timeLimit });
    console.log('testPuzzle', randomPuzzle);
    if (challengeId) {
      const newGameData: CurrentGameData = {
        ...randomPuzzle,
        allWords: Array.from(randomPuzzle.allWords),
        endTime: 0,
        id: challengeId,
        instigator: {
          uid: instigatorId,
          score: 0,
          foundWords: [],
        },
        playerProgress: {
          [instigatorId]: {
            uid: instigatorId,
            score: 0,
            foundWords: [],
          },
          [respondentId]: {
            uid: respondentId,
            score: 0,
            foundWords: [],
          },
        },
        respondent: {
          uid: respondentId,
          score: 0,
          foundWords: [],
        },
        startTime: 0,
      }
      await startNewGame(newGameData, challengeId); // including challengeId creates game in DB/games
      setSentChallenges(prevSentChallenges => {
        return prevSentChallenges.filter(challenge => challenge.id !== challengeId);
      });
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
      <div className={styles.chatWindow}>
        <div ref={chatMessagesRef} className={styles.chatMessages}>
          {chatMessages.map(({ author, message, date }) => {
            const selfIsAuthor = author.uid === user?.uid;
            let messageClass = styles.chatMessage;
            if (selfIsAuthor) messageClass += ' ' + styles.self;
            const authorData = author;
            return (
              <div
                key={date}
                className={messageClass}
                style={{
                  backgroundColor: authorData ? authorData.preferences?.style?.gameBackgroundColor : 'transparent'
                }}
              >
                <img className='profile-pic' src={authorData.photoURL || undefined} />
                <div className={styles.chatBody}><span className={styles.chatAuthorLabel}>{authorData.displayName}</span>: {message}</div>
                {/* <div className={styles.chatTimestamp}>{new Date(date).toLocaleString()}</div> */}
              </div>)
          })}
        </div>
        <form onSubmit={handleSubmitChatMessage}>
          <div className={styles.chatInputArea}>
            <input name='chatMessage' type='text' placeholder='Type your message...'></input>
            <button type='submit'>Send</button>
          </div>
        </form>
      </div>

      <div className={styles.playerListArea}>
        <h2>Challenges</h2>
        <div className={styles.challengeList}>
          {challengeList && challengeList.length > 0 ?
            challengeList?.map(challenge => {
              const opponentData = playerList?.find(player => player.uid === challenge.instigator);
              return (
                <div
                  key={challenge.instigator}
                  className={styles.challengeListItem}
                  style={{
                    backgroundColor: opponentData?.preferences?.style?.gameBackgroundColor
                  }}
                >
                  <span><img className='profile-pic' src={opponentData?.photoURL || undefined} /></span>
                  <span>{opponentData?.displayName}</span>
                  <div className={styles.difficultyLabel}>
                    <span>{`${challenge.timeLimit / 60}:00`}</span>
                    <span>{challenge.difficulty}</span>
                  </div>
                  <span><PuzzleIcon puzzleDimensions={challenge?.dimensions} contents={[]} iconSize={{ width: '4rem', height: '4rem' }} /></span>
                  <div className={`button-group row ${styles.challengeButtons}`}>
                    <button className={`cancel ${styles.declineButton}`} onClick={() => handleDeclineChallenge(challenge.instigator)}>Decline</button>
                    <button className={`start ${styles.acceptButton}`} onClick={() => handleAcceptChallenge(challenge)}>Accept</button>
                  </div>
                </div>
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