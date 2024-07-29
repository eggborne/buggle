import styles from './GameBoard.module.css'
import { off, onValue, ref } from 'firebase/database';
import { database } from '../../scripts/firebase';
import { CellObj, CurrentGameData, PlayerData, OptionsData } from '../../types/types';
import { useEffect, useRef, useState } from 'react';
import BoardCell from '../BoardCell';
import CurrentWordDisplay from '../CurrentWordDisplay';
import { useUser } from '../../context/UserContext';

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
  const [swapping, setSwapping] = useState<boolean>(false);
  const gameBoardRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    requestAnimationFrame(() => {
      if (gameBoardRef.current) {
        gameBoardRef.current.classList.add(styles.showing)
      }
    })
  }, [])

  useEffect(() => {
    setGame(currentGame);
  }, [currentGame])

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
    if (!boardRect) return;
    const cellBuffer = options.gameplay.swipeBuffer / 50;
    const cellSize = boardRect.width / currentGame.dimensions.width;
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
      row >= 0 && row < currentGame.letterMatrix.length &&
      col >= 0 && col < currentGame.letterMatrix[0].length
    ) {
      const id = `${row}${col}`;
      const cellObj = {
        letter: currentGame.letterMatrix[row][col],
        id,
        row,
        col,
      };
      handleCellTouchStart(cellObj);
    } else {
      handleCellTouchEnd();
    }
  };

  useEffect(() => {
    if (gameId) {
      const gameRef = ref(database, `/gameRooms/${gameId}/gameData`);
      const listener = onValue(gameRef, (snapshot) => {
        const data = snapshot.val();
        setGame(data);
      });
      console.warn(`STARTED game listener`)
      return () => {
        off(gameRef, 'value', listener);
        console.warn(`STOPPED game listener`)
      };
    }
  }, [gameId]);

  const handleWordSubmit = () => {
    if (wordValid) {
      onValidWord(currentWord);
    }
    setCurrentWord('');
    setTouchedCells([]);
    setWordValid(false);
    setWordStatus('invalid');
    clearPath();
  };

  const handleCellTouchStart = (cell: CellObj) => {
    if (!dragging) return;
    if (touchedCells.find((c) => c.id === cell.id)) return;
    if (touchedCells.length > 0 && !isValidNeighbor(cell, touchedCells[touchedCells.length - 1])) return;

    const nextCurrentWord = (currentWord + cell.letter);
    setTouchedCells((prevTouchedCells) => {
      const newTouchedCells = [...prevTouchedCells, cell];
      updatePath(newTouchedCells);
      return newTouchedCells;
    });
    setCurrentWord(nextCurrentWord);
    const alreadyFound = player.wordsFound.has(nextCurrentWord);
    const wordExistsInPuzzle = new Set(currentGame.allWords).has(nextCurrentWord);
    setWordStatus(alreadyFound ? 'duplicate' : wordExistsInPuzzle ? 'valid' : 'invalid');
    setWordValid(!alreadyFound && wordExistsInPuzzle);
  };

  const handleCellTouchEnd = () => {
    // No action needed here
  };

  const isValidNeighbor = (cell1: CellObj, cell2: CellObj): boolean => {
    const rowDiff = Math.abs(cell1.row - cell2.row);
    const colDiff = Math.abs(cell1.col - cell2.col);
    return rowDiff <= 1 && colDiff <= 1 && !(rowDiff === 0 && colDiff === 0);
  };

  const updatePath = (cells: CellObj[]) => {
    if (!svgRef.current) return;

    const cellSize = boardRect!.width / currentGame.dimensions.width;
    const svgContainer = svgRef.current;

    // Remove any existing animated segment
    const existingAnimatedSegment = svgContainer.querySelector(`.${styles.animatedSegment}`);
    if (existingAnimatedSegment) {
      existingAnimatedSegment.classList.remove(styles.animatedSegment);
    }

    // If there's a new segment to draw
    if (cells.length > 1) {
      const prevCell = cells[cells.length - 2];
      const currentCell = cells[cells.length - 1];

      const x1 = (prevCell.col + 0.5) * cellSize;
      const y1 = (prevCell.row + 0.5) * cellSize;
      const x2 = (currentCell.col + 0.5) * cellSize;
      const y2 = (currentCell.row + 0.5) * cellSize;

      const newSegment = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      newSegment.setAttribute('x1', x1.toString());
      newSegment.setAttribute('y1', y1.toString());
      newSegment.setAttribute('x2', x2.toString());
      newSegment.setAttribute('y2', y2.toString());
      newSegment.classList.add(styles.pathSegment, styles.animatedSegment);

      svgContainer.appendChild(newSegment);
    }
  };

  const clearPath = () => {
    if (!svgRef.current) return;
    while (svgRef.current.firstChild) {
      svgRef.current.removeChild(svgRef.current.firstChild);
    }
    console.log('Path cleared');
  };

  return (
    <div className={styles.gameArea}>
      {!noAnimation && <CurrentWordDisplay letters={currentWord.split('')} wordStatus={wordStatus} />}
      <div
        ref={gameBoardRef}
        id='game-board'
        className={styles.gameBoard}
        style={{
          gridTemplateColumns: `repeat(${game.dimensions.width}, 1fr)`,
          gridTemplateRows: `repeat(${game.dimensions.height}, 1fr)`,
          fontSize: `calc((var(--game-board-size) * 0.5) / ${game.dimensions.width})`,
          minWidth: `calc((var(--game-board-size) * 0.5) / ${game.dimensions.width})`,
          transition: noAnimation ? 'opacity 600ms ease' : 'scale 600ms ease, opacity 600ms ease',
          transitionDelay: noAnimation ? '0ms' : '300ms',
          zIndex: '0'
          // borderRadius: `calc(var(--cube-roundness) / ${game.dimensions.height})`,
          // position: 'relative',
        }}
      >
        {currentGame.letterMatrix.map((row, r) =>
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
        <svg
          ref={svgRef}
          className={`${styles.pathOverlay} ${styles[wordStatus]}`}
          
        />
      </div>
    </div>
  )
}

export default GameBoard;