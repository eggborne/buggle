

import styles from './CurrentWordDisplay.module.css';

interface CurrentWordDisplayProps {
  letters: string[];
  wordStatus: string;
}

function CurrentWordDisplay({ letters, wordStatus }: CurrentWordDisplayProps) {

  let inputClass = styles.wordInput;
  inputClass += ' ' + styles[wordStatus];

  return (
    <div className={inputClass} >
      <div className={styles.wordLegend} style={{
        transform: letters.length < 8 ? `scale(1)` : 'scale(0.8)'
      }}>
        {letters.map((letter, l) =>
          <div key={`${letter}${l}`} className={styles.wordDisplayLetter}>{letter}</div>
        )}
      </div>
    </div>
  )
}

export default CurrentWordDisplay;