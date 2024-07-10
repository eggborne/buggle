import styles from './AdminScreen.module.css'
import { useState, useEffect } from 'react';
import { PuzzleData } from '../App';
import { getDatabase, ref, child, get } from "firebase/database";
import { stringTo2DArray } from '../scripts/util';

interface AdminScreenProps {
  handleClickPremadePuzzle: (puzzle: PuzzleData) => void;
}

function AdminScreen({ handleClickPremadePuzzle }: AdminScreenProps) {

  const [puzzleList, setPuzzleList] = useState<PuzzleData[]>([]);

  useEffect(() => {
    const getPuzzles = async () => {
      const dbRef = ref(getDatabase());
      get(child(dbRef, `puzzles/`)).then((snapshot) => {
        if (snapshot.exists()) {
          const nextPuzzleList = snapshot.val();
          console.log('nextPuzzleList', nextPuzzleList);
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
    <main className={styles.adminScreen}>
      <div className={styles.puzzleList}>
        {puzzleList.map((puzzle: PuzzleData) => {
          const matrix = stringTo2DArray(puzzle.letters, puzzle.gridSize.width, puzzle.gridSize.height);
          return (
            <div onClick={() => handleClickPremadePuzzle(puzzle)} className={styles.puzzleListing}>
              <div className={styles.miniPuzzle}>
                {matrix.map(row =>
                  <div>{row}</div>
                )}
              </div>
              <div>{[...puzzle.allWords].length}</div>
            </div>
          )
        })}
      </div>
    </main>
  )
}

export default AdminScreen;