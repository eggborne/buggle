import { StoredPuzzleData } from '../types/types.ts';
interface StoredPuzzleListProps {
    list: StoredPuzzleData[];
    onClickStoredPuzzle: (puzzle: StoredPuzzleData) => void;
}
declare function StoredPuzzleList({ list, onClickStoredPuzzle }: StoredPuzzleListProps): import("react/jsx-runtime").JSX.Element;
export default StoredPuzzleList;
