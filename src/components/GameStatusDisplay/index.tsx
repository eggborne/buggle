import { PlayerData, CurrentGameData, ConfirmData } from '../../types/types';
import styles from './GameStatusDisplay.module.css';
import NumeralDisplay from '../NumeralDisplay';
import { useUser } from '../../context/UserContext';
import { useFirebase } from '../../context/FirebaseContext';


interface GameStatusDisplayProps {
  player: PlayerData;
  currentGame: CurrentGameData;
  showConfirmModal: (confirmData: ConfirmData) => void;
}

function GameStatusDisplay({ player, currentGame, showConfirmModal }: GameStatusDisplayProps) {
  const { user, isLoggedIn, changePhase } = useUser();
  const { currentMatch } = useFirebase();

  const confirmToLobby = () => showConfirmModal({
    typeOpen: 'leaveGame',
    message: 'Are you sure you want to leave this game?',
    targetPhase: 'lobby',
  });

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

      <div className={styles.scoreArea}>
        <div className={styles.labeledCounter}>
          <div>Score</div>
          <NumeralDisplay digits={player.score} height={'1.5rem'} length={3} />
        </div>
      </div>

      <div className={`${styles.labeledCounter} ${styles.timeCounter}`}>
        <div>Time</div>
        <NumeralDisplay digits={currentGame.timeLimit || 0} length={3} height={'2.5rem'} />
      </div>


      <div className={styles.scoreArea}>
        <div className={styles.labeledCounter} style={{ visibility: currentMatch ? 'visible' : 'hidden' }} >
          <div>Score</div>
          <NumeralDisplay digits={player.score} height={'1.5rem'} length={3} />
        </div>
      </div>

      <div className={`${styles.playerArea} ${styles.opponentArea}`}>
        {isLoggedIn ?
          !currentMatch ?
            <button onClick={confirmToLobby} className={'tiny start'}>Find a match</button>
            :
            <>
              <img className={'profile-pic'} src={''} />
              <div className={styles.userLabel} style={{ fontSize: `${1 - ((user?.displayName?.length || 0) / 20)}rem` }}>{'Opponent'}</div>
            </>
          :
          <button onClick={() => showConfirmModal({
            typeOpen: 'leaveGame',
            message: 'Are you sure you want to leave this game?',
            targetPhase: 'title',
          })} className={'tiny start'}>Log in to challenge others</button>
        }
      </div>
    </div>
  )
}

export default GameStatusDisplay;