import { CurrentGameData, PlayerData } from 'types/types';
interface GameBoardProps {
    gameId?: string;
    currentGame: CurrentGameData;
    player: PlayerData;
    onValidWord: (word: string) => void;
    uploadPuzzle: () => void;
}
declare function GameBoard({ gameId, currentGame, player, onValidWord, uploadPuzzle }: GameBoardProps): import("react/jsx-runtime").JSX.Element;
export default GameBoard;
