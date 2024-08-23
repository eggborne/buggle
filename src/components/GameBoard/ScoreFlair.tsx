import styles from './GameBoard.module.css'

interface ScoreFlairProps {
  opponent?: boolean;
  score: number;
}

const ScoreFlair = ({ opponent, score }: ScoreFlairProps) => {

  return (
    <div className={`${styles.ScoreFlair} ${opponent ? styles.opponent : ''}`}>
      <span>{score}</span>
    </div>  
  )
}

export default ScoreFlair;