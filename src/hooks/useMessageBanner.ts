import { useState, useCallback, useEffect } from 'react';

interface MessageEvent extends Event {
  detail: {
    message: string;
  };
}

export const useMessageBanner = () => {
  const [message, setMessage] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  const showMessage = useCallback((msg: string) => {
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

  return { message, isVisible, showMessage, hideMessage };
};

export const triggerShowMessage = (message: string) => {
  window.dispatchEvent(new CustomEvent('showMessage', { detail: { message } }));
};