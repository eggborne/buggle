import styles from './MessageBanner.module.css';

interface MessageBannerProps {
  message: string;
  isOpen: boolean;
  style?: Record<string, string | number>;
}

const MessageBanner = ({ isOpen, message, style }: MessageBannerProps) => {
  if (!isOpen) return null;
  return (
    <div className={styles.MessageBanner} style={style}>
      {message}
    </div>
  );
};

export default MessageBanner;