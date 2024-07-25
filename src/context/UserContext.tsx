import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { getAuth, onAuthStateChanged, User as AuthUser } from 'firebase/auth';
import { UserData } from '../App';

interface UserContextProps {
  user: UserData | null;
  isLoggedIn: boolean;
  setUser: (user: UserData | null) => void;
  setIsLoggedIn: (isLoggedIn: boolean) => void;
}

const UserContext = createContext<UserContextProps | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const userData: UserData = {
          displayName: user.displayName,
          photoURL: user.photoURL,
          phase: null,
          preferences: null,
          uid: user.uid,
        };
        setUser(userData);
        setIsLoggedIn(!!user);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <UserContext.Provider value={{ user, isLoggedIn, setUser, setIsLoggedIn }}>
      {children}
    </UserContext.Provider>
  );
};
