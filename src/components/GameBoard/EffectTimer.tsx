import styles from './GameBoard.module.css';
import { useCallback, useEffect } from 'react';
import { useFirebase } from '../../context/FirebaseContext';
import NumeralDisplay from '../NumeralDisplay';
import { DeployedPowerupData } from '../../types/types';

interface EffectTimerProps {
  opponent?: boolean;
  powerup: DeployedPowerupData;
  started: boolean;
}

const EffectTimer = ({ opponent, powerup, started }: EffectTimerProps) => {
  const { deactivatePowerup, updatePowerupTimeLeft } = useFirebase();
  const { duration, timeLeft, id } = powerup;

  const tickDown = useCallback(() => {
    if (id && (timeLeft !== undefined)) {
      updatePowerupTimeLeft(id, timeLeft - 1);
    }
  }, [id, timeLeft, updatePowerupTimeLeft]);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (started && duration > 0 && timeLeft !== undefined && timeLeft > 0) {
      timer = setInterval(tickDown, 1000);
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [started, duration, timeLeft, tickDown]);

  useEffect(() => {
    if (timeLeft === 0 && id) {
      deactivatePowerup(id);
    }
  }, [timeLeft, id, deactivatePowerup]);
  return (
    <div key={id} className={`${styles.EffectTimer} ${opponent ? styles.opponent : ''}`}>
      <span>{powerup.type.toUpperCase()}!</span>
      <NumeralDisplay digits={timeLeft || 0} length={2} height={'1rem'} />
    </div>
  );
};

export default EffectTimer;