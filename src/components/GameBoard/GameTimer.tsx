import { useEffect, useState, useRef } from 'react';
import { useFirebase } from '../../context/FirebaseContext';
import NumeralDisplay from '../NumeralDisplay';

interface GameTimerProps {
  gameId: string;
  started: boolean;
  timeLimit: number;
}

const GameTimer = ({ gameId, started, timeLimit }: GameTimerProps) => {
  const { currentMatch, endGame, subscribeToFoundWords } = useFirebase();
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const prevFoundWordsCountRef = useRef<number>(0);

  const handleFoundWordsChange = (foundWordsRecord: Record<string, false | string>) => {
    if (!foundWordsRecord || !currentMatch) return;
    const currentFoundWordsCount = Object.values(foundWordsRecord).filter(value => value !== false).length;
    if (currentFoundWordsCount > prevFoundWordsCountRef.current) {
      const addedTime = (typeof currentMatch.wordBonus === 'number') ? currentMatch.wordBonus : 10 || 0;
      setTimeLeft(prevTimeLeft => {
        let newTimeLeft = prevTimeLeft + addedTime;
        if (newTimeLeft > currentMatch.timeLimit) {
          newTimeLeft = currentMatch.timeLimit;
        }
        return newTimeLeft;
      });
      prevFoundWordsCountRef.current = currentFoundWordsCount;
    }
  };

  useEffect(() => {
    let unsubscribe: (() => void);

    if (started && gameId) {
      console.log('calling subscribeToFoundWords');
      unsubscribe = subscribeToFoundWords(handleFoundWordsChange);
    }

    return () => {
      if (unsubscribe) {
        console.log('unsubbing subscribeToFoundWords')
        unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    // start timer if game started
    let timer: NodeJS.Timeout | null = null;
    if (started && timeLeft > 0) {
      console.log('-> Starting game timer interval.');
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

    // clear timer
    return () => {
      if (timer) {
        console.log('<- Clearing game timer interval.');
        clearInterval(timer);
      }
    };
  }, [started]);

  useEffect(() => {
    if (!gameId && currentMatch) {
      handleFoundWordsChange(currentMatch.foundWordsRecord || {})
    }
  }, [currentMatch]);

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