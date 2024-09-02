import { useState, useCallback, useEffect } from 'react';

interface MessageEvent extends Event {
  detail: {
    duration: number;
    message: string;
  };
}

export const useMessageBanner = () => {
  const [duration, setDuration] = useState(2000);
  const [message, setMessage] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  const showMessage = useCallback((msg: string) => {
    setDuration(duration)
    setMessage(msg);
    setIsVisible(true);
  }, []);

  const hideMessage = useCallback(() => {
    setIsVisible(false);
  }, []);

  useEffect(() => {
    const handleShowMessage = (event: MessageEvent) => {
      showMessage(event.detail.message);
    };

    window.addEventListener('showMessage', handleShowMessage as EventListener);

    return () => {
      window.removeEventListener('showMessage', handleShowMessage as EventListener);
    };
  }, [showMessage]);

  return { duration, message, isVisible, showMessage, hideMessage };
};

export const triggerShowMessage = (message: string, duration: number = 2000) => {
  window.dispatchEvent(new CustomEvent('showMessage', { detail: { duration, message } }));
};