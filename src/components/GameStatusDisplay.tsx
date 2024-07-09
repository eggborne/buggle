import { PlayerData, CurrentGameData } from '../App';
import styles from './GameStatusDisplay.module.css';
import NumeralDisplay from './NumeralDisplay';


interface GameStatusDisplayProps {
  player: PlayerData;
  currentGame: CurrentGameData;
}

function GameStatusDisplay({ player, currentGame }: GameStatusDisplayProps) {

  return (
    <div className={styles.gameStatusDisplay}>
      <div className={styles.gameStatsArea}>
        <div className={styles.labeledCounter}>
          <div>Words found</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
            <NumeralDisplay length={3} digits={player.wordsFound.size} />
            <span>of</span>
            <NumeralDisplay length={3} digits={currentGame.allWords.size} />
          </div>
        </div>
        
      </div>
      <div className={styles.timeScoreArea}>
        <div className={styles.labeledCounter}>
          <div>Time</div>
          <NumeralDisplay digits={60} />
        </div>
        <div className={styles.labeledCounter}>
          <div>Score</div>
          <NumeralDisplay digits={player.score} />
        </div>
      </div>
    </div>
  )
}

export default GameStatusDisplay;