import styles from './LobbyScreen.module.css'
import { useState, useRef, useEffect } from 'react';
import { database } from '../scripts/firebase';
import { ref, onValue, push, off } from "firebase/database";

interface LobbyScreenProps {
  hidden: boolean;
}

interface ChatMessageData {
  author: string;
  message: string;
  date: number;
}

interface LobbyData {
  messages: ChatMessageData[];
}

function LobbyScreen({ hidden }: LobbyScreenProps) {

  const [chatMessages, setChatMessages] = useState<ChatMessageData[]>([]);
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const lobbyRef = ref(database, 'lobby/');
    const listener = onValue(lobbyRef, (snapshot) => {
      const data: LobbyData = snapshot.val();
      const messagesArray = Object.values(data.messages).slice(-10).reverse();
      setChatMessages(messagesArray);
    });
    return () => {
      off(lobbyRef, 'value', listener);
    };
  }, []);

  const handleSubmitChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const messageInput = form.querySelector('input[name="chatMessage"]') as HTMLInputElement;
    const newMessage: ChatMessageData = {
      author: process.env.NODE_ENV === 'development' ? 'Mike' : 'Your Name', // Replace with actual user name
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
            const selfIsAuthor = author === 'Mike';
            let messageClass = styles.chatMessage;
            if (selfIsAuthor) messageClass += ' ' + styles.self
            return (
              <div className={messageClass} key={date}>
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