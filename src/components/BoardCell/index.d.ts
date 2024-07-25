import './BoardCell.css';
interface BoardCellProps {
    letter: string;
    touched: boolean;
    wordStatus: string;
}
declare function BoardCell({ letter, touched, wordStatus }: BoardCellProps): import("react/jsx-runtime").JSX.Element;
export default BoardCell;
