import { useEffect, useState } from 'react';
import { useFirebase } from '../../context/FirebaseContext';
import NumeralDisplay from '../NumeralDisplay';

interface GameTimerProps {
  gameId: string;
  started: boolean;
  timeLimit: number;
}

const GameTimer = ({ gameId, started }: GameTimerProps) => {
  const { currentMatch, endGame } = useFirebase();
  const [timeLeft, setTimeLeft] = useState(currentMatch?.timeLimit || 0);

  useEffect(() => {
    if (started) {
      if (currentMatch && currentMatch.timeLimit) {
        const endTime = Date.now() + (currentMatch.timeLimit * 1000);
        const timer = setInterval(() => {
          const now = Date.now();
          const remaining = Math.max(0, (endTime || 0) - now);
          setTimeLeft(Math.ceil(remaining / 1000));

          if (remaining <= 0) {
            clearInterval(timer);
            endGame(gameId);
          }
        }, 1000);
        return () => clearInterval(timer);
      }
    }
  }, [started]);

  if (!currentMatch || !currentMatch.timeLimit) return;

  const numeralColor =
    timeLeft > (currentMatch.timeLimit * 0.5) ? 'green'
      : timeLeft > (currentMatch.timeLimit * 0.2) ? 'yellow'
        : 'red'

  return (
    <NumeralDisplay throbbing={numeralColor === 'red'} digits={timeLeft || 0} length={3} color={numeralColor} height={'clamp(1rem, calc(var(--header-height) * 0.5), 2rem)'} />
  );
};

export default GameTimer;