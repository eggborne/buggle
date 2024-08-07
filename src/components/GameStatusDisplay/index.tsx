import { ConfirmData, UserData } from '../../types/types';
import styles from './GameStatusDisplay.module.css';
import NumeralDisplay from '../NumeralDisplay';
import { useUser } from '../../context/UserContext';
import { useFirebase } from '../../context/FirebaseContext';
import GameTimer from '../GameBoard/GameTimer';


interface GameStatusDisplayProps {
  gameStarted: boolean;
  isMultiplayer: boolean;
  opponentData: UserData | null;
  showConfirmModal: (confirmData: ConfirmData) => void;
}

function GameStatusDisplay({ gameStarted, isMultiplayer, opponentData, showConfirmModal }: GameStatusDisplayProps) {
  const { user, isLoggedIn } = useUser();
  const { currentMatch } = useFirebase();
  if (!currentMatch || !user) return;
  const { playerProgress } = currentMatch;

  const confirmToLobby = () => showConfirmModal({
    typeOpen: 'leaveGame',
    message: 'Are you sure you want to leave this game?',
    targetPhase: 'lobby',
  });

  return (
    <div className={styles.gameStatusDisplay}>
      <div className={styles.playerArea}>
        <img className={'profile-pic'} src={user.photoURL || ''} />
        <div className={styles.userLabel} style={{ fontSize: `${1.5 - ((user.displayName?.length || 0) / 15)}rem` }}>{user.displayName || 'Guest'}</div>
      </div>

      <div className={styles.scoreArea}>
        <div className={styles.labeledCounter}>
          <div>Score</div>
          <NumeralDisplay digits={playerProgress[user.uid].score} height={'calc(var(--header-button-size) / 3.2)'} length={3} />
        </div>
      </div>

      <div className={`${styles.labeledCounter} ${styles.timeCounter}`}>
        <GameTimer gameId={currentMatch.id || ''} started={gameStarted} timeLimit={currentMatch.timeLimit || 200} />
      </div>

      <div className={styles.scoreArea}>
        <div className={styles.labeledCounter} style={{ visibility: isMultiplayer ? 'visible' : 'hidden' }} >
          <div>Score</div>
          <NumeralDisplay digits={opponentData ? playerProgress[opponentData.uid].score : 0 } height={'calc(var(--header-button-size) / 3.2)'} length={3} />
        </div>
      </div>

      <div className={`${styles.playerArea} ${styles.opponentArea}`}>
        {isLoggedIn ?
          !isMultiplayer ?
            <div onClick={confirmToLobby} className={styles.findMatchButton}>
              Find a match
            </div>
            :
            <>
              <img className={'profile-pic'} src={opponentData?.photoURL || ''} />
              <div className={styles.userLabel} style={{ fontSize: `${1.5 - ((opponentData?.displayName?.length || 0) / 15)}rem` }}>{opponentData?.displayName}</div>
            </>
          :
          <button onClick={confirmToLobby}>Log in to challenge others</button>
        }
      </div>

      {currentMatch.specialWords && <div className={styles.infoArea}>
        <div className={styles.themeLabel}>{currentMatch.theme}</div>
        <div className={styles.themeProgress}>{currentMatch.specialWords.filter(w => currentMatch.foundWordsRecord && currentMatch.foundWordsRecord[w]).length}/{currentMatch.specialWords.length} special words found</div>
      </div>}
    </div>
  )
}

export default GameStatusDisplay;