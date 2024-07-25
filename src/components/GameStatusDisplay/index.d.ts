import { PlayerData, CurrentGameData } from 'types/types';
interface GameStatusDisplayProps {
    player: PlayerData;
    currentGame: CurrentGameData;
}
declare function GameStatusDisplay({ player, currentGame }: GameStatusDisplayProps): import("react/jsx-runtime").JSX.Element;
export default GameStatusDisplay;
