import './BoardCell.css'

interface BoardCellProps {
  letter: string;
  touched: boolean;
  wordValid: boolean;
}

function BoardCell({ letter, touched, wordValid }: BoardCellProps) {

  return (
    <div className={'board-cell' + (touched ? ' touched' : '') + (wordValid ? ' valid' : '')}>{letter.toUpperCase()}</div>
  )
}

export default BoardCell;