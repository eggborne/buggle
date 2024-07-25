import styles from './LobbyScreen.module.css'
import { useUser } from '../../context/UserContext'
import { useState, useRef, useEffect } from 'react';
import { database } from '../../scripts/firebase';
import { ref, onValue, push, off } from "firebase/database";

interface LobbyScreenProps {
  hidden: boolean;
}

interface ChatMessageData {
  author: string | null;
  message: string;
  date: number;
}

interface LobbyData {
  messages: ChatMessageData[];
}

function LobbyScreen({ hidden }: LobbyScreenProps) {
  const { user } = useUser();
  const [chatMessages, setChatMessages] = useState<ChatMessageData[]>([]);
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const lobbyRef = ref(database, 'lobby/');
    const lobbyListener = onValue(lobbyRef, (snapshot) => {
      const data: LobbyData = snapshot.val();
      const messagesArray = Object.values(data.messages).slice(-10).reverse();
      setChatMessages(messagesArray);
    });
    console.warn(`STARTED lobby listener at ${lobbyRef}`)
    return () => {
      off(lobbyRef, 'value', lobbyListener);
      console.warn(`STOPPED lobby listener at ${lobbyRef}`)
    };
  }, []);

  const handleSubmitChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const form = e.target as HTMLFormElement;
    const messageInput = form.querySelector('input[name="chatMessage"]') as HTMLInputElement;
    const newMessage: ChatMessageData = {
      author: user.displayName,
      message: messageInput.value,
      date: Date.now(),
    };

    const lobbyRef = ref(database, 'lobby/messages/');
    push(lobbyRef, newMessage)
      .then(() => {
        messageInput.value = '';
      })
      .catch((error) => {
        console.error('Error adding message:', error);
      });
  };

  const lobbyScreenClass = `${styles.LobbyScreen}${hidden ? ' hidden' : ''}`;
  return (
    <main className={lobbyScreenClass}>
      <div className={styles.chatWindow}>
        <div ref={chatMessagesRef} className={styles.chatMessages}>
          {chatMessages.map(({ author, message, date }) => {
            const selfIsAuthor = author === user?.displayName;
            let messageClass = styles.chatMessage;
            if (selfIsAuthor) messageClass += ' ' + styles.self
            return (
              <div className={messageClass} key={date}>
                <img className='profile-pic' src={user?.photoURL || undefined} />
                <div className={styles.chatBody}><span className={styles.chatAuthorLabel}>{author}</span>: {message}</div>
                <div className={styles.chatTimestamp}>{new Date(date).toLocaleString()}</div>
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
    </main>
  )
}

export default LobbyScreen;