import styles from './GameBoard.module.css'
import { CellObj, CurrentGameData, DefaultPowerupData, DeployedPowerupData, UserData } from '../../types/types';
import { lazy, useEffect, useRef, useState } from 'react';
import BoardCell from '../BoardCell';
import CurrentWordDisplay from '../CurrentWordDisplay';
import { useUser } from '../../context/UserContext';
import SmoothPathOverlay from './PathOverlay';
import { useFirebase } from '../../context/FirebaseContext';
import { triggerShowMessage } from '../../hooks/useMessageBanner';
import LoadingDisplay from '../LoadingDisplay';
import Modal from '../Modal';
import { powers } from '../../config.json';

import BeeSwarm from './BeeSwarm';
// const BeeSwarm = lazy(() => import('./BeeSwarm'));


interface GameBoardProps {
  currentEffects: {
    user: DeployedPowerupData[] | [],
    opponent?: DeployedPowerupData[] | [],
  } | null;
  opponentData: UserData | null;
  fillerData?: CurrentGameData;
  noAnimation?: boolean;
}

function GameBoard({ currentEffects, opponentData, fillerData, noAnimation }: GameBoardProps) {
  const { user, changePhase } = useUser();
  const options = user?.preferences;
  const { setPlayerTouchedCells, addAvailablePower, setPlayerReady, submitWord } = useFirebase();
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
    if (currentMatch && !currentMatch.id) {
      requestAnimationFrame(() => {
        if (user && user.uid && gameBoardRef.current) {
          gameBoardRef.current.classList.add(styles.showing);
        }
      });
    }
  }, [])

  useEffect(() => {
    if (user && user.uid && gameBoardRef.current && currentMatch) {
      if (currentMatch.id) {
        // set ready if not ready
        if (!currentMatch.playerProgress[user.uid].ready) {
          setPlayerReady(user.uid);
        }
        // show board if both players ready and board not showing
        const opponentProgress = currentMatch.playerProgress[opponentData?.uid || user.uid];
        if (opponentProgress.ready && !gameBoardRef.current.classList.contains(styles.showing)) {
          requestAnimationFrame(() => {
            if (gameBoardRef.current) {
              gameBoardRef.current.classList.add(styles.showing);
            }
          });
        }
        // check if attackPoints are enough to activate any powers
        const gamePowers = powers as Record<string, DefaultPowerupData>;
        for (const power in gamePowers) {
          const playerProgress = currentMatch.playerProgress[user.uid];
          if (power) {
            if (playerProgress.attackPoints >= gamePowers[power].cost) {
              if (!playerProgress.availablePowers || !Object.values(playerProgress.availablePowers).find(p => p.type === power)) {
                const newPower = { ...gamePowers[power], activatedBy: user.uid };
                addAvailablePower(user.uid, newPower);
              }
            }
          }
        }
      }

      // check for gameOver
      if (currentMatch.gameOver) {
        triggerShowMessage(`Game over!`);
        gameBoardRef.current && gameBoardRef.current.classList.remove(styles.showing)
      }
    }
  }, [currentMatch]);

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
  }, [currentWord]);

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
        newStatus = isSpecialWord ? 'special' : 'valid';
      }

      setWordStatus(newStatus);
      setWordValid(newStatus === 'valid' || newStatus === 'redeemable' || newStatus === 'special');
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
    if (user && wordValid) {
      submitWord(user.uid, currentWord.toLowerCase(), wordStatus);
    }
    setCurrentWord('');
    setTouchedCells([]);
    setWordValid(false);
    setWordStatus('invalid');
  }

  const opponentTouchedCells = opponentData && currentMatch?.playerProgress[opponentData?.uid]?.touchedCells || undefined;

  const activeBees = currentEffects?.user.find(e => e.type === 'bees');
  // const activeBees = powers.bees;

  return (
    <div className={styles.gameArea}>
      <Modal
        isOpen={currentMatch?.gameOver || false}
        className={styles.CloseModal}
        noCloseButton
        onClose={() => null}
      >
        <h1>GAME OVER</h1>
        <div className={styles.resultsBody}>
          {user && opponentData ?
            <div>multiplayer results yo</div>
            :
            currentMatch && user && user.uid && <>
              <div>{Object.entries(currentMatch?.foundWordsRecord || {})
                .filter(([_key, value]) => value === user.uid)
                .map(([key, _value]) => key).length} words found</div>
              <div>Score: {currentMatch?.playerProgress[user?.uid || '']?.score || 0}</div>
            </>
          }
        </div>
        <div className={'button-group'}>
          <button className={'start'} onClick={() => changePhase('title')}>OK</button>
        </div>
      </Modal>
      {!noAnimation && <CurrentWordDisplay letters={currentWord.split('')} wordStatus={wordStatus} />}
      {(currentMatch && opponentData && !currentMatch.playerProgress[opponentData?.uid].ready) &&
        <div className={styles.waitingPlaceholder}>
          <p>Waiting for {opponentData?.displayName} to join...</p>
          <LoadingDisplay />
        </div>
      }
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
      {gameBoardRef.current &&
        !!(currentEffects && currentEffects.user.length) &&
        activeBees &&
        <BeeSwarm
          gameBoardElement={gameBoardRef.current}
          gameWidth={currentMatch?.dimensions.width || 5}
          powerupObj={activeBees}
          // powerupObj={{
          //   ...activeBees,
          //   category: 'curses',
          //   activatedBy: user?.uid || '',
          //   activatedAt: Date.now(),
          //   target: opponentData?.uid || ''
          // }}
          swarmSize={(Math.pow((currentMatch?.dimensions.width || 5), 2)) * 2.5}
        />
      }
    </div>
  )
}

export default GameBoard;