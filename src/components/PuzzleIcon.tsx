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
        height: iconSize.height || '100%',
      }}
    >
      {contents.map((item, i) =>
        <div key={`${item}${i}`}
          style={{
            fontSize: `calc(100vw / ${width * 4.5})`,
            height: `calc()`
          }}
        >{item}</div>
      )}
    </div>
  )
}

export default PuzzleIcon;