import './BoardCell.css'

interface BoardCellProps {
  letter: string;
}

function BoardCell({ letter }: BoardCellProps) {

  return (
    <div className='board-cell'>{letter.toUpperCase()}</div>
  )
}

export default BoardCell;