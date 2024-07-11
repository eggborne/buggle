import styles from './PuzzleIcon.module.css'

interface PuzzleIconProps {
  size: {
    width: number;
    height: number;
  }
}

function PuzzleIcon({ size }: PuzzleIconProps) {
  const { width, height } = size;
  const cubeArray = [];
  for (let i = 0; i < (width * height); i++) {
    cubeArray.push(i)
  }
  return (
    <div
      className={styles.PuzzleIcon}
      style={{
        gridTemplateColumns: `repeat(${width}, 1rem)`,
        gridTemplateRows: `repeat(${height}, 1rem)`,
      }}
    >
      {cubeArray.map(cube =>
        <div key={cube}></div>
      )}
    </div>
  )
}

export default PuzzleIcon;