import { wordTrie } from '../scripts/generate';
import { useEffect, useState } from 'react';
import BoardCell from './BoardCell';
import styles from './GameBoard.module.css'

interface GameBoardProps {
  letterMatrix: string[][];
};

interface cellObj {
  letter: string;
  id: string;
}


function GameBoard({ letterMatrix }: GameBoardProps) {

  const [dragging, setDragging] = useState<boolean>(false);

  const [currentWord, setCurrentWord] = useState<string>('');
  const [touchedCells, setTouchedCells] = useState<cellObj[]>([]);

  const [wordValid, setWordValid] = useState<boolean>(false);

  useEffect(() => {
    document.getElementById('game-board')?.addEventListener('touchstart', () => setDragging(true));
    window.addEventListener('touchend', () => setDragging(false));
  }, []);

  const handlePointerMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const cell = e.target as HTMLDivElement;
    const letter = cell.textContent as string;
    console.log('cell', cell)
    const nextCellObj: cellObj = {
      letter,
      id: cell.id
    }
    if (touchedCells.filter(cell => cell.id === nextCellObj.id).length === 0) {
      setTouchedCells([ ...touchedCells, nextCellObj])
      const nextWord = currentWord + letter;
      checkWord(nextWord);
      setCurrentWord(nextWord);
    } else {
      console.warn('already added', nextCellObj)
    }
  }

  const checkWord = (wordToCheck: string) => {
    console.log('checking word: ' + wordToCheck)
    const valid = wordTrie.search(wordToCheck);
    setWordValid(wordToCheck.length > 2 && valid)
  }

  let inputClass = styles.wordInput;
  if (wordValid) {
    inputClass += ' ' + styles.valid;
  } else {
    inputClass += ' ' + styles.invalid;
  }

  const wordString = touchedCells.map(cell => cell.letter).join('');

  return (
    <>
      <input
        readOnly
        className={inputClass}
        value={wordString}
        name='wordCheck' id='wordCheck' type='text'
      />
      <div id='game-board'className={styles.gameBoard} style={{outline: dragging ? '4px solid red' : 'none'}}>
        {letterMatrix.map((row, r) =>
          row.map((letter, l) => (
            <div
              key={`${letter}${r}${l}`}
              id={`${r}${l}`}
              onPointerEnter={handlePointerMove}
            >
              <BoardCell letter={letter} />
            </div>
          ))
        )}
      </div>
    </>
  )
}

export default GameBoard;