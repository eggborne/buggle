import styles from './AdminScreen.module.css'
import { useState, useEffect } from 'react';
import { PuzzleData } from '../App';
import { getDatabase, ref, child, get } from "firebase/database";

function AdminScreen() {

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

  const stringTo2DArray = (input: string, width: number, height: number): string[][] => {
    const result: string[][] = [];
    let index = 0;
    for (let i = 0; i < height; i++) {
      const row: string[] = [];
      for (let j = 0; j < width; j++) {
        row.push(input[index]);
        index++;
      }
      result.push(row);
    }
    return result;
  }

  return (
    <main className={styles.adminScreen}>
      <div className={styles.puzzleList}>
        {puzzleList.map((puzzle: PuzzleData) => {
          const matrix = stringTo2DArray(puzzle.letters, puzzle.gridSize.width, puzzle.gridSize.height);
          return (
            <div className={styles.puzzleListing}>
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