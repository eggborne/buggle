import styles from './GameBoard.module.css'
import { CellObj, CurrentGameData, UserData } from '../../types/types';
import { useEffect, useRef, useState } from 'react';
import BoardCell from '../BoardCell';
import CurrentWordDisplay from '../CurrentWordDisplay';
import { useUser } from '../../context/UserContext';
import SmoothPathOverlay from './PathOverlay';
import { useFirebase } from '../../context/FirebaseContext';

interface GameBoardProps {
  opponentData: UserData | null;
  fillerData?: CurrentGameData;
  noAnimation?: boolean;
  onSubmitValidWord: (word: string) => void;
}

function GameBoard({ opponentData, fillerData, noAnimation, onSubmitValidWord }: GameBoardProps) {
  const { user } = useUser();
  const options = user?.preferences;
  let { currentMatch } = useFirebase();
  if (fillerData) {
    currentMatch = fillerData;
  }
  const [dragging, setDragging] = useState<boolean>(false);
  const [currentWord, setCurrentWord] = useState<string>('');
  const [touchedCells, setTouchedCells] = useState<CellObj[]>([]);
  const [wordValid, setWordValid] = useState<boolean>(false);
  const [wordStatus, setWordStatus] = useState<string>('invalid');
  const gameBoardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    requestAnimationFrame(() => {
      if (gameBoardRef.current) {
        gameBoardRef.current.classList.add(styles.showing)
      }
    })
  }, []);

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
      window.removeEventListener('mousedown', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, touchedCells]);

  const boardRect = gameBoardRef.current?.getBoundingClientRect();
  const handleCellHover = (clientX: number, clientY: number) => {
    if (!boardRect || !currentMatch || !options) return;
    const cellBuffer = options.gameplay.swipeBuffer / 50;
    const cellSize = boardRect.width / currentMatch.dimensions.width;
    const hitboxMargin = touchedCells.length > 0 ? cellSize * (cellBuffer / 8) : 0;

    const row = Math.floor((clientY - boardRect.top) / cellSize);
    const col = Math.floor((clientX - boardRect.left) / cellSize);

    const cellTop = boardRect.top + row * cellSize + hitboxMargin;
    const cellBottom = boardRect.top + (row + 1) * cellSize - hitboxMargin;
    const cellLeft = boardRect.left + col * cellSize + hitboxMargin;
    const cellRight = boardRect.left + (col + 1) * cellSize - hitboxMargin;

    if (
      clientY >= cellTop && clientY <= cellBottom &&
      clientX >= cellLeft && clientX <= cellRight &&
      row >= 0 && row < currentMatch.letterMatrix.length &&
      col >= 0 && col < currentMatch.letterMatrix[0].length
    ) {
      const id = `${row}${col}`;
      const cellObj = {
        letter: currentMatch.letterMatrix[row][col],
        id,
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
      onSubmitValidWord(currentWord);
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

    const nextCurrentWord = (currentWord + cell.letter);
    setTouchedCells((prevTouchedCells) => {
      const newTouchedCells = [...prevTouchedCells, cell];
      return newTouchedCells;
    });
    setCurrentWord(nextCurrentWord);
    const foundWords: Record<string, boolean> = currentMatch?.playerProgress[user?.uid ?? '']?.foundWords ?? {};
    const opponentFoundWords: Record<string, boolean> = currentMatch?.playerProgress[opponentData?.uid ?? '']?.foundWords ?? {};
    console.log('foundWords:', foundWords, 'opponentFoundWords:', opponentFoundWords)
    const alreadyFound = foundWords[nextCurrentWord.toLowerCase()]
    const opponentAlreadyFound = opponentFoundWords[nextCurrentWord.toLowerCase()];
    // const alreadyFound = Array.from(foundWords).includes(nextCurrentWord);
    // const opponentAlreadyFound = Array.from(opponentFoundWords).includes(nextCurrentWord);
    const wordExistsInPuzzle = new Set(currentMatch?.allWords).has(nextCurrentWord);
    let newStatus;
    if (alreadyFound) {
      newStatus = 'duplicate';
    } else if (opponentAlreadyFound) {
      newStatus = 'opponentFound';
    } else if (wordExistsInPuzzle) {
      newStatus = 'valid';
    } else {
      newStatus = 'invalid';
    }
    setWordStatus(newStatus);
    setWordValid(!alreadyFound && !opponentAlreadyFound && wordExistsInPuzzle);
  };

  const handleCellTouchEnd = () => {
    // No action needed here?
  };

  const isValidNeighbor = (cell1: CellObj, cell2: CellObj): boolean => {
    const rowDiff = Math.abs(cell1.row - cell2.row);
    const colDiff = Math.abs(cell1.col - cell2.col);
    return rowDiff <= 1 && colDiff <= 1 && !(rowDiff === 0 && colDiff === 0);
  };

  return (
    <div className={styles.gameArea}>
      {!noAnimation && <CurrentWordDisplay letters={currentWord.split('')} wordStatus={wordStatus} />}
      <div
        ref={gameBoardRef}
        id='game-board'
        className={styles.gameBoard}
        style={{
          gridTemplateColumns: `repeat(${currentMatch?.dimensions.width}, 1fr)`,
          gridTemplateRows: `repeat(${currentMatch?.dimensions.height}, 1fr)`,
          fontSize: `calc((var(--game-board-size) * 0.5) / ${currentMatch?.dimensions.width})`,
          minWidth: `calc((var(--game-board-size) * 0.5) / ${currentMatch?.dimensions.width})`,
          transition: noAnimation ? 'none' : 'scale 600ms ease, opacity 600ms ease',
          transitionDelay: noAnimation ? '0ms' : '300ms',
          animationPlayState: noAnimation ? 'paused' : 'running',
          zIndex: '0',
          borderRadius: `calc(var(--cube-roundness) / ${currentMatch?.dimensions.height})`,
        }}
      >
        {currentMatch?.letterMatrix.map((row, r) =>
          row.map((letter, l) => (
            <div
              key={`${letter}${r}${l}`}
              id={`${r}${l}`}
            >
              <BoardCell letter={letter} touched={touchedCells.some(c => c.id === `${r}${l}`)} wordStatus={wordStatus} />
            </div>
          ))
        )}
        <SmoothPathOverlay
          isSelecting={touchedCells.length > 0}
          cells={touchedCells}
          dimensions={currentMatch?.dimensions || { width: 5, height: 5}}
          wordStatus={wordStatus}
        />
      </div>
    </div>
  )
}

export default GameBoard;