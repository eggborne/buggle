import styles from './MessageBanner.module.css';
import { useEffect } from 'react';
import { useMessageBanner } from '../../hooks/useMessageBanner';

const MessageBanner = () => {
  const { duration, message, isVisible, hideMessage } = useMessageBanner();
  useEffect(() => {
    if (isVisible) {
      setTimeout(() => {
        hideMessage();
      }, duration);
    }
  }, [isVisible]);

  return (
    <div
      className={`${styles.MessageBanner} ${isVisible ? styles.showing : styles.hidden}`}
    >
      {message}
    </div>
  );
};

export default MessageBanner;