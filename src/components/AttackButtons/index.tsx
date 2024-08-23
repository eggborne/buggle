import styles from './AttackButtons.module.css';
import { DefaultPowerupData, PlayerMatchData, UserData } from '../../types/types';
import { powers } from '../GameBoard';
import { useFirebase } from '../../context/FirebaseContext';

interface AttackButtonsProps {
  availablePowers?: DefaultPowerupData[];
  userProgress: PlayerMatchData;
  behind?: boolean;
  opponentData?: UserData;
}

const AttackButtons = ({ availablePowers, opponentData, behind, userProgress }: AttackButtonsProps) => {
  const { activatePowerup, updatePlayerAttackPoints } = useFirebase();

  const handleClickUsePowerup = async (powerup: DefaultPowerupData | null) => {
    if (powerup == null) return;
    const { type } = powerup;
    updatePlayerAttackPoints(userProgress.uid, (userProgress.attackPoints - powers[type].cost));
    if (opponentData) {
      const newPowerup = {
        ...powerup,
        target: opponentData.uid,
        activatedBy: userProgress.uid,
      }     
      activatePowerup(newPowerup);
    }
  }
  return (
    <div className={`lower-button-area ${styles.AttackButtons}`}>
      <button className={`knob ${styles.leftButton}`}></button>
      <button
        onClick={() => handleClickUsePowerup(Object.values(availablePowers || {}).find(p => p.type === 'bees') || null)}
        className={`knob ${styles.centerButton} ${Object.values(availablePowers || {}).find(p => p.type === 'bees') ? styles.available : ''} ${!behind ? styles.disabled : ''}`} >
        <div className={styles.pointSupply} style={{
          transform: `scaleY(min(${userProgress.attackPoints / powers['bees'].cost}, 1))`
        }} ></div>
      </button>
      <button className={`knob ${styles.rightButton}`}></button>
    </div>
  );
}

export default AttackButtons;