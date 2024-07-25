import './BoardCell.css'

interface BoardCellProps {
  letter: string;
  touched: boolean;
  wordStatus: string;
}

function BoardCell({ letter, touched, wordStatus }: BoardCellProps) {
  return (
    <>
      <div
        className={'board-cell' + (touched ? ' touched' : '') + ` ${wordStatus}`}
        style={{ fontSize: `calc(${100 - ((letter.length-1) * 10)}%)`}}
      >
        <p>
          {letter}
        </p>
      </div>
      
    </>
  )
}

export default BoardCell;