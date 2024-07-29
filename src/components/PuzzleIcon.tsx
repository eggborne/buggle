import BoardCell from './BoardCell';
import styles from './PuzzleIcon.module.css'

interface PuzzleIconProps {
  puzzleDimensions: {
    width: number;
    height: number;
  },
  iconSize: {
    width: string;
    height?: string;
  },
  // iconSize: string;
  contents: string[];
}

function PuzzleIcon({ puzzleDimensions, contents, iconSize }: PuzzleIconProps) {
  const { width, height } = puzzleDimensions;
  const cubeArray = contents;
  if (contents.length === 0) {
    for (let i = 0; i < (width * height); i++) {
      cubeArray.push('')
    }
  }
  return (
    <div
      className={styles.PuzzleIcon}
      style={{
        gridTemplateColumns: `repeat(${width}, 1fr)`,
        gridTemplateRows: `repeat(${height}, 1fr)`,
        width: iconSize.width,
        aspectRatio: (width / height),
      }}
    >
      {contents.map((item, i) =>
        <BoardCell key={`${item}${i}`} letter={item} touched={false} wordStatus={''} />
      )}
    </div>
  )
}

export default PuzzleIcon;