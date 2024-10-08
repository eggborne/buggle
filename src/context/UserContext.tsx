import { createContext, useContext, useState, ReactNode, useEffect, Dispatch, SetStateAction, useRef } from 'react';
import { getAuth, onAuthStateChanged, signOut, User } from 'firebase/auth';
import { UserData, OptionsData, StylePreferencesData, GameplayPreferencesData, ChallengeData, CurrentGameData } from '../types/types';
import { ref, remove, set, update, get, child } from 'firebase/database';
import { database, firestore, getUserFromDatabase } from '../scripts/firebase';
import { defaultUser, letterKeys } from '../config.json';
import { triggerShowMessage } from '../hooks/useMessageBanner';
import { createUserInDatabase } from '../scripts/firebase';
import { arrayUnion, doc, updateDoc } from 'firebase/firestore';
import { encodeMatrix } from '../scripts/util';

const HEARTBEAT_INTERVAL = 5000;
const PRUNE_INTERVAL = HEARTBEAT_INTERVAL * 2;

interface UserContextProps {
  user: UserData | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  sentChallenges: ChallengeData[];
  addUserToPlayerList: (userData: UserData) => void;
  changePhase: (newPhase: string) => void;
  handleSignOut: () => void;
  setUser: Dispatch<SetStateAction<UserData | null>>;
  setIsLoggedIn: Dispatch<SetStateAction<boolean>>;
  setSentChallenges: Dispatch<SetStateAction<ChallengeData[]>>;
  changeOption: (optionKey: keyof OptionsData['style'] | keyof OptionsData['gameplay'], newValue: string | number) => void;
  saveOptions: (newOptions: OptionsData) => void;
  setPuzzleSeen: (newGameData: CurrentGameData, userUid: string) => void;
}

const UserContext = createContext<UserContextProps | undefined>(undefined);

const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [sentChallenges, setSentChallenges] = useState<ChallengeData[]>([]);
  const [heartbeatInterval, setHeartbeatInterval] = useState<NodeJS.Timeout | undefined>(undefined);
  const lastHeartbeatRef = useRef<number>(0);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsLoading(true);
      let userData = defaultUser as UserData;
      if (firebaseUser) {
        console.warn('-- found registered user!')
        userData = await getUserData(firebaseUser);
        console.log('got userData', userData)
        addUserToPlayerList({
          ...userData,
          heartbeat: Date.now()
        });
        setIsLoggedIn(true);

        const sendHeartbeat = async () => {
          await updateUserInPlayerList(`players/${userData.uid}/heartbeat`, Date.now());
        }

        const startHeartbeat = (duration: number) => {
          return setInterval(async () => {
            const now = Date.now();
            const sinceLast = now - lastHeartbeatRef.current;
            if (lastHeartbeatRef.current && (sinceLast < (HEARTBEAT_INTERVAL / 2))) {
              console.warn('because sinceLast is <', (HEARTBEAT_INTERVAL / 2), ': ', sinceLast, '; skipping this heartbeat');
              return;
            }
            // await sendHeartbeat();
            sendHeartbeat();
            lastHeartbeatRef.current = now;
            pruneInactivePlayers(userData.uid);
          }, duration);
        };

        setHeartbeatInterval(startHeartbeat(HEARTBEAT_INTERVAL));

      } else {
        console.warn('-- NO Firebase user!');
        setIsLoggedIn(false);
      }
      console.log('setting user to', userData)
      setUser(userData);
      for (const type in userData.preferences) {
        const prefsSection = userData.preferences[type as keyof OptionsData];
        for (const optionKey in prefsSection) {
          const newValue = userData.preferences[type as keyof OptionsData][optionKey as keyof OptionsData[keyof OptionsData]] as string | number;
          const varName = '--user-' + optionKey.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
          document.documentElement.style.setProperty(varName, newValue.toString());
        }
      }
      setIsLoading(false);
    });

    return () => {
      clearInterval(heartbeatInterval);
      return unsubscribe();
    };
  }, []);

  const getUserData = async (firebaseUser: User): Promise<UserData> => {
    const snapshot = await getUserFromDatabase(firebaseUser.uid);
    if (snapshot.exists()) {
      return snapshot.data() as UserData;
    } else {
      const newUserData: UserData = {
        displayName: firebaseUser.displayName?.split(' ')[0] || 'Guest',
        photoURL: firebaseUser.photoURL,
        uid: firebaseUser.uid,
        phase: 'title',
        preferences: defaultUser.preferences,
        seenPuzzles: [],
      };
      await createUserInDatabase(newUserData);
      return newUserData;
    }
  };

  const pruneInactivePlayers = async (prunerUid: string) => {
    const snapshot = await get(child(ref(database), 'players'));
    const players = snapshot.val();

    if (players) {
      Object.keys(players).filter(p => p !== prunerUid).forEach(async (playerUid) => {
        const player = players[playerUid];
        const sinceLast = Date.now() - player.heartbeat;
        if (sinceLast > PRUNE_INTERVAL) {
          console.log(`${player.displayName} sinceLast too long: ${sinceLast} > ${PRUNE_INTERVAL}`)
          await remove(ref(database, `players/${playerUid}`));
          console.log(`Removed inactive player: ${playerUid}`);
        }
      });
    }
  };

  const addUserToPlayerList = async (userData: UserData) => {
    await set(ref(database, `players/${userData.uid}`), userData);
  };

  const removeUserFromPlayerList = async (uid: string) => {
    await remove(ref(database, `players/${uid}`));
  };

  const updateUserInPlayerList = async (path: string, newValue: string | number) => {
    const updates: Record<string, string | number> = {};
    updates[path] = newValue;
    await update(ref(database), updates);
  };

  const changePhase = (newPhase: string) => {
    setUser((prevUser) => {
      if (prevUser) {
        return { ...prevUser, phase: newPhase };
      }
      return prevUser;
    });
    if (isLoggedIn) {
      updateUserInPlayerList(`players/${user?.uid}/phase`, newPhase);
    }
  };

  const handleSignOut = async () => {
    if (!user) return;
    const auth = getAuth();
    try {
      clearInterval(heartbeatInterval);
      await removeUserFromPlayerList(user.uid);
      setUser({
        ...user,
        ...defaultUser,
        phase: 'title'
      });
      await signOut(auth);
      setIsLoggedIn(false);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const changeOption = async (optionKey: keyof OptionsData['style'] | keyof OptionsData['gameplay'], newValue: string | number) => {
    if (!user || !user.preferences) return;

    // Dynamically determine the preferenceKey based on the presence of the key in style or gameplay
    const preferenceKey = Object.prototype.hasOwnProperty.call(user.preferences.style, optionKey) ? 'style' : 'gameplay';

    // Update the specific preference data using type assertion
    const updatedPreferences = {
      ...user.preferences[preferenceKey],
      [optionKey]: newValue
    } as StylePreferencesData | GameplayPreferencesData;

    // Update the user object with the new preferences
    const updatedUser = {
      ...user,
      preferences: {
        ...user.preferences,
        [preferenceKey]: updatedPreferences
      }
    };

    setUser(updatedUser);

    // Update CSS variable
    const varName = '--user-' + optionKey.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    document.documentElement.style.setProperty(varName, newValue.toString());
  };

  const saveOptions = async (newOptions: OptionsData) => {
    if (!user || !isLoggedIn) return;

    const userRef = doc(firestore, 'users', user.uid);

    await updateDoc(userRef, {
      preferences: newOptions
    });

    triggerShowMessage('Options saved!');
  };

  const setPuzzleSeen = async ({ letterMatrix, dimensions }: CurrentGameData, userUid: string) => {
    const letterString = encodeMatrix(letterMatrix, letterKeys[dimensions.width === 4 ? 'boggle' : dimensions.width === 5 ? 'bigBoggle' : dimensions.width === 6 ? 'superBigBoggle' : 'boggle']).flat().join('');
    const newPuzzleId = `${dimensions.width}${dimensions.height}${letterString}`;
    const seenPuzzleRef = doc(firestore, 'users', userUid);

    try {
      if (!user) return;
      const newUser = { ...user };
      newUser.seenPuzzles?.push(newPuzzleId);
      setUser(newUser);
      await updateDoc(seenPuzzleRef, {
        seenPuzzles: arrayUnion(newPuzzleId)
      });
      console.warn('seenPuzzles updated!');
    } catch (error) {
      console.warn('Error updating puzzle:', error);
    }
  }

  return (
    <UserContext.Provider value={{
      user,
      isLoggedIn,
      isLoading,
      sentChallenges,
      addUserToPlayerList,
      changePhase,
      handleSignOut,
      setUser,
      setIsLoggedIn,
      setSentChallenges,
      changeOption,
      saveOptions,
      setPuzzleSeen,
    }}>
      {children}
    </UserContext.Provider>
  );
};

export { UserProvider, useUser }