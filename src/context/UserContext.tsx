import { createContext, useContext, useState, ReactNode, useEffect, Dispatch, SetStateAction } from 'react';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { UserData } from 'types/types';
import { ref, remove, set, update } from 'firebase/database';
import { database } from 'scripts/firebase';
import { defaultUser } from '../App';

interface UserContextProps {
  user: UserData | null;
  isLoggedIn: boolean;
  addUserToPlayerList: (userData: UserData) => void;
  changePhase: (newPhase: string) => void;
  handleSignOut: () => void;
  setUser: Dispatch<SetStateAction<UserData | null>>;
  setIsLoggedIn: Dispatch<SetStateAction<boolean>>;
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
    if (isLoggedIn && user?.uid) {
      updateUserInPlayerList(`players/${user.uid}/phase`, user.phase || 'error');
    }
  }, [isLoggedIn, user?.phase]);

  const addUserToPlayerList = async (userData: UserData) => {
    await set(ref(database, `players/${user?.uid}`), userData);
  }

  const removeUserFromPlayerList = async (uid: string) => {
    await remove(ref(database, `players/${uid}`));
  };

  const updateUserInPlayerList = async (path: string, newValue: string | number) => {
    const updates: Record<string, string | number> = {};
    updates[path] = newValue;
    await update(ref(database), updates);
  }

  const changePhase = (newPhase: string) => {
    setUser((prevUser: UserData | null) => {
      let nextUser;
      if (prevUser) {
        nextUser = {
          ...prevUser,
          phase: newPhase
        };
      } else {
        nextUser = {
          ...defaultUser,
          phase: newPhase
        }
      }
      return nextUser;
    });
  };

  const handleSignOut = async () => {
    if (!user) return;
    const auth = getAuth();
    try {
      await signOut(auth);
      console.log("User signed out successfully");
      await removeUserFromPlayerList(user.uid);
      setUser({
        ...defaultUser,
        ...user,
        phase: 'title'
      });
      setIsLoggedIn(false);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  useEffect(() => {
    console.warn('>>>>>> UserContext useEffect[] running!')
    const auth = getAuth();

    // returns a function to unsubscribe to itself (?!?)
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const convertedName = user.displayName ? user.displayName.split(' ')[0] : 'Guest';
        const userData: UserData = {
          displayName: convertedName,
          photoURL: user.photoURL,
          uid: user.uid,
          phase: 'title'
        };
        setUser(userData);
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
        console.error('no user in UserContext useEffect[]');
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <UserContext.Provider value={{
      user,
      isLoggedIn,
      addUserToPlayerList,
      changePhase,
      setUser,
      setIsLoggedIn,
      handleSignOut
    }}>
      {children}
    </UserContext.Provider>
  );
};
