import { useState, useRef } from 'react'
import styles from './SelectScreen.module.css'
import { fetchRandomPuzzle } from '../../scripts/firebase';
import { CurrentGameData, GameOptions, StoredPuzzleData, UserData } from '../../types/types';
// import PuzzleIcon from '../PuzzleIcon'
import Modal from '../Modal';
import StoredPuzzleList from '../StoredPuzzleList';
import { useFirebase } from '../../context/FirebaseContext';
import { useUser } from '../../context/UserContext';
import { stringTo2DArray, decodeMatrix, updateLetterLists } from '../../scripts/util';
import { difficulties } from '../../config.json';

interface SelectScreenProps {
  hidden: boolean;
}

function SelectScreen({ hidden }: SelectScreenProps) {
  const { user, changePhase, setUser } = useUser();
  const { startNewGame } = useFirebase();
  // const [sizeSelected, setSizeSelected] = useState<number>(4);
  const [listShowing, setListShowing] = useState<boolean>(false);
  const formRef = useRef<HTMLFormElement>(null);

  const getRandomPuzzleWithOptions = async (newGameOptions: GameOptions): Promise<CurrentGameData | null> => {
    console.log('user is', user)
    const seenPuzzles = user?.seenPuzzles || [];
    const fetchedPuzzle = await fetchRandomPuzzle(newGameOptions, seenPuzzles);
    if (user) {
      const newUser: UserData = {
        ...user,
        seenPuzzles: [
          ...(user.seenPuzzles ?? []),
          ...(fetchedPuzzle ? [fetchedPuzzle.letterMatrix.flat().join('')] : [])
        ]
      }
      setUser(newUser);
    }
    if (!fetchedPuzzle) return null;
    const newGameData: CurrentGameData = {
      ...fetchedPuzzle,
      allWords: Array.from(fetchedPuzzle.allWords),
      startTime: Date.now(),
      endTime: Date.now() + (newGameOptions.timeLimit * 1000),
      timeLimit: newGameOptions.timeLimit,
    }
    return newGameData;
  };

  const handleClickStartRandomGame = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const target = e.currentTarget as HTMLFormElement;
    const difficultyIndex = Number((target.elements.namedItem('difficulty') as HTMLSelectElement).value);
    const difficulty = Object.keys(difficulties)[4 - difficultyIndex];
    console.log('difficulty', difficulty)
    const newGameOptions: GameOptions = {
      difficulty,
      dimensions: {
        // width: sizeSelected,
        // height: sizeSelected
        width: 4,
        height: 4
      },
      timeLimit: Number((target.elements.namedItem('timeLimit') as HTMLSelectElement).value),
      wordBonus: Number((target.elements.namedItem('wordBonus') as HTMLSelectElement).value),
    };
    const newGameData = await getRandomPuzzleWithOptions(newGameOptions);
    if (!newGameData) return;
    newGameData.playerProgress = {
      [user.uid]: {
        attackPoints: 0,
        foundOpponentWords: {},
        uid: user.uid,
        score: 0,
        touchedCells: [],
      },
    };
    newGameData.wordBonus = 5;
    await startNewGame(newGameData);
    changePhase('game');
  }

  const handleClickStoredPuzzle = async (puzzle: StoredPuzzleData) => {
    if (!user) return;
    const nextMatrix = stringTo2DArray(puzzle.letterString, puzzle.dimensions.width, puzzle.dimensions.height);
    const newGameData = {
      ...puzzle,
      allWords: new Set(puzzle.allWords),
      letterMatrix: decodeMatrix(nextMatrix, puzzle.metadata.key),
      playerProgress: {
        [user.uid]: {
          attackPoints: 0,
          foundOpponentWords: {},
          uid: user.uid,
          score: 0,
          touchedCells: [],
        },
      },
      gameOver: false,
      startTime: Date.now(),
      endTime: Date.now() + (600 * 1000),
      timeLimit: 600,
      wordBonus: 5,
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
        {/* <form ref={formRef} onSubmit={handleClickStartRandomGame}> */}
        <form ref={formRef} onSubmit={handleClickStartRandomGame}>
          <button type='submit' style={{ position: 'absolute', display: 'none' }}>submit</button>
          <div className={styles.puzzleOptions}>
            {/* <div className={styles.sizeSelect}>
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
            </div> */}
            <div className={`button-group ${styles.timeSelectRow}`}>
              <span>Word amount</span>
              {/* <select name='difficulty'>
                <option value='easy'>Easy</option>
                <option value='medium'>Medium</option>
                <option value='hard'>Hard</option>
              </select> */}
              <input type='range' name='difficulty' max='4' defaultValue='4'></input>
            </div>
            <div className={`button-group row ${styles.timeSelectRow}`}>
              <span>Max time</span>
              <select name='timeLimit' defaultValue='30'>
                <option value='5'>5 seconds</option>
                <option value='10'>10 seconds</option>
                <option value='30'>30 seconds</option>
                <option value='120'>2 minutes</option>
              </select>
            </div>
            <div className={`button-group row ${styles.timeSelectRow}`}>
              <span>Word bonus</span>
              <select name='wordBonus' defaultValue='5'>
                <option value='5'>5 seconds</option>
                {/* <option value='pointValue'>Boggle® value</option> */}
                {/* <option value='pointValue'>Scrabble® value</option> */}
              </select>
            </div>
          </div>
        </form>
        <button onClick={handleSubmitPuzzleOptions} className={styles.start}>Start!</button>
      </div>
      {process.env.NODE_ENV === 'development' && <button onClick={() => setListShowing(true)}>{'Show saved puzzles'}</button>}
      {process.env.NODE_ENV === 'development' && <button onClick={async () => {
        console.warn('clicked update puzzles')
        updateLetterLists();
      }}>{'Update puzzles'}</button>}
      <Modal isOpen={listShowing} onClose={() => setListShowing(false)}>
        <>
          <h2>Saved puzzles</h2>
          <StoredPuzzleList showing={listShowing} onClickStoredPuzzle={async (e) => {
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