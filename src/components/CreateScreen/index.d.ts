import { StoredPuzzleData, BoardRequestData } from 'types/types';
interface CreateScreenProps {
    hidden: boolean;
    handleClickStoredPuzzle: (puzzle: StoredPuzzleData) => void;
    startCreatedPuzzlePreview: (options: BoardRequestData) => Promise<void>;
}
declare function CreateScreen({ hidden, startCreatedPuzzlePreview }: CreateScreenProps): import("react/jsx-runtime").JSX.Element;
export default CreateScreen;
