import BoardCell from './BoardCell';
import './GameBoard.css'

interface GameBoardProps {
  letterMatrix: string[][];
};


function GameBoard({ letterMatrix }: GameBoardProps) {

  return (
    <div className='game-board'>
      {letterMatrix.map((row, r) => 
        row.map((letter, l) => (
          <BoardCell letter={letter} key={`${letter}${r}${l}`} />
        ))
      )}
    </div>
  )
}

export default GameBoard;