import { ReactNode, Dispatch, SetStateAction } from 'react';
import { UserData } from 'types/types';
interface UserContextProps {
    user: UserData | null;
    isLoggedIn: boolean;
    addUserToPlayerList: (userData: UserData) => void;
    changePhase: (newPhase: string) => void;
    handleSignOut: () => void;
    setUser: Dispatch<SetStateAction<UserData | null>>;
    setIsLoggedIn: Dispatch<SetStateAction<boolean>>;
}
export declare const useUser: () => UserContextProps;
export declare const UserProvider: ({ children }: {
    children: ReactNode;
}) => import("react/jsx-runtime").JSX.Element;
export {};
