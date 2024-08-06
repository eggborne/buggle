import styles from './GameBoard.module.css'
import { CellObj, CurrentGameData, UserData } from '../../types/types';
import { useEffect, useRef, useState } from 'react';
import BoardCell from '../BoardCell';
import CurrentWordDisplay from '../CurrentWordDisplay';
import { useUser } from '../../context/UserContext';
import SmoothPathOverlay from './PathOverlay';
import { useFirebase } from '../../context/FirebaseContext';
// import BeeSwarm from './BeeSwarm'

interface GameBoardProps {
  opponentData: UserData | null;
  fillerData?: CurrentGameData;
  noAnimation?: boolean;
}

function GameBoard({ opponentData, fillerData, noAnimation }: GameBoardProps) {
  const { user } = useUser();
  const options = user?.preferences;
  let { currentMatch, setPlayerTouchedCells, submitWord } = useFirebase();
  if (fillerData) {
    currentMatch = fillerData;
  }
  const [dragging, setDragging] = useState<boolean>(false);
  const [currentWord, setCurrentWord] = useState<string>('');
  const [touchedCells, setTouchedCells] = useState<CellObj[]>([]);
  const [wordValid, setWordValid] = useState<boolean>(false);
  const [wordStatus, setWordStatus] = useState<string>('invalid');
  const gameBoardRef = useRef<HTMLDivElement>(null);

  console.log(wordValid);

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

    const gameBoardElement = gameBoardRef.current;
    if (gameBoardElement) {
      gameBoardElement.addEventListener('touchstart', handleTouchStart, { passive: false });
      gameBoardElement.addEventListener('touchmove', handleTouchMove, { passive: false });
      gameBoardElement.addEventListener('touchend', handleTouchEnd);
      gameBoardElement.addEventListener('mousedown', () => setDragging(true));
      gameBoardElement.addEventListener('mousemove', handleMouseMove);
      gameBoardElement.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      if (gameBoardElement) {
        gameBoardElement.removeEventListener('touchstart', handleTouchStart);
        gameBoardElement.removeEventListener('touchmove', handleTouchMove);
        gameBoardElement.removeEventListener('touchend', handleTouchEnd);
        gameBoardElement.removeEventListener('mousedown', () => setDragging(true));
        gameBoardElement.removeEventListener('mousemove', handleMouseMove);
        gameBoardElement.removeEventListener('mouseup', handleMouseUp);
      }
    };
  }, [dragging, touchedCells, handleWordSubmit]);

  useEffect(() => {
    if (currentWord && currentMatch && user) {
      setWordValidity(currentWord);
    }
  }, [currentMatch, wordStatus, dragging, currentWord]);

  useEffect(() => {
    if (user && opponentData) {
      setPlayerTouchedCells(user.uid, touchedCells);
    }
  }, [touchedCells]);

  const setWordValidity = (word: string) => {
    if (!currentMatch) return;
    if (currentMatch && user && currentMatch.foundWordsRecord) {
      const wordClaimStatus = currentMatch.foundWordsRecord[word.toLowerCase()];
      const alreadyFound = wordClaimStatus === user.uid;
      const opponentAlreadyFound = opponentData ? wordClaimStatus === opponentData.uid : false;
      const wordExistsInPuzzle = new Set(currentMatch.allWords).has(word);
      let newStatus = 'invalid';
      if (opponentAlreadyFound) {
        const behind = currentMatch.playerProgress[user.uid].score < currentMatch.playerProgress[(opponentData || user).uid].score;
        if (behind && (!currentMatch.playerProgress[user.uid].foundOpponentWords || !currentMatch.playerProgress[user.uid].foundOpponentWords[word])) {
          newStatus = 'redeemable';
        } else {
          newStatus = 'opponentFound';
        }
      } else if (alreadyFound) {
        newStatus = 'duplicate';
      } else if (wordExistsInPuzzle) {
        const isSpecialWord = currentMatch.specialWords?.includes(word);
        newStatus = isSpecialWord? 'special' : 'valid';
      }

      setWordStatus(newStatus);
      setWordValid(!alreadyFound && !opponentAlreadyFound && wordExistsInPuzzle);
    }
  }

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
      if (touchedCells.find((c) => c.id === id)) return;
      handleCellTouchStart(cellObj);
    } else {
      handleCellTouchEnd();
    }
  };

  const isValidNeighbor = (cell1: CellObj, cell2: CellObj): boolean => {
    const rowDiff = Math.abs(cell1.row - cell2.row);
    const colDiff = Math.abs(cell1.col - cell2.col);
    return rowDiff <= 1 && colDiff <= 1 && !(rowDiff === 0 && colDiff === 0);
  };

  const handleCellTouchStart = (cell: CellObj) => {
    if (!dragging) return;
    if (touchedCells.find((c) => c.id === cell.id)) return;
    if (touchedCells.length > 0 && !isValidNeighbor(cell, touchedCells[touchedCells.length - 1])) return;
    const nextCurrentWord = currentWord + cell.letter;
    setTouchedCells((prevTouchedCells) => [...prevTouchedCells, cell]);
    setCurrentWord(nextCurrentWord);
    setWordValidity(nextCurrentWord);
  };

  const handleCellTouchEnd = () => {
    // No action needed here?
  };

  async function handleWordSubmit() {
    if (user) {
      submitWord(user.uid, currentWord.toLowerCase(), wordStatus);
    }
    setCurrentWord('');
    setTouchedCells([]);
    setWordValid(false);
    setWordStatus('invalid');
  };

  const opponentTouchedCells = opponentData && currentMatch?.playerProgress[opponentData?.uid]?.touchedCells || undefined;

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
              <BoardCell
                letter={letter}
                opponentTouching={opponentTouchedCells && opponentTouchedCells.some(c => c.id === `${r}${l}`) || undefined
                }
                touched={touchedCells.some(c => c.id === `${r}${l}`)}
                wordStatus={wordStatus}
              />
            </div>
          ))
        )}
        <SmoothPathOverlay
          isSelecting={touchedCells.length > 0}
          cells={touchedCells}
          dimensions={currentMatch?.dimensions || { width: 5, height: 5 }}
          wordStatus={wordStatus}
        />
      </div>
      {/* {gameBoardRef.current &&
        <BeeSwarm
          gameBoardElement={gameBoardRef.current}
          gameWidth={currentMatch?.dimensions.width || 5}
          width={window.innerWidth}
          height={window.innerHeight}
          swarmSize={24}
        />
      } */}
    </div>
  )
}

export default GameBoard;