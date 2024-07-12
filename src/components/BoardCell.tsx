import './BoardCell.css'

interface BoardCellProps {
  letter: string;
  touched: boolean;
  wordStatus: string;
}

function BoardCell({ letter, touched, wordStatus }: BoardCellProps) {
  return (
    <>
      <div className={'board-cell' + (touched ? ' touched' : '') + ` ${wordStatus}`}>
        <p>
          {letter}
        </p>
      </div>
      
    </>
  )
}

export default BoardCell;