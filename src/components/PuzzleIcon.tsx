import BoardCell from './BoardCell';
import styles from './PuzzleIcon.module.css'

interface PuzzleIconProps {
  puzzleDimensions: {
    width: number;
    height: number;
  },
  iconSize?: {
    width: string;
    height?: string;
  },
  contents?: string[];
}

const PuzzleIcon = ({ puzzleDimensions, contents, iconSize }: PuzzleIconProps) => {
  const { width, height } = puzzleDimensions;
  let cubeArray = contents;
  if (!cubeArray) {
    cubeArray = [];
    for (let i = 0; i < (width * height); i++) {
      cubeArray.push('')
    }
  }
  const puzzleStyle: Record<string, string | number> = {
    gridTemplateColumns: `repeat(${width}, 1fr)`,
    gridTemplateRows: `repeat(${height}, 1fr)`,
    width: iconSize?.width || '33%',
    aspectRatio: (width / height),
  };
  if (iconSize?.height) {
    puzzleStyle.height = iconSize.height;
  }
  return (
    <div
      className={styles.PuzzleIcon}
      style={puzzleStyle}
    >
      {cubeArray.map((item, i) =>
        <BoardCell key={`${item}${i}`} letter={item} touched={false} wordStatus={''} />
      )}
    </div>
  )
};

export default PuzzleIcon;