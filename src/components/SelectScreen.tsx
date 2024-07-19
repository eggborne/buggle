import { useState, useRef, useEffect } from 'react'
import styles from './SelectScreen.module.css'
import { ref, child, get } from "firebase/database";
import { database } from '../scripts/firebase.ts';
import { Difficulty, SinglePlayerOptions, StoredPuzzleData } from '../App';
import PuzzleIcon from './PuzzleIcon'
import Modal from './Modal';
import StoredPuzzleList from './StoredPuzzleList';

interface SelectScreenProps {
  hidden: boolean;
  startSinglePlayerGame: (options: SinglePlayerOptions) => void;
  handleClickPremadePuzzle: (puzzle: StoredPuzzleData) => void;
}

function SelectScreen({ hidden, startSinglePlayerGame, handleClickPremadePuzzle }: SelectScreenProps) {
  const [sizeSelected, setSizeSelected] = useState<number>(5);
  const [puzzleList, setPuzzleList] = useState<StoredPuzzleData[]>([]);
  const [listShowing, setListShowing] = useState<boolean>(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const getPuzzles = async () => {
      const dbRef = ref(database);
      get(child(dbRef, `puzzles/`)).then((snapshot) => {
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

  const handleStartSinglePlayer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const target = e.currentTarget as HTMLFormElement;
    const options: SinglePlayerOptions = {
      dimensions: {
        width: sizeSelected,
        height: sizeSelected
      },
      difficulty: (target.elements.namedItem('difficulty') as HTMLSelectElement).value as Difficulty
    };
    startSinglePlayerGame(options);
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
        <form ref={formRef} onSubmit={handleStartSinglePlayer}>
          <button type='submit' style={{ position: 'absolute', display: 'none' }}>submit</button>
          <div className={styles.puzzleOptions}>
            <div className={styles.sizeSelect}>
              <div className={styles.sizeSelections}>
                <span style={{ borderColor: sizeSelected === 4 ? '#8f8' : 'transparent' }} onClick={() => setSizeSelected(4)}><PuzzleIcon iconSize={'4.5rem'} size={{ width: 4, height: 4 }} contents={[]} /></span>
                <span style={{ borderColor: sizeSelected === 5 ? '#8f8' : 'transparent' }} onClick={() => setSizeSelected(5)}><PuzzleIcon iconSize={'4.5rem'} size={{ width: 5, height: 5 }} contents={[]} /></span>
                <span style={{ borderColor: sizeSelected === 6 ? '#8f8' : 'transparent' }} onClick={() => setSizeSelected(6)}><PuzzleIcon iconSize={'4.5rem'} size={{ width: 6, height: 6 }} contents={[]} /></span>
              </div>
            </div>
            <select name='difficulty'>
              <option value='easy'>Easy</option>
              <option value='medium'>Medium</option>
              <option value='hard'>Hard</option>
            </select>
          </div>
        </form>
        <button onClick={handleSubmitPuzzleOptions} className={styles.start}>Start!</button>
      </div>
      <button onClick={() => setListShowing(true)}>{'Show saved puzzles'}</button>
      <Modal isOpen={listShowing} onClose={() => setListShowing(false)}>
        <>
          <h2>Saved puzzles </h2>
          <StoredPuzzleList list={puzzleList} onClickPremadePuzzle={handleClickPremadePuzzle} />
        </>
      </Modal>
    </main>
  )
}

export default SelectScreen;