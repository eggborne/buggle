import styles from './AttackButtons.module.css';
import { PlayerMatchData, PowerupData, UserData } from '../../types/types';
import { powers } from '../GameBoard';
import { useFirebase } from '../../context/FirebaseContext';

interface AttackButtonsProps {
  availablePowers?: PowerupData[];
  behind: boolean;
  opponentData: UserData;
  userProgress: PlayerMatchData;
}

const AttackButtons = ({ availablePowers, opponentData, behind, userProgress }: AttackButtonsProps) => {
  const { activatePowerup, updatePlayerAttackPoints } = useFirebase();

  const handleClickUsePowerup = (powerupType: keyof typeof powers) => {
    updatePlayerAttackPoints(userProgress.uid, (userProgress.attackPoints - powers[powerupType].cost));
    activatePowerup(userProgress.uid, opponentData.uid, powers[powerupType]);
  }
  console.log('availablePowers', availablePowers);
  return (
    <div className={`lower-button-area ${styles.AttackButtons}`}>
      {/* <button className={`knob ${styles.leftButton}`}></button> */}
      <button
        onClick={() => handleClickUsePowerup('bees')}
        className={`knob ${styles.centerButton} ${Object.values(availablePowers || {}).find(p => p.type === 'bees') ? styles.available : ''} ${!behind ? styles.disabled : ''}`} >
        <div className={styles.pointSupply} style={{
          transform: `scaleY(min(${userProgress.attackPoints / powers['bees'].cost}, 1))`
        }} ></div>
      </button>
      {/* <button className={`knob ${styles.rightButton}`}></button> */}
    </div>
  );
}

export default AttackButtons;