import PuzzleIcon from '../PuzzleIcon';
import styles from './SizeSelection.module.css';

interface SizeSelectionProps {
  iconSize: {
    width: string;
    height?: string;
  },
  sizeSelected: number,
  handleChangeSize: (newSize: number) => void;
}

const SizeSelection = ({ iconSize, sizeSelected, handleChangeSize }: SizeSelectionProps) => {

  return (
    <div className={styles.SizeSelection}>
      <span className={sizeSelected === 4 ? styles.active : styles.inactive} onClick={() => handleChangeSize(4)}
      ><PuzzleIcon
          iconSize={iconSize}
          puzzleDimensions={{ width: 4, height: 4 }} />
      </span>
      <span className={sizeSelected === 5 ? styles.active : styles.inactive} onClick={() => handleChangeSize(5)}
      ><PuzzleIcon
          iconSize={iconSize}
          puzzleDimensions={{ width: 5, height: 5 }} />
      </span>
      <span className={sizeSelected === 6 ? styles.active : styles.inactive} onClick={() => handleChangeSize(6)}
      ><PuzzleIcon
          iconSize={iconSize}
          puzzleDimensions={{ width: 6, height: 6 }} />
      </span>
    </div>
  );
}

export default SizeSelection;