import './BoardCell.css'

interface BoardCellProps {
  letter: string;
  touched: boolean;
  wordStatus: string;
}

function BoardCell({ letter, touched, wordStatus }: BoardCellProps) {
  const cellContents = letter == 'Q' ? 'Qu' : letter.toUpperCase();
  return (
    <>
      <div className={'board-cell' + (touched ? ' touched' : '') + ` ${wordStatus}`}>
        <p>
          {cellContents}
        </p>
      </div>
      
    </>
  )
}

export default BoardCell;