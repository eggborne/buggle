import { ReactNode, Dispatch, SetStateAction } from 'react';
import { ChallengeData, CurrentGameData, UserData } from 'types/types';
interface FirebaseContextProps {
    playerList: UserData[] | null;
    challenges: ChallengeData[] | null;
    currentMatch: CurrentGameData | null;
    setGameId: (id: string | null) => void;
    setPlayerList: Dispatch<SetStateAction<UserData[] | null>>;
}
export declare const FirebaseProvider: ({ children }: {
    children: ReactNode;
}) => import("react/jsx-runtime").JSX.Element;
export declare const useFirebase: () => FirebaseContextProps;
export {};
