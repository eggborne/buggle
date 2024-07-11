import styles from './LobbyScreen.module.css'
import { useState, useRef, useEffect } from 'react';
import { database } from '../scripts/firebase';
import { ref, onValue, push, off } from "firebase/database";

interface ChatMessageData {
  author: string;
  message: string;
  date: number;
}

interface LobbyData {
  messages: ChatMessageData[];
}

function LobbyScreen() {

  const [chatMessages, setChatMessages] = useState<ChatMessageData[]>([]);
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const lobbyRef = ref(database, 'lobby/');
    const listener = onValue(lobbyRef, (snapshot) => {
      const data: LobbyData = snapshot.val();
      setChatMessages(Object.values(data.messages));
    });
    return () => {
      off(lobbyRef, 'value', listener);
    };
  }, []);

  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTo({
        top: chatMessagesRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [chatMessages]);
  
  const handleSubmitChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const messageInput = form.querySelector('input[name="chatMessage"]') as HTMLInputElement;
    const newMessage: ChatMessageData = {
      author: 'Your Name', // Replace with actual user name
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

  return (
    <main className={styles.lobbyScreen}>
      <div className={styles.chatWindow}>
        <div ref={chatMessagesRef} className={styles.chatMessages}>
          {chatMessages.map(({ author, message }, m) =>
            <div className={styles.chatMessage} key={m}>{author}: {message}</div>
          )}
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