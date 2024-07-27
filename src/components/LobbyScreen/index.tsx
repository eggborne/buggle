import styles from './LobbyScreen.module.css'
import { useUser } from '../../context/UserContext'
import { useState, useRef, useEffect } from 'react';
import { database } from '../../scripts/firebase';
import { ref, onValue, push, off, remove } from "firebase/database";
import Modal from '../../components/Modal';
import PuzzleIcon from '../../components/PuzzleIcon';
import { ChallengeData, ChatMessageData, LobbyData, UserData } from '../../types/types';
import { useFirebase } from '../../context/FirebaseContext';

interface LobbyScreenProps {
  hidden: boolean;
}

function LobbyScreen({ hidden }: LobbyScreenProps) {
  const { user } = useUser();
  const { challenges, playerList } = useFirebase();
  const [chatMessages, setChatMessages] = useState<ChatMessageData[]>([]);
  const [pendingOutgoingChallenge, setPendingOutgoingChallenge] = useState<UserData | null>(null);
  const [sentChallenges, setSentChallenges] = useState<ChallengeData[]>([]);
  // const [receivedChallenges, setReceivedChallenges] = useState<ChallengeData[]>([]);
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  const [sizeSelected, setSizeSelected] = useState<number>(5);
  const difficultyInputRef = useRef<HTMLSelectElement>(null);
  const timeLimitInputRef = useRef<HTMLSelectElement>(null);
  const lobbyScreenRef = useRef<HTMLSelectElement>(null);

  const handleClickChallengePlayer = (opponentData: UserData) => {
    setPendingOutgoingChallenge(opponentData);
  }

  const handleCancelChallengingPlayer = async (opponentUid: string) => {
    if (!challenges) return;
    const idToRemove = Object.keys(challenges).find(key => challenges[key].instigator === user?.uid && challenges[key].respondent === opponentUid);
    await remove(ref(database, `challenges/${idToRemove}`));
    setSentChallenges(prevSentChallenges => {
      return prevSentChallenges.filter(challenge => challenge.uid !== idToRemove);
    })
  }

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
      }
      const newChallengUid = await push(challengesRef, newChallenge).key;
      console.log('new c', newChallengUid);
      setSentChallenges(prevSentChallenges => {
        const nextSentChallenges = [...prevSentChallenges];
        const newChallengeData = { ...newChallenge, uid: newChallengUid };
        nextSentChallenges.push(newChallengeData);
        return nextSentChallenges;
      });
      setPendingOutgoingChallenge(null);
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
                  backgroundColor: authorData ? authorData.preferences?.gameBackgroundColor : 'transparent'
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
                    backgroundColor: opponentData?.preferences?.gameBackgroundColor
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
                    <button className={`cancel ${styles.declineButton}`} onClick={() => null}>Decline</button>
                    <button className={`start ${styles.acceptButton}`} onClick={() => null}>Accept</button>
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
              backgroundColor: user?.preferences?.gameBackgroundColor
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
                  backgroundColor: playerData.preferences?.gameBackgroundColor,
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