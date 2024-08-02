import styles from './ChatWindow.module.css'
import { useUser } from '../../context/UserContext';
import { useEffect, useRef, useState } from 'react';
import { ChatMessageData, LobbyData } from '../../types/types';
import { ref, onValue, off, push } from 'firebase/database';
import { database } from '../../scripts/firebase';

interface ChatWindowProps {
  hidden: boolean;
}

function ChatWindow({ hidden }: ChatWindowProps) {
  const { user } = useUser();
  const [chatMessages, setChatMessages] = useState<ChatMessageData[]>([]);
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const lobbyRef = ref(database, 'lobby/messages/');
    const messageListener = onValue(lobbyRef, (snapshot) => {
      const data: LobbyData = snapshot.val();
      const messagesArray = Object.values(data).slice(-10).reverse();
      setChatMessages(messagesArray);
    });
    console.log(`----------------> STARTED LobbyScreen /messages listener`);    

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
  
  return (
    <div className={`${styles.ChatWindow} ${hidden ? styles.hidden : ''}`}>
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
  )
}

export default ChatWindow;