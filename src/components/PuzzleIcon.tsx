import styles from './PuzzleIcon.module.css'

interface PuzzleIconProps {
  size: {
    width: number;
    height: number;
  }
  contents: string[];
}

function PuzzleIcon({ size, contents }: PuzzleIconProps) {
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
        gridTemplateColumns: `repeat(${width}, 1rem)`,
        gridTemplateRows: `repeat(${height}, 1rem)`,
      }}
    >
      {contents.map((item, i) =>
        <div key={`${item}${i}`}>{item}</div>
      )}
    </div>
  )
}

export default PuzzleIcon;