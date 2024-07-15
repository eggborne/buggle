import styles from './PuzzleIcon.module.css'

interface PuzzleIconProps {
  size: {
    width: number;
    height: number;
  },
  iconSize: string;
  contents: string[];
}

function PuzzleIcon({ size, contents, iconSize }: PuzzleIconProps) {
  const { width, height } = size;
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
        width: iconSize,
        aspectRatio: 1,
      }}
    >
      {contents.map((item, i) =>
        <div key={`${item}${i}`}
          style={{ fontSize: `calc(100vw / ${width * 4.5})`}}
        >{item}</div>
      )}
    </div>
  )
}

export default PuzzleIcon;