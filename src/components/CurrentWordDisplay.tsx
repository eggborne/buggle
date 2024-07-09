

import styles from './CurrentWordDisplay.module.css';


interface CurrentWordDisplayProps {
  letters: string[];
  wordValid: boolean;
}

function CurrentWordDisplay({ letters, wordValid }: CurrentWordDisplayProps) {

  let inputClass = styles.wordInput;
  if (wordValid) {
    inputClass += ' ' + styles.valid;
  } else {
    inputClass += ' ' + styles.invalid;
  }

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