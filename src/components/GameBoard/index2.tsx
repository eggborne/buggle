import React, { useEffect, useRef, useState, useCallback } from 'react';
import styles from './GameBoard.module.css';
import { off, onValue, ref } from 'firebase/database';
import { database } from '../../scripts/firebase';
import { CellObj, CurrentGameData, PlayerData, OptionsData } from '../../types/types';
import { useUser } from '../../context/UserContext';
import BoardCell from '../BoardCell';
import CurrentWordDisplay from '../CurrentWordDisplay';
import SmoothPathOverlay from './PathOverlay';

interface GameBoardProps {
  currentGame: CurrentGameData;
  player: PlayerData;
  gameId?: string;
  noAnimation?: boolean;
  onValidWord: (word: string) => void;
}

function GameBoard({ currentGame, player, noAnimation, gameId, onValidWord }: GameBoardProps) {
  const options = useUser().user?.preferences as OptionsData;
  const [dragging, setDragging] = useState<boolean>(false);
  const [currentWord, setCurrentWord] = useState<string>('');
  const [touchedCells, setTouchedCells] = useState<CellObj[]>([]);
  const [wordValid, setWordValid] = useState<boolean>(false);
  const [wordStatus, setWordStatus] = useState<string>('invalid');
  const [game, setGame] = useState<CurrentGameData>(currentGame);
  const gameBoardRef = useRef<HTMLDivElement>(null);

  const boardDimensions = React.useMemo(() => ({
    width: game.dimensions.width,
    height: game.dimensions.height
  }), [game.dimensions.width, game.dimensions.height]);

  const cellRefs = React.useMemo(() =>
    Array(boardDimensions.height).fill(null).map(() =>
      Array(boardDimensions.width).fill(null).map(() => React.createRef<HTMLDivElement>())
    ), [boardDimensions]);

  useEffect(() => {
    requestAnimationFrame(() => {
      if (gameBoardRef.current) {
        gameBoardRef.current.classList.add(styles.showing);
      }
    });
  }, []);

  useEffect(() => {
    setGame(currentGame);
  }, [currentGame]);

  const isValidNeighbor = useCallback((cell1: CellObj, cell2: CellObj): boolean => {
    const rowDiff = Math.abs(cell1.row - cell2.row);
    const colDiff = Math.abs(cell1.col - cell2.col);
    return (rowDiff <= 1 && colDiff <= 1) && (rowDiff !== 0 || colDiff !== 0);
  }, []);

  const validateWord = useCallback((word: string) => {
    const alreadyFound = player.wordsFound.has(word);
    const wordExistsInPuzzle = new Set(currentGame.allWords).has(word);
    return {
      status: alreadyFound ? 'duplicate' : wordExistsInPuzzle ? 'valid' : 'invalid',
      isValid: !alreadyFound && wordExistsInPuzzle
    };
  }, [player.wordsFound, currentGame.allWords]);

  const handleCellTouchStart = useCallback((cell: CellObj) => {
    if (!dragging) return;
    setTouchedCells((prevTouchedCells) => {
      if (prevTouchedCells.find((c) => c.id === cell.id)) return prevTouchedCells;
      if (prevTouchedCells.length > 0 && !isValidNeighbor(cell, prevTouchedCells[prevTouchedCells.length - 1])) return prevTouchedCells;

      const newTouchedCells = [...prevTouchedCells, cell];
      const nextCurrentWord = newTouchedCells.map(c => c.letter).join('');
      setCurrentWord(nextCurrentWord);

      const { status, isValid } = validateWord(nextCurrentWord);
      setWordStatus(status);
      setWordValid(isValid);

      return newTouchedCells;
    });
  }, [dragging, isValidNeighbor, validateWord]);

  const handleCellHover = useCallback((clientX: number, clientY: number) => {
    if (!gameBoardRef.current || !dragging) return;

    const boardRect = gameBoardRef.current.getBoundingClientRect();
    const cellSize = boardRect.width / boardDimensions.width;
    
    // Calculate buffer size based on swipeBuffer option (0-100 to 0-50%)
    const bufferPercentage = touchedCells.length > 0 ? (options.gameplay.swipeBuffer / 150) / 2 : 0;
    
    console.log('bufferPercentage', bufferPercentage);
    const bufferSize = cellSize * bufferPercentage;

    const row = Math.floor((clientY - boardRect.top) / cellSize);
    const col = Math.floor((clientX - boardRect.left) / cellSize);

    if (row >= 0 && row < boardDimensions.height && col >= 0 && col < boardDimensions.width) {
      const cellTop = boardRect.top + row * cellSize + bufferSize;
      const cellBottom = boardRect.top + (row + 1) * cellSize - bufferSize;
      const cellLeft = boardRect.left + col * cellSize + bufferSize;
      const cellRight = boardRect.left + (col + 1) * cellSize - bufferSize;

      if (
        clientY >= cellTop && clientY <= cellBottom &&
        clientX >= cellLeft && clientX <= cellRight
      ) {
        const cellObj = {
          letter: game.letterMatrix[row][col],
          id: `${row}${col}`,
          row,
          col,
        };
        handleCellTouchStart(cellObj);
      }
    }
  }, [dragging, boardDimensions, game.letterMatrix, handleCellTouchStart]);

  const handleWordSubmit = useCallback(() => {
    if (wordValid) {
      onValidWord(currentWord);
    }
    setCurrentWord('');
    setTouchedCells([]);
    setWordValid(false);
    setWordStatus('invalid');
  }, [wordValid, currentWord, onValidWord]);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      const target = touch.target as HTMLElement;
      if (target.closest(`#game-board`)) {
        setDragging(true);
        handleCellHover(touch.clientX, touch.clientY);
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

    const handleMouseDown = (e: MouseEvent) => {
      if (e.target === gameBoardRef.current || gameBoardRef.current?.contains(e.target as Node)) {
        setDragging(true);
        handleCellHover(e.clientX, e.clientY);
      }
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

    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, handleCellHover, handleWordSubmit]);

  useEffect(() => {
    if (gameId) {
      const gameRef = ref(database, `/gameRooms/${gameId}/gameData`);
      const listener = onValue(gameRef, (snapshot) => {
        const data = snapshot.val();
        setGame(data);
      });
      console.warn(`STARTED game listener`);
      return () => {
        off(gameRef, 'value', listener);
        console.warn(`STOPPED game listener`);
      };
    }
  }, [gameId]);

  return (
    <div className={styles.gameArea}>
      {!noAnimation && <CurrentWordDisplay letters={currentWord.split('')} wordStatus={wordStatus} />}
      <div
        ref={gameBoardRef}
        id='game-board'
        className={styles.gameBoard}
        style={{
          gridTemplateColumns: `repeat(${boardDimensions.width}, 1fr)`,
          gridTemplateRows: `repeat(${boardDimensions.height}, 1fr)`,
          fontSize: `calc((var(--game-board-size) * 0.5) / ${boardDimensions.width})`,
          minWidth: `calc((var(--game-board-size) * 0.5) / ${boardDimensions.width})`,
          transition: noAnimation ? 'none' : 'scale 600ms ease, opacity 600ms ease',
          transitionDelay: noAnimation ? '0ms' : '300ms',
          zIndex: '0',
          borderRadius: `calc(var(--cube-roundness) / ${boardDimensions.height})`,
        }}
      >
        {game.letterMatrix.map((row, r) =>
          row.map((letter, l) => (
            <div
              key={`${letter}${r}${l}`}
              id={`${r}${l}`}
              ref={cellRefs[r][l]}
            >
              <BoardCell letter={letter} touched={touchedCells.some(c => c.id === `${r}${l}`)} wordStatus={wordStatus} />
            </div>
          ))
        )}
        <SmoothPathOverlay
          isSelecting={touchedCells.length > 0}
          cells={touchedCells}
          dimensions={boardDimensions}
          wordStatus={wordStatus}
        />
      </div>
    </div>
  );
}

export default React.memo(GameBoard);