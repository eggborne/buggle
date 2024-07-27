import { PlayerData, CurrentGameData } from '../../types/types';
import styles from './GameStatusDisplay.module.css';
import NumeralDisplay from '../NumeralDisplay';
import { useUser } from '../../context/UserContext';


interface GameStatusDisplayProps {
  player: PlayerData;
  currentGame: CurrentGameData;
}

function GameStatusDisplay({ player, currentGame }: GameStatusDisplayProps) {
  const { user, isLoggedIn } = useUser();

  return (
    <div className={styles.gameStatusDisplay}>
      <div className={styles.playerArea}>
        <img className={'profile-pic'} src={user?.photoURL || ''} />
        <div className={styles.userLabel} style={{ fontSize: `${1 - ((user?.displayName?.length || 0) / 100)}rem` }}>{user?.displayName || 'Guest'}</div>
      </div>

      {/* <div className={styles.gameStatsArea}>
        <div className={styles.labeledCounter}>
          <div>Words found</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <NumeralDisplay length={3} digits={player.wordsFound.size} />
            <span>of</span>
            <NumeralDisplay length={3} digits={currentGame.allWords.size} />
          </div>
        </div>
      </div> */}

      <div className={`${styles.labeledCounter} ${styles.timeCounter}`}>
        <div>Time</div>
        <NumeralDisplay digits={currentGame.timeLimit || 0} length={3} height={'calc(var(--header-height) / 2)'} />
      </div>

      {/* <div className={styles.timeScoreArea}>
        <div className={styles.labeledCounter}>
          <div>Score</div>
          <NumeralDisplay digits={player.score} />
        </div>
      </div> */}

      <div className={`${styles.playerArea} ${styles.opponentArea}`}>
        {isLoggedIn ?
          <>
            <img className={'profile-pic'} src={''} />
            <div className={styles.userLabel} style={{ fontSize: `${1 - ((user?.displayName?.length || 0) / 20)}rem` }}>{'Opponent'}</div>
          </>
          :
          <div style={{ width: 'max-content'}}>Log in</div>
        }
      </div>
    </div>
  )
}

export default GameStatusDisplay;