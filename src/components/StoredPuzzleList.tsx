import styles from './StoredPuzzleList.module.css'
import { StoredPuzzleData } from '../types/types';
import { formatDateAndTime } from '../scripts/util'
import PuzzleIcon from './PuzzleIcon';
import { useEffect, useState } from 'react';
import { fetchThemedPuzzles } from '../scripts/firebase';
import LoadingDisplay from './LoadingDisplay';

interface StoredPuzzleListProps {
  showing: boolean;
  size: number,
  onClickStoredPuzzle: (puzzle: StoredPuzzleData) => void;
}

const StoredPuzzleList = ({ showing, size, onClickStoredPuzzle }: StoredPuzzleListProps) => {
  const [puzzlesLoaded, setPuzzlesLoaded] = useState<boolean>(false);
  const [list, setList] = useState<StoredPuzzleData[]>([]);

  useEffect(() => {
    if (showing) {
      const fetchPuzzles = async () => {
        const puzzleList = await fetchThemedPuzzles(size);
        if (puzzleList) {
          setList(puzzleList);
          setPuzzlesLoaded(true);
        }
      };
      fetchPuzzles();
    }
  }, [showing]);

  return (
    <div className={styles.puzzleList}>
      {puzzlesLoaded ? list.map((puzzle) => {
        const { averageWordLength, dateCreated, commonWordAmount } = puzzle;
        const { dimensions } = puzzle;
        const dateTime = formatDateAndTime(dateCreated);
        return (
          <div key={`${puzzle.dimensions.width}${dimensions.width}${puzzle.letterString}`
          } onClick={() => onClickStoredPuzzle(puzzle)} className={styles.puzzleListing}>
            <div style={{ fontWeight: 'bold' }}>{puzzle.theme}</div>
            {puzzle.theme && <p>{puzzle.specialWords?.length} theme words</p>}
            <PuzzleIcon
              iconSize={{ width: '100%' }}
              puzzleDimensions={{ ...dimensions }}
            />
            <div className={styles.puzzleInfo}>

              <p>{puzzle.allWords?.length} total words</p>
              <p>Avg. length: {averageWordLength.toFixed(2)}</p>
              <p> {commonWordAmount} common words</p>
              <small>{dateTime.date} {dateTime.time}</small>
            </div>
          </div>
        )})
        : <LoadingDisplay />}
    </div>
  )
};

export default StoredPuzzleList;