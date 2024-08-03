import { ConfirmData, UserData } from '../../types/types';
import styles from './GameStatusDisplay.module.css';
import NumeralDisplay from '../NumeralDisplay';
import { useUser } from '../../context/UserContext';
import { useFirebase } from '../../context/FirebaseContext';
import GameTimer from '../GameBoard/GameTimer';


interface GameStatusDisplayProps {
  isMultiplayer: boolean;
  opponentData: UserData | null;
  showConfirmModal: (confirmData: ConfirmData) => void;
}

function GameStatusDisplay({ isMultiplayer, opponentData, showConfirmModal }: GameStatusDisplayProps) {
  const { user, isLoggedIn } = useUser();
  const { currentMatch } = useFirebase();
  if (!currentMatch || !user) return;
  const { playerProgress, timeLimit } = currentMatch;

  const confirmToLobby = () => showConfirmModal({
    typeOpen: 'leaveGame',
    message: 'Are you sure you want to leave this game?',
    targetPhase: 'lobby',
  });

  return (
    <div className={styles.gameStatusDisplay}>
      <div className={styles.playerArea}>
        <img className={'profile-pic'} src={user.photoURL || ''} />
        <div className={styles.userLabel} style={{ fontSize: `${1 - ((user.displayName?.length || 0) / 20)}rem` }}>{user.displayName || 'Guest'}</div>
      </div>

      {/* <div className={styles.gameStatsArea}>
        {currentMatch.playerProgress[user.uid].foundWords && <div className={styles.labeledCounter}>
          <div>Words found</div>
          <div className={styles.totalWordTally}>
            <NumeralDisplay length={3} digits={Object.keys(currentMatch.playerProgress[user.uid].foundWords).length} height={'1rem'}/>
            <span>of</span>
            <NumeralDisplay length={3} digits={new Set(currentMatch.allWords).size} height={'1rem'}/>
          </div>
        </div>}
      </div> */}

      <div className={styles.scoreArea}>
        <div className={styles.labeledCounter}>
          <div>Score</div>
          <NumeralDisplay digits={playerProgress[user.uid].score} height={'calc(var(--header-height) / 3.2)'} length={3} />
        </div>
      </div>

      <div className={`${styles.labeledCounter} ${styles.timeCounter}`}>
        {/* <NumeralDisplay digits={timeLimit || 0} length={3} color={'green'} height={'clamp(1rem, calc(var(--header-height) * 0.5), 2rem)'} /> */}
        <GameTimer gameId={currentMatch.id || ''} started={true} timeLimit={currentMatch.timeLimit || 200} />
      </div>


      <div className={styles.scoreArea}>
        <div className={styles.labeledCounter} style={{ visibility: isMultiplayer ? 'visible' : 'hidden' }} >
          <div>Score</div>
          <NumeralDisplay digits={opponentData ? playerProgress[opponentData.uid].score : 0 } height={'calc(var(--header-height) / 3.2)'} length={3} />
        </div>
      </div>

      <div className={`${styles.playerArea} ${styles.opponentArea}`}>
        {isLoggedIn ?
          !isMultiplayer ?
            <button onClick={confirmToLobby} className={'tiny start'}>Find a match</button>
            :
            <>
              <img className={'profile-pic'} src={opponentData?.photoURL || ''} />
              <div className={styles.userLabel} style={{ fontSize: `${1 - ((opponentData?.displayName?.length || 0) / 20)}rem` }}>{opponentData?.displayName}</div>
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