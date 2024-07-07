import { wordTrie } from '../scripts/generate';
import { useState } from 'react';
import BoardCell from './BoardCell';
import styles from './GameBoard.module.css'

interface GameBoardProps {
  letterMatrix: string[][];
};


function GameBoard({ letterMatrix }: GameBoardProps) {

  const [currentWord, setCurrentWord] = useState<string>('');
  const [wordValid, setWordValid] = useState<boolean>(false);

  const handleCheckWord = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const wordToCheck = e.target.value.toUpperCase();
    setCurrentWord(wordToCheck);
    const valid = wordTrie.search(wordToCheck);
    setWordValid(wordToCheck.length > 2 && valid)
  }

  let inputClass = styles.wordInput;
  if (wordValid) {
    inputClass += ' ' + styles.valid;
  } else {
    inputClass += ' ' + styles.invalid;
  }
  

  return (
    <>
      <input className={inputClass} onChange={handleCheckWord} name='wordCheck' id='wordCheck' type='text' />
      <div className={styles.gameBoard}>
        {letterMatrix.map((row, r) => 
          row.map((letter, l) => (
            <BoardCell letter={letter} key={`${letter}${r}${l}`} />
          ))
        )}
      </div>
    </>
  )
}

export default GameBoard;