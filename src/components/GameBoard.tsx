import { CurrentGameData, PlayerData } from '../App';
import { useEffect, useRef, useState } from 'react';
import BoardCell from './BoardCell';
import Modal from './Modal';
import styles from './GameBoard.module.css'
import CurrentWordDisplay from './CurrentWordDisplay';

interface GameBoardProps {
  currentGame: CurrentGameData;
  player: PlayerData;
  letterMatrix: string[][];
  onValidWord: (word: string) => void;
  uploadPuzzle: () => void;
}

interface CellObj {
  letter: string;
  id: string;
  row: number;
  col: number;
}

function GameBoard({ player, currentGame, letterMatrix, onValidWord, uploadPuzzle }: GameBoardProps) {

  const gameBoardRef = useRef<HTMLDivElement>(null);

  const [dragging, setDragging] = useState<boolean>(false);
  const [currentWord, setCurrentWord] = useState<string>('');
  const [touchedCells, setTouchedCells] = useState<CellObj[]>([]);
  const [wordValid, setWordValid] = useState<boolean>(false);
  const [wordStatus, setWordStatus] = useState<string>('invalid');
  const [wordListShowing, setWordListShowing] = useState<boolean>(false);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      const target = touch.target as HTMLElement;
      if (target.closest(`#game-board`)) {
        setDragging(true);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (gameBoardRef.current?.contains(e.target as Node)) {
        e.preventDefault();
      }
      if (!dragging) return;
      const touch = e.touches[0];
      handleCellHover(touch.clientX, touch.clientY);
    };

    const handleTouchEnd = () => {
      if (!dragging) return;
      handleWordSubmit();
      setDragging(false);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging) return;
      handleCellHover(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      if (!dragging) return;
      handleWordSubmit();
      setDragging(false);
    };

    // Touch Events
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: false });

    // Mouse Events 
    window.addEventListener('mousedown', (e) => {
      if (e.target === gameBoardRef.current || gameBoardRef.current?.contains(e.target as Node)) {
        setDragging(true);
      }
    });
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('mousedown', handleMouseUp); // Cleanup mousedown
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, touchedCells]);

  const handleCellHover = (clientX: number, clientY: number) => {
    const boardRect = gameBoardRef.current?.getBoundingClientRect();
    if (!boardRect) return;

    const cellBuffer = 0.5;
    // const cellSize = boardRect.width / letterMatrix.length; // Assuming square board
    const cellSize = boardRect.width / currentGame.gridSize.width; // Assuming square board
    const hitboxMargin = touchedCells.length > 0 ? cellSize * (cellBuffer / 10) : 0;

    const row = Math.floor((clientY - boardRect.top) / cellSize);
    const col = Math.floor((clientX - boardRect.left) / cellSize);

    const cellTop = boardRect.top + row * cellSize + hitboxMargin;
    const cellBottom = boardRect.top + (row + 1) * cellSize - hitboxMargin;
    const cellLeft = boardRect.left + col * cellSize + hitboxMargin;
    const cellRight = boardRect.left + (col + 1) * cellSize - hitboxMargin;

    if (
      clientY >= cellTop && clientY <= cellBottom &&
      clientX >= cellLeft && clientX <= cellRight &&
      row >= 0 && row < letterMatrix.length &&
      col >= 0 && col < letterMatrix[0].length
    ) {
      const cellId = `${row}${col}`;
      const cellObj = {
        letter: letterMatrix[row][col],
        id: cellId,
        row,
        col,
      };
      handleCellTouchStart(cellObj);
    } else {
      handleCellTouchEnd();
    }
  };

  const handleWordSubmit = () => {
    if (wordValid) {
      onValidWord(currentWord);

    }
    setCurrentWord('');
    setTouchedCells([]);
    setWordValid(false);
    setWordStatus('invalid');
  };

  const handleCellTouchStart = (cell: CellObj) => {
    if (!dragging) return;
    if (touchedCells.find((c) => c.id === cell.id)) return;
    if (touchedCells.length > 0 && !isValidNeighbor(cell, touchedCells[touchedCells.length - 1])) return;

    const nextCurrentWord = currentWord + cell.letter;
    setTouchedCells((prevTouchedCells) => [...prevTouchedCells, cell]);
    setCurrentWord(nextCurrentWord);
    const alreadyFound = player.wordsFound.has(nextCurrentWord);
    const wordExistsInPuzzle = currentGame.allWords.has(nextCurrentWord);
    setWordStatus(alreadyFound ? 'duplicate' : wordExistsInPuzzle ? 'valid' : 'invalid');
    setWordValid(!alreadyFound && wordExistsInPuzzle);
  };

  const handleCellTouchEnd = () => {
    //
  };

  const isValidNeighbor = (cell1: CellObj, cell2: CellObj): boolean => {
    const rowDiff = Math.abs(cell1.row - cell2.row);
    const colDiff = Math.abs(cell1.col - cell2.col);
    return rowDiff <= 1 && colDiff <= 1 && !(rowDiff === 0 && colDiff === 0);
  };

  return (
    <>
      <CurrentWordDisplay letters={currentWord.split('')} wordStatus={wordStatus} />
      <div
        ref={gameBoardRef}
        id='game-board'
        className={styles.gameBoard}
      >
        {letterMatrix.map((row, r) =>
          row.map((letter, l) => (
            <div
              key={`${letter}${r}${l}`}
              id={`${r}${l}`}
              style={{ userSelect: 'none' }}
            >
              <BoardCell letter={letter} touched={touchedCells.some(c => c.id === `${r}${l}`)} wordStatus={wordStatus} />
            </div>
          ))
        )}
      </div>
      <div className={styles.lowerButtonArea}>
        <button onClick={uploadPuzzle}>Upload</button>
        <button onClick={() => setWordListShowing(true)}>Word List</button>
      </div>
      {wordListShowing &&
        <Modal isOpen={wordListShowing} onClose={() => setWordListShowing(false)}>
          {Array.from(currentGame.allWords).sort((a, b) => b.length - a.length).map(word =>
            <div style={{
              opacity: Array.from(player.wordsFound).includes(word) ? '0.75' : '1',
              textDecoration: Array.from(player.wordsFound).includes(word) ? 'line-through' : 'none'
            }} key={word}>{word}</div>
          )}
        </Modal>
      }
    </>
  )
}

export default GameBoard;