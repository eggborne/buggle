import { useState, useRef, useEffect } from 'react'
import styles from './SelectScreen.module.css'
import { ref, child, get } from "firebase/database";
import { database, fetchRandomPuzzle } from '../../scripts/firebase';
import { CurrentGameData, GameOptions, StoredPuzzleData } from '../../types/types';
import PuzzleIcon from '../PuzzleIcon'
import Modal from '../Modal';
import StoredPuzzleList from '../StoredPuzzleList';
import { useFirebase } from '../../context/FirebaseContext';
import { useUser } from '../../context/UserContext';
import { stringTo2DArray, decodeMatrix } from '../../scripts/util';

interface SelectScreenProps {
  hidden: boolean;
}

function SelectScreen({ hidden }: SelectScreenProps) {
  const { user, changePhase } = useUser();
  const { startNewGame } = useFirebase();
  const [sizeSelected, setSizeSelected] = useState<number>(5);
  const [puzzleList, setPuzzleList] = useState<StoredPuzzleData[]>([]);
  const [listShowing, setListShowing] = useState<boolean>(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const getPuzzles = async () => {
      get(child(ref(database), `puzzles/`)).then((snapshot) => {
        if (snapshot.exists()) {
          const nextPuzzleList = snapshot.val();
          setPuzzleList(Object.values(nextPuzzleList));
        } else {
          console.log("No data available");
        }
      }).catch((error) => {
        console.error(error);
      });
    }
    getPuzzles();
  }, []);

  const getRandomPuzzleWithOptions = async (newGameOptions: GameOptions): Promise<CurrentGameData> => {
    const fetchedPuzzle = await fetchRandomPuzzle(newGameOptions);
    const newGameData: CurrentGameData = {
      ...newGameOptions,
      ...fetchedPuzzle,
      allWords: Array.from(fetchedPuzzle.allWords),
    }
    return newGameData;
  };

  const handleClickStartRandomGame = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const target = e.currentTarget as HTMLFormElement;
    const newGameOptions: GameOptions = {
      difficulty: (target.elements.namedItem('difficulty') as HTMLSelectElement).value,
      dimensions: {
        width: sizeSelected,
        height: sizeSelected
      },
      timeLimit: parseInt((target.elements.namedItem('timeLimit') as HTMLSelectElement).value),
    };
    const newGameData = await getRandomPuzzleWithOptions(newGameOptions);
    newGameData.playerProgress = {
      [user.uid]: {
        uid: user.uid,
        score: 0,
        foundWords: [],
      },
    };
    await startNewGame(newGameData);
    changePhase('game');
  }

  const handleClickStoredPuzzle = async (puzzle: StoredPuzzleData) => {
    if (!user) return;
    const nextMatrix = stringTo2DArray(puzzle.letterString, puzzle.dimensions.width, puzzle.dimensions.height);
    const newGameData = {
      allWords: new Set(puzzle.allWords),
      letterMatrix: decodeMatrix(nextMatrix, puzzle.metadata.key),
      dimensions: {
        width: puzzle.dimensions.width,
        height: puzzle.dimensions.height,
      },
      metadata: puzzle.metadata,
      playerProgress: {
        [user.uid]: {
          uid: user.uid,
          score: 0,
          foundWords: [],
        },
      }
    }
    await startNewGame(newGameData);
    changePhase('game');
  }

  const handleSubmitPuzzleOptions = () => {
    if (formRef.current) {
      const submitButton = formRef.current.querySelector('button[type="submit"]') as HTMLButtonElement | null;
      if (submitButton) {
        submitButton.click();
      }
    }
  };

  const selectScreenClass = `${styles.SelectScreen}${hidden ? ' hidden' : ''}`;
  return (
    <main className={selectScreenClass}>
      <div className='button-group'>
        <form ref={formRef} onSubmit={handleClickStartRandomGame}>
          <button type='submit' style={{ position: 'absolute', display: 'none' }}>submit</button>
          <div className={styles.puzzleOptions}>
            <div className={styles.sizeSelect}>
              <div className={styles.sizeSelections}>
                <span style={{ borderColor: sizeSelected === 4 ? '#8f8' : 'transparent' }} onClick={() => setSizeSelected(4)}><PuzzleIcon iconSize={{
                  width: `4.5rem`,
                  height: `4.5rem`
                }} puzzleDimensions={{ width: 4, height: 4 }} contents={[]} /></span>
                <span style={{ borderColor: sizeSelected === 5 ? '#8f8' : 'transparent' }} onClick={() => setSizeSelected(5)}><PuzzleIcon iconSize={{
                  width: `4.5rem`,
                  height: `4.5rem`
                }} puzzleDimensions={{ width: 5, height: 5 }} contents={[]} /></span>
                <span style={{ borderColor: sizeSelected === 6 ? '#8f8' : 'transparent' }} onClick={() => setSizeSelected(6)}><PuzzleIcon iconSize={{
                  width: `4.5rem`,
                  height: `4.5rem`
                }} puzzleDimensions={{ width: 6, height: 6 }} contents={[]} /></span>
              </div>
            </div>
            <div className='button-group row'>
              <select name='difficulty'>
                <option value='easy'>Easy</option>
                <option value='medium'>Medium</option>
                <option value='hard'>Hard</option>
              </select>
              <select name='timeLimit'>
                <option value='60'>1 minute</option>
                <option value='180'>3 minutes</option>
                <option value='300'>5 minutes</option>
              </select>
            </div>
          </div>
        </form>
        <button onClick={handleSubmitPuzzleOptions} className={styles.start}>Start!</button>
      </div>
      <button onClick={() => setListShowing(true)}>{'Show saved puzzles'}</button>
      <Modal isOpen={listShowing} onClose={() => setListShowing(false)}>
        <>
          <h2>Saved puzzles</h2>
          <StoredPuzzleList list={puzzleList} onClickStoredPuzzle={async (e) => {
            handleClickStoredPuzzle(e);
            if (listShowing) {
              setListShowing(false);
            }
          }} />
        </>
      </Modal>
    </main>
  )
}

export default SelectScreen;