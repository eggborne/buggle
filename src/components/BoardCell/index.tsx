import styles from './BoardCell.module.css'

interface BoardCellProps {
  letter: string;
  opponentTouching?: boolean;
  touched: boolean;
  wordStatus: string;
}

function BoardCell({ letter, opponentTouching, touched, wordStatus }: BoardCellProps) {
  const boardCellClass = `${styles.BoardCell} ${touched ? styles.touched : ''} ${opponentTouching ? styles.opponentTouching : ''} ${styles[wordStatus]}`;
  return (
    <>
      <div
        className={boardCellClass}
        style={{ fontSize: `calc(${100 - ((letter.length-1) * 10)}%)`}}
      >
        <p>{letter}</p>
      </div>
      
    </>
  )
}

export default BoardCell;