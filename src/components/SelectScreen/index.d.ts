import { GameOptions, StoredPuzzleData } from 'types/types';
interface SelectScreenProps {
    hidden: boolean;
    startSinglePlayerGame: (options: GameOptions) => void;
    handleClickStoredPuzzle: (puzzle: StoredPuzzleData) => void;
}
declare function SelectScreen({ hidden, startSinglePlayerGame, handleClickStoredPuzzle }: SelectScreenProps): import("react/jsx-runtime").JSX.Element;
export default SelectScreen;
