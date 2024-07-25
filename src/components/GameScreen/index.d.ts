import { PlayerData, CurrentGameData } from 'types/types';
interface GameScreenProps {
    gameId?: string;
    currentGame: CurrentGameData;
    player: PlayerData;
    hidden: boolean;
    handleValidWord: (word: string) => void;
    uploadPuzzle: () => void;
}
declare function GameScreen({ gameId, currentGame, player, hidden, handleValidWord, uploadPuzzle }: GameScreenProps): import("react/jsx-runtime").JSX.Element;
export default GameScreen;
