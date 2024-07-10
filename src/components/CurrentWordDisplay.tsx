

import styles from './CurrentWordDisplay.module.css';


interface CurrentWordDisplayProps {
  letters: string[];
  wordStatus: string;
}

function CurrentWordDisplay({ letters, wordStatus }: CurrentWordDisplayProps) {

  let inputClass = styles.wordInput;
  inputClass += ' ' + styles[wordStatus];
  const wordString = letters.join('');

  return (
    <input
      readOnly
      className={inputClass}
      value={wordString}
      name='wordCheck' id='wordCheck' type='text'
    />
  )
}

export default CurrentWordDisplay;