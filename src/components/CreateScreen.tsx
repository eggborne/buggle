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

const defaultValues = {
  dimensions: {
    width: 5,
    height: 5
  },
  letterDistribution: 'boggle',
  totalWordLimits: {
    min: 1,
    max: 9999,
  },
  averageWordLengthFilter: {
    comparison: 'moreThan',
    value: 0,
  },
  wordLengthLimits: {},
}

function CreateScreen({ handleClickPremadePuzzle, startCreatedPuzzlePreview }: CreateScreenProps) {
  const [puzzleList, setPuzzleList] = useState<PuzzleData[]>([]);
  const [optionsEnabled, setOptionsEnabled] = useState<Record<string, boolean>>({
    totalWordsOption: false,
    averageWordLengthOption: false,
  });
  const [listShowing, setListShowing] = useState<boolean>(false);
  const formRef = useRef<HTMLFormElement>(null);
  const widthInputRef = useRef<HTMLInputElement>(null);
  const heightInputRef = useRef<HTMLInputElement>(null);

  const handleStartCreatedPuzzle = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const target = e.currentTarget as HTMLFormElement;
    const options: BoardRequestData = {
      dimensions: {
        width: parseInt((target.elements.namedItem('puzzleWidth') as HTMLInputElement).value, 10) || defaultValues.dimensions.width,
        height: parseInt((target.elements.namedItem('puzzleHeight') as HTMLInputElement).value, 10) || defaultValues.dimensions.height
      },
      letterDistribution: (target.elements.namedItem('letterDistribution') as HTMLInputElement).value || defaultValues.letterDistribution,
      totalWordLimits: optionsEnabled['totalWordsOption'] ? {
        min: parseInt((target.elements.namedItem('minWords') as HTMLInputElement).value, 10),
        max: parseInt((target.elements.namedItem('maxWords') as HTMLInputElement).value, 10),
      } : defaultValues.totalWordLimits,
      averageWordLengthFilter: optionsEnabled['averageWordLengthOption'] ? {
        comparison: (target.elements.namedItem('averageWordLengthComparison') as HTMLInputElement).value,
        value: parseFloat((target.elements.namedItem('averageWordLengthValue') as HTMLInputElement).value),
      } : defaultValues.averageWordLengthFilter,
      wordLengthLimits: defaultValues.wordLengthLimits,
    };
    startCreatedPuzzlePreview(options);
  }

  const handleChangeSizeSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    const sliderValue = target.value;
    if (widthInputRef.current && heightInputRef.current) {
      widthInputRef.current.value = sliderValue.toString();
      heightInputRef.current.value = sliderValue.toString();
    }
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

  const handleClickCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    setOptionsEnabled((prevOptionsEnabled) => ({
      ...prevOptionsEnabled,
      [target.name]: !prevOptionsEnabled[target.name],
    }));
  };

  return (
    <main className={styles.CreateScreen}>
      <div className={styles.creationArea}>
        <h1>Create Puzzle</h1>
        <form ref={formRef} onSubmit={handleStartCreatedPuzzle}>
          <button type='submit' style={{ position: 'absolute', display: 'none' }}>submit</button>
          <div className={styles.puzzleOptions}>
            <div className={styles.mainSettings}>
              <label style={{ flexDirection: 'row', gap: '2rem'}}>
                <span>Letter distribution</span>
                <select defaultValue={defaultValues.letterDistribution} id='letterDistribution' name='letterDistribution'>
                  <option value='boggle'>Boggle®</option>
                  <option value='scrabble'>Scrabble®</option>
                  <option value='wordsWithFriends'>Words With Friends®</option>
                  <option value='standardEnglish'>Standard English</option>
                  <option value='modifiedEnglish'>Modified English</option>
                  <option value='random'>True Random</option>
                </select>
              </label>
              <div className={styles.dimensionsInputRow}>
                <label>
                  <span>Width</span>
                  <input ref={widthInputRef} type='number' defaultValue={defaultValues.dimensions.width} min='3' max='64' id='puzzleWidth' name='puzzleWidth' />
                </label>
                <label>
                  <span>Height</span>
                  <input ref={heightInputRef} type='number' defaultValue={defaultValues.dimensions.height} min='3' max='64' id='puzzleHeight' name='puzzleHeight' />
                </label>
                <input type='range' defaultValue={defaultValues.dimensions.width} onChange={handleChangeSizeSlider} min={3} max={9} step='1' />
              </div>
            </div>
            <div className={styles.optionalSettings}>
              <h2> Filters</h2>
              <div className={styles.optionalRow}>
                <input checked={optionsEnabled['totalWordsOption']} onChange={handleClickCheckbox} type='checkbox' id={'totalWordsOption'} name={'totalWordsOption'} />
                <div className={`${styles.optionalInputRow} ${optionsEnabled['totalWordsOption'] ? styles.active : styles.inactive}`}>
                  <h4>Total words</h4>
                  <label>
                    <span>Min</span>
                    <input disabled={!optionsEnabled['totalWordsOption']} type='number' defaultValue={defaultValues.totalWordLimits.min} min='1' max='1000' id='minWords' name='minWords' />
                  </label>
                  <label>
                    <span>Max</span>
                    <input disabled={!optionsEnabled['totalWordsOption']} type='number' defaultValue={defaultValues.totalWordLimits.max} min='2' max='9999' id='maxWords' name='maxWords' />
                  </label>
                </div>
              </div>
              <div className={styles.optionalRow}>
                <input checked={optionsEnabled['averageWordLengthOption']} onChange={handleClickCheckbox} type='checkbox' id={'averageWordLengthOption'} name={'averageWordLengthOption'} />
                <div className={styles.optionalInputRow}>
                  <h4>Average Word Length</h4>
                  <label>
                    <select disabled={!optionsEnabled['averageWordLengthOption']} defaultValue={defaultValues.averageWordLengthFilter.comparison} id='averageWordLengthComparison' name='averageWordLengthComparison'>
                      <option value='lessThan'>Less than</option>
                      <option value='moreThan'>More than</option>
                    </select>
                  </label>
                  <label>
                    <input disabled={!optionsEnabled['averageWordLengthOption']} type='number' step={'0.01'} defaultValue={defaultValues.averageWordLengthFilter.value} min='0' max={'9999'} id='averageWordLengthValue' name='averageWordLengthValue' />
                  </label>
                </div>
              </div>
            </div>
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