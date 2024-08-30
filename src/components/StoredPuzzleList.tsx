import styles from './StoredPuzzleList.module.css'
import { StoredPuzzleData } from '../types/types';
import { formatDateAndTime } from '../scripts/util'
import PuzzleIcon from './PuzzleIcon';
import { useEffect, useState } from 'react';
import { fetchThemedPuzzles } from '../scripts/firebase';
import LoadingDisplay from './LoadingDisplay';

interface StoredPuzzleListProps {
  showing: boolean;
  onClickStoredPuzzle: (puzzle: StoredPuzzleData) => void;
}

const StoredPuzzleList = ({ showing, onClickStoredPuzzle }: StoredPuzzleListProps) => {
  const [puzzlesLoaded, setPuzzlesLoaded] = useState<boolean>(false);
  const [list, setList] = useState<StoredPuzzleData[]>([]);

  useEffect(() => {
    if (showing) {
      const fetchPuzzles = async () => {
        const puzzleList = await fetchThemedPuzzles();
        if (puzzleList) {
          setList(puzzleList);
          setPuzzlesLoaded(true);
        }
      };
      fetchPuzzles();
    }
  }, [showing]);

  const organizedPuzzles = (puzzleList: StoredPuzzleData[]): {
    label: string;
    list: StoredPuzzleData[];
  }[] => {
    const puzzleDictionary: Record<string, StoredPuzzleData[]> = {};
    puzzleList.forEach(puzzle => {
      const dimensionsKey = `${puzzle.dimensions.width} x ${puzzle.dimensions.height}`;
      !puzzleDictionary[dimensionsKey] && (puzzleDictionary[dimensionsKey] = []);
      puzzleDictionary[dimensionsKey].push(puzzle);
    });

    const dimensionsSorted = Object.keys(puzzleDictionary).map(key => {
      const [width, height] = key.split(' x ').map(Number);
      return { key, width, height, list: puzzleDictionary[key] };
    }).sort((a, b) => (a.width !== b.width) ? a.width - b.width : a.height - b.height);

    return dimensionsSorted.map(dim => ({
      label: `${dim.width} x ${dim.height}`,
      list: dim.list,
    }));
  }

  return (
    <div className={styles.puzzleList}>
      {puzzlesLoaded ? organizedPuzzles(list).map((listObj) =>
        <div key={listObj.label} className={styles.sizeGroup}>
          <label>{listObj.label}</label>
          <div className={styles.sizeList}>{
            listObj.list.map((puzzle) => {
              const { averageWordLength, dateCreated, percentCommon } = puzzle;
              const { dimensions } = puzzle;
              const dateTime = formatDateAndTime(dateCreated);
              return (
                <div key={`${puzzle.dimensions.width}${dimensions.width}${puzzle.letterString}`
                } onClick={() => onClickStoredPuzzle(puzzle)} className={styles.puzzleListing}>
                  <div style={{ fontWeight: 'bold' }}>{puzzle.theme}</div>
                  {puzzle.theme && <p>{puzzle.specialWords?.length} special words</p>}
                  {/* <button onClick={(e) => deletePuzzle(e)} data-puzzle-id={`${puzzle.dimensions.width}${puzzle.dimensions.height}${puzzle.letterString}`} className={'x-close'}>X</button> */}
                  <PuzzleIcon
                    iconSize={{ width: '100%' }}
                    puzzleDimensions={{ ...dimensions }}
                    contents={puzzle.letterString.split('').map(() => '?')}
                  />
                  <div className={styles.puzzleInfo}>

                    <p>{puzzle.allWords?.length} total words</p>
                    <p>Avg. length: {(averageWordLength).toFixed(2)}</p>
                    <p> {percentCommon}% common</p>
                    <small>{dateTime.date} {dateTime.time}</small>
                  </div>
                </div>
              )
            })
          }</div>
        </div>
      ) : <LoadingDisplay />}
    </div>
  )
};

export default StoredPuzzleList;