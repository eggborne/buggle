import styles from './CreateScreen.module.css'
import { useState, useRef, useEffect } from 'react';
import { PuzzleData, BoardRequestData } from '../App.tsx';
import { ref, child, get } from "firebase/database";
import { database } from '../scripts/firebase.ts';
import PuzzleIcon from './PuzzleIcon.tsx';
import Modal from './Modal.tsx';


interface CreateScreenProps {
  handleClickPremadePuzzle: (puzzle: PuzzleData) => void;
  startCreatedPuzzlePreview: (options: BoardRequestData) => void;
}

function CreateScreen({ handleClickPremadePuzzle, startCreatedPuzzlePreview }: CreateScreenProps) {

  const [puzzleList, setPuzzleList] = useState<PuzzleData[]>([]);
  const [listShowing, setListShowing] = useState<boolean>(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleStartCreatedPuzzle = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const target = e.currentTarget as HTMLFormElement;
    const options: any = {
      dimensions: {
        width: parseInt((target.elements.namedItem('puzzleWidth') as HTMLInputElement).value, 10),
        height: parseInt((target.elements.namedItem('puzzleHeight') as HTMLInputElement).value, 10)
      },
      letterDistribution: (target.elements.namedItem('letterDistribution') as HTMLInputElement).value,
      totalWordLimits: {
        min: parseInt((target.elements.namedItem('minWords') as HTMLInputElement).value, 10),
        max: parseInt((target.elements.namedItem('maxWords') as HTMLInputElement).value, 10),
      },
      averageWordLengthFilter: {
        comparison: (target.elements.namedItem('averageWordLengthComparison') as HTMLInputElement).value,
        value: parseFloat((target.elements.namedItem('averageWordLengthValue') as HTMLInputElement).value),
      },
      wordLengthLimits: {},
    };
    console.warn('sending puzzle', options)
    startCreatedPuzzlePreview(options);
  }

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

  return (
    <main className={styles.CreateScreen}>
      <div className={styles.creationArea}>
        <h1>Create Puzzle</h1>
        <form ref={formRef} onSubmit={handleStartCreatedPuzzle}>
          <button type='submit' style={{ position: 'absolute', display: 'none' }}>submit</button>
          <div className={styles.puzzleOptions}>
            <label>
              <span>Letter distribution</span>
              <select id='letterDistribution' name='letterDistribution'>
                <option value='boggle'>Boggle®</option>
                <option value='scrabble'>Scrabble®</option>
                <option value='wordsWithFriends'>Words With Friends®</option>
                <option value='standardEnglish'>Standard English</option>
                <option value='modifiedEnglish'>Modified English</option>
                <option value='random'>True Random</option>
              </select>
            </label>
            <div className={styles.doubleInput}>
              <label>
                <span>Width</span>
                <input type='number' defaultValue='5' min='3' max='64' id='puzzleWidth' name='puzzleWidth' />
              </label>
              <label>
                <span>Height</span>
                <input type='number' defaultValue='5' min='3' max='64' id='puzzleHeight' name='puzzleHeight' />
              </label>
            </div>
            <div className={styles.doubleInput}>
              <h4>Total words</h4>
              <label>
                <span>Min</span>
                <input type='number' defaultValue='1' min='1' max='1000' id='minWords' name='minWords' />
              </label>
              <label>
                <span>Max</span>
                <input type='number' defaultValue='9999' min='2' max='9999' id='maxWords' name='maxWords' />
              </label>
            </div>
            <div className={styles.doubleInput} style={{ width: 'min-content', alignSelf: 'center' }}>
              <h4>Average Word Length</h4>
              <label>
                <select id='averageWordLengthComparison' name='averageWordLengthComparison'>
                  <option value='lessThan'>Less than</option>
                  <option selected value='moreThan'>More than</option>
                </select>
              </label>
              <label>
                <input type='number' step={'0.01'} defaultValue='0' min='0' max='9999' id='averageWordLengthValue' name='averageWordLengthValue' />
              </label>
            </div>
            {/* <div className={styles.doubleInput}>
              <h4>At least X words of length Y</h4>
              <label>
                <span>X</span>
                <input type='number' defaultValue='1' min='1' max='300' id='minRequiredWordAmount' name='minRequiredWordAmount' />
              </label>
              <label>
                <span>Y</span>
                <input type='number' defaultValue='3' min='3' max='16' id='requiredWordLength' name='requiredWordLength' />
              </label>
            </div> */}
          </div>
          <button type='submit' className={styles.start}>Generate puzzle</button>
        </form>
      </div >
      <div className={styles.puzzleListArea}>
        <button onClick={() => setListShowing(true)}>{'Show saved puzzles'}</button>
      </div>
      <Modal isOpen={listShowing} onClose={() => setListShowing(false)}>
        <h2>Saved puzzles</h2>
        <div className={styles.puzzleList}>
          {puzzleList.sort((a, b) => (a.dimensions.width * a.dimensions.height) - (b.dimensions.width * b.dimensions.height)).map((puzzle: PuzzleData) => {
            return (
              <div key={`${puzzle.dimensions.width}${puzzle.dimensions.width}${puzzle.letters}`} onClick={() => handleClickPremadePuzzle(puzzle)} className={styles.puzzleListing}>
                <div style={{ fontWeight: 'bold' }}>{puzzle.dimensions.width} x {puzzle.dimensions.height}</div>
                <PuzzleIcon size={{ ...puzzle.dimensions }} contents={puzzle.letters.split('')} />
                <div style={{ fontWeight: 'bold' }}>{[...puzzle.allWords].length}</div>
              </div>
            )
          })}
        </div>
      </Modal>
    </main >
  )
}

export default CreateScreen;