import styles from './StoredPuzzleList.module.css'
import { StoredPuzzleData } from '../App.tsx';
import { formatDateAndTime } from '../scripts/util.ts'
import PuzzleIcon from './PuzzleIcon.tsx';

interface StoredPuzzleListProps {
  list: StoredPuzzleData[];
  onClickPremadePuzzle: (puzzle: StoredPuzzleData) => void;
}

function StoredPuzzleList({ list, onClickPremadePuzzle }: StoredPuzzleListProps) {
  function organizedPuzzles(puzzleList: StoredPuzzleData[]): {
    label: string;
    list: StoredPuzzleData[];
  }[] {
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
      {organizedPuzzles(list).map((listObj) =>
        <div key={listObj.label} className={styles.sizeGroup}>
          <label>{listObj.label}</label>
          <div className={styles.sizeList}>{
            listObj.list.map((puzzle) => {
              const { averageWordLength, dateCreated, percentUncommon } = puzzle.metadata;
              const { dimensions } = puzzle;
              const dateTime = formatDateAndTime(dateCreated);
              return (
                <div key={`${puzzle.dimensions.width}${dimensions.width}${puzzle.letterString}`
                } onClick={() => onClickPremadePuzzle(puzzle)} className={styles.puzzleListing} >
                  <PuzzleIcon iconSize={{
                    width: '90%',
                    height: '90%'
                  }} puzzleDimensions={{ ...dimensions }} contents={puzzle.letterString.split('')} />
                  <div className={styles.puzzleInfo}>
                    <p>{[...puzzle.allWords].length} words</p>
                    <p>Avg. length: {(averageWordLength).toFixed(2)}</p>
                    <p> {percentUncommon}% uncommon</p>
                    <small>{dateTime.date} {dateTime.time}</small>
                  </div>
                </div>
              )
            })
          }</div>
        </div>
      )}
    </div>
  )
}

export default StoredPuzzleList;