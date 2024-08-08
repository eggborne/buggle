import { useEffect, useState, useRef, useCallback } from 'react';
import { useFirebase } from '../../context/FirebaseContext';
import NumeralDisplay from '../NumeralDisplay';

interface GameTimerProps {
  gameId: string;
  started: boolean;
  timeLimit: number;
}

const GameTimer = ({ gameId, started, timeLimit }: GameTimerProps) => {
  const { currentMatch, endGame, subscribeToFoundWords } = useFirebase();
  const [timeLeft, setTimeLeft] = useState(timeLimit || 0);
  const prevFoundWordsCountRef = useRef<number>(0);

  const handleFoundWordsChange = useCallback((foundWordsRecord: Record<string, false | string>) => {
    console.log('handlefoundwordschange', foundWordsRecord)
    const currentFoundWordsCount = Object.values(foundWordsRecord).filter(value => value !== false).length;

    if (currentFoundWordsCount > prevFoundWordsCountRef.current) {
      const newWordsFound = currentFoundWordsCount - prevFoundWordsCountRef.current;
      console.warn(`Adding time for ${newWordsFound} new words!`);
      setTimeLeft(prevTimeLeft => prevTimeLeft + timeLimit * newWordsFound);
      prevFoundWordsCountRef.current = currentFoundWordsCount;
    }
  }, [timeLimit]);

  useEffect(() => {
    let unsubscribe: (() => void);

    if (started && gameId) {
      console.log('calling unsub')
      unsubscribe = subscribeToFoundWords(handleFoundWordsChange);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (started && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            if (timer) clearInterval(timer);
            setTimeout(() => {
              endGame(gameId);
            }, 1000);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) {
        console.log('Clearing timer interval.');
        clearInterval(timer);
      }
    };
  }, [started]);

  if (!timeLimit) return;

  const numeralColor =
    timeLeft > (timeLimit * 0.5) ? 'green'
      : timeLeft > (timeLimit * 0.2) ? 'yellow'
        : 'red'

  return (
    <NumeralDisplay throbbing={numeralColor === 'red'} digits={timeLeft || 0} length={3} color={numeralColor} height={'clamp(1rem, calc(var(--header-height) * 0.5), 2rem)'} />
  );
};

export default GameTimer;