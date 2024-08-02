import styles from './GameBoard.module.css'
import { useEffect, useState } from 'react';
import { useFirebase } from '../../context/FirebaseContext';
import NumeralDisplay from '../NumeralDisplay';

interface GameTimerProps {
  gameId: string;
  started: boolean;
  timeLimit: number;
}

const GameTimer = ({ gameId, started, timeLimit }: GameTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const { currentMatch, endGame } = useFirebase();

  useEffect(() => {
    console.log('currentmatch at eff is', currentMatch)
    if (started) {
      if (currentMatch && currentMatch.endTime) {
        const timer = setInterval(() => {
          const now = Date.now();
          const remaining = Math.max(0, (currentMatch.endTime || 0) - now);
          setTimeLeft(Math.floor(remaining / 1000));

          if (remaining <= 0) {
            clearInterval(timer);
            endGame(gameId);
          }
        }, 1000);
        return () => clearInterval(timer);
      }
    }
  }, [started]);

  return (
    <NumeralDisplay digits={timeLeft || 0} length={3} color={'green'} height={'clamp(1rem, calc(var(--header-height) * 0.5), 2rem)'} />
  );
};

export default GameTimer;