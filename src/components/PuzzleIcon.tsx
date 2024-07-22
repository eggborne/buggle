import BoardCell from './BoardCell/BoardCell';
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
        // <div key={`${item}${i}`}
        //   style={{
        //     fontSize: `calc((${iconSize.width} / ${width * 1.5}) - (${width - 2} * 4 * var(--cube-gap)) - (8 * var(--game-board-padding)) )`,
        //     // fontSize: `calc(${iconSize.width} - (var(--cube-gap) * ${width - 2}) - (var(--game-board-padding) * 2))`,

        //   }}
        // >{item}</div>
        <BoardCell key={`${item}${i}`} letter={item} touched={false} wordStatus={''} />
      )}
    </div>
  )
}

export default PuzzleIcon;