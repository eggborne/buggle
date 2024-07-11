import styles from './AdminScreen.module.css'
import { useState, useRef, useEffect } from 'react';
import { PuzzleData, CreatePuzzleOptions, SinglePlayerOptions } from '../App';
import { ref, child, get } from "firebase/database";
import { database } from '../scripts/firebase';
import { stringTo2DArray } from '../scripts/util';
import Modal from './Modal';
import { createDictionary } from '../scripts/generate.ts';


interface AdminScreenProps {
  handleClickPremadePuzzle: (puzzle: PuzzleData) => void;
  startSinglePlayerGame: (options: SinglePlayerOptions) => void;
  startCreatedPuzzlePreview: (options: CreatePuzzleOptions) => void;
  onBuildDictionary: () => void;
  dictionaryBuilt: boolean;
}

function AdminScreen({ handleClickPremadePuzzle, startCreatedPuzzlePreview, onBuildDictionary, dictionaryBuilt }: AdminScreenProps) {

  const [puzzleList, setPuzzleList] = useState<PuzzleData[]>([]);
  const [listShowing, setListShowing] = useState<boolean>(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleStartCreatedPuzzle = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const target = e.currentTarget as HTMLFormElement;
    const options: CreatePuzzleOptions = {
      puzzleSize: {
        width: parseInt((target.elements.namedItem('puzzleWidth') as HTMLInputElement).value, 10),
        height: parseInt((target.elements.namedItem('puzzleHeight') as HTMLInputElement).value, 10)
      },
      minimumWordAmount: parseInt((target.elements.namedItem('minWords') as HTMLInputElement).value, 10),
      maximumPathLength: parseInt((target.elements.namedItem('maxPathLength') as HTMLInputElement).value, 10),
      letterDistribution: (target.elements.namedItem('letterDistribution') as HTMLInputElement).value,
      lengthRequirements: [{
        minRequiredWordAmount:parseInt( (target.elements.namedItem('minRequiredWordAmount') as HTMLInputElement).value),
        requiredWordLength: parseInt((target.elements.namedItem('requiredWordLength') as HTMLInputElement).value)
      }],
    };
    startCreatedPuzzlePreview(options);
  }

  useEffect(() => {
    const checkForDictionary = async () => {
      if (!dictionaryBuilt) {
        await createDictionary();
        onBuildDictionary();
      }
    }
    checkForDictionary();
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
    <main className={styles.AdminScreen}>
      <div className={styles.creationArea}>
        <h1>Create Puzzle</h1>
        <form ref={formRef} onSubmit={handleStartCreatedPuzzle}>
          <button type='submit' style={{ position: 'absolute', display: 'none' }}>submit</button>
          <div className={styles.puzzleOptions}>
            <label>
              <span>Letter distribution</span>
              <select id='letterDistribution' name='letterDistribution'>
                <option value='boggle'>Boggle</option>
                <option value='standard'>Standard</option>
              </select>
            </label>
            <label>
              <span>Width</span>
              <input type='number' defaultValue='5' min='3' max='16' id='puzzleWidth' name='puzzleWidth' />
            </label>
            <label>
              <span>Height</span>
              <input type='number' defaultValue='5' min='3' max='16' id='puzzleHeight' name='puzzleHeight' />
            </label>
            <label>
              <span>Min. Words</span>
              <input type='number' defaultValue='50' min='1' max='1000' id='minWords' name='minWords' />
            </label>
            <label>
              <span>Max. path length</span>
              <input type='number' defaultValue='10' min='3' max='36' id='maxPathLength' name='maxPathLength' />
            </label>
            <div className={styles.doubleInput}>
              <label>
                <span>at least</span>
                <input type='number' defaultValue='10' min='1' max='300' id='minRequiredWordAmount' name='minRequiredWordAmount' />
              </label>
              <label>
                <span>of length</span>
                <input type='number' defaultValue='5' min='3' max='16' id='requiredWordLength' name='requiredWordLength' />
              </label>
            </div>
          </div>
          <button disabled={!dictionaryBuilt} type='submit' className={styles.start}>{dictionaryBuilt ? 'Preview puzzle (takes a minute)' : 'Building dictionary...'}</button>
        </form>
      </div >
      <div className={styles.puzzleListArea}>
        <button onClick={() => setListShowing(true)}>{'Show saved puzzles'}</button>
      </div>
      <Modal isOpen={listShowing} onClose={() => setListShowing(false)}>
        <h2>Saved puzzles</h2>
        <div className={styles.puzzleList}>
          {puzzleList.sort((a, b) => (a.gridSize.width * a.gridSize.height) - (b.gridSize.width * b.gridSize.height)).map((puzzle: PuzzleData) => {
            const matrix = stringTo2DArray(puzzle.letters, puzzle.gridSize.width, puzzle.gridSize.height);
            return (
              <div key={`${puzzle.gridSize.width}${puzzle.gridSize.width}${puzzle.letters}`} onClick={() => handleClickPremadePuzzle(puzzle)} className={styles.puzzleListing}>
                <div style={{ fontWeight: 'bold' }}>{puzzle.gridSize.width} x {puzzle.gridSize.height}</div>
                <div
                  className={styles.miniPuzzle}
                  style={{
                    'gridTemplateColumns': `repeat(${puzzle.gridSize.width}, 1fr)`,
                    'gridTemplateRows': `repeat(${puzzle.gridSize.height}, 1fr)`
                  }}
                >
                  {matrix.map((row, r) =>
                    row.map((letter, l) => <span key={r + l}>{letter}</span>)
                  )}
                </div>
                <div style={{ fontWeight: 'bold' }}>{[...puzzle.allWords].length}</div>
              </div>
            )
          })}
        </div>
      </Modal>
    </main >
  )
}

export default AdminScreen;