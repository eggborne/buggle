import styles from './AttackButtons.module.css';
import { PlayerMatchData, UserData } from '../../types/types';

const pointAmounts = {
  bees: 5,
}

interface AttackButtonsProps {
  behind: boolean;
  userProgress: PlayerMatchData;
}

const AttackButtons = ({ behind, userProgress }: AttackButtonsProps) => {

  return (
    <div className={`lower-button-area ${styles.AttackButtons}`}>
      {/* <button className={`knob ${styles.leftButton}`}></button> */}
      <button className={`knob ${styles.centerButton} ${!behind ? styles.disabled : ''}`} >
        <div className={styles.pointSupply} style={{
          transform: `scaleY(min(${userProgress.attackPoints / pointAmounts.bees}, 1))`
        }} ></div>
      </button>
      {/* <button className={`knob ${styles.rightButton}`}></button> */}
    </div>
  );
}

export default AttackButtons;