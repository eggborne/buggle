import { useState, useEffect, useLayoutEffect } from 'react'
import './App.css'
import { BoardRequestData, CurrentGameData, GameOptions, GeneratedBoardData, OptionsData, PlayerData, PointValues, StoredPuzzleData, UserData } from './types/types';
import { useUser } from './context/UserContext';
import Footer from './components/Footer'
import TitleScreen from './components/TitleScreen'
import LobbyScreen from './components/LobbyScreen'
import SelectScreen from './components/SelectScreen'
import GameScreen from './components/GameScreen'
import OptionsScreen from './components/OptionsScreen'
import CreateScreen from './components/CreateScreen'
import { set, get, ref, child } from 'firebase/database';
import { database } from './scripts/firebase';
import { stringTo2DArray, randomInt, saveToLocalStorage, getFromLocalStorage, decodeMatrix, encodeMatrix } from "./scripts/util";
import Modal from './components/Modal'
import MessageBanner from './components/MessageBanner/';
import UserMenu from './components/UserMenu/';
// import { useFirebase } from 'context/FirebaseContext.tsx';

const defaultUserOptions = {
  cubeColor: '#aaaaaa',
  cubeGap: 44,
  cubeTextColor: '#222222',
  cubeRoundness: 32,
  footerHeight: 6,
  gameBackgroundColor: '#223300',
  gameBoardBackgroundColor: '#2a283e',
  gameBoardPadding: 32,
  gameBoardSize: 96,
  swipeBuffer: 70,
};

export const defaultUser: UserData = {
  displayName: 'Guest',
  photoURL: '',
  phase: 'title',
  preferences: defaultUserOptions,
  uid: 'GuestId'
};


const difficultyWordAmounts: Record<string, { min: number, max: number }> = {
  easy: { min: 200, max: 10000 },
  medium: { min: 150, max: 250 },
  hard: { min: 1, max: 150 }
};
const pointValues: PointValues = { 3: 1, 4: 1, 5: 2, 6: 3, 7: 5, 8: 11 };

function App() {
  const { user, isLoggedIn, addUserToPlayerList, changePhase, handleSignOut, setUser } = useUser();
  // const { playerList } = useFirebase();
  const phase = user?.phase;
  const [userReady, setUserReady] = useState<boolean>(false);
  const [optionsShowing, setOptionsShowing] = useState<boolean>(false);
  const [userMenuShowing, setUserMenuShowing] = useState<boolean>(false);
  const [confirmingGameExit, setConfirmingGameExit] = useState<boolean>(false);
  const [confirmingSignOut, setConfirmingSignOut] = useState<boolean>(false);

  // const [bannerShowing, setBannerShowing] = useState<boolean>(false);
  // const [bannerOptions, setBannerOptions] = useState<BannerOptions>({
  //   message: 'cocks cock cock cock',
  //   duration: 10000,
  //   style: {
  //     opacity: "0.5"
  //   }
  // });

  const [player, setPlayer] = useState<PlayerData>({
    score: 0,
    wordsFound: new Set(),
  });

  const [currentGame, setCurrentGame] = useState<CurrentGameData | null>(null);

  const getUserFromDatabase = async (uid: string) => {
    return get(child(ref(database), `users/${uid}`));
  };
  const createUserInDatabase = async (userData: UserData) => {
    console.log('creating user in db', userData);
    await set(ref(database, `users/${userData.uid}`), userData);
  };

  useLayoutEffect(() => {
    if (isLoggedIn && user) {
      console.warn('>>>>>> App.useEffect[isLoggedIn]: USER SIGNED IN!', user, 'ready?', userReady);
      const getUserData = async () => {
        const snapshot = await getUserFromDatabase(user.uid)
        let userData: UserData;
        if (snapshot.exists()) {
          userData = snapshot.val();
        } else {
          // create in database          
          console.log(`No user data available for uid ${user.uid}. Creating new user in database!`);
          userData = {
            ...defaultUser,
            ...user,
          };
          console.log('sending user data to db:', userData);
          try {
            await createUserInDatabase(userData);
          } catch (error) {
            console.error('Error setting user data:', error);
          }
        }
        setUser(userData);
        // for (const optionKey in userData.preferences) {
        //   const varName = '--user-' + optionKey.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
        //   const newValue = userData.preferences[optionKey as keyof OptionsData].toString();
        //   document.documentElement.style.setProperty(varName, newValue)
        // }
        addUserToPlayerList(userData);
      }
      getUserData();
    } else {
      console.warn('>>>>>> App.useEffect[isLoggedIn]: USER NOT SIGNED IN!');
      // check for local saved options
      const localOptions = getFromLocalStorage('buggle-options') as OptionsData;
      const initialOptions = localOptions || defaultUserOptions;

      if (localOptions) {
        console.log('found local options', initialOptions);
      } else {
        console.log('using default options', initialOptions);
      }

      const defaultInitialUser: UserData = {
        ...defaultUser,
        preferences: initialOptions,
        ...user,
      };
      setUser(defaultInitialUser);
      for (const optionKey in defaultInitialUser.preferences) {
        const varName = '--user-' + optionKey.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
        const newValue = defaultInitialUser.preferences[optionKey as keyof OptionsData].toString();
        document.documentElement.style.setProperty(varName, newValue)
      }
    }
  }, [isLoggedIn]);

  useEffect(() => {
    window.addEventListener('popstate', function () {
      history.pushState(null, '', document.URL);
    });
    history.pushState(null, '', document.URL);
  }, []);

  useEffect(() => {
    if (user && user.preferences && !userReady) {
      console.log('setting ready when pref', user, user.preferences);
      setTimeout(() => {
        setUserReady(true);
      }, 600);
    }
  }, [user]);

  // useEffect(() => {
  //   if (playerList) {
      
  //   }
  // }, [playerList])

  const saveUserPreference = async (optionKey: string, newValue: string | number) => {
    if (isLoggedIn) {
      console.warn('-- sending option to DB:', optionKey, newValue);
      await set(ref(database, `users/${user?.uid}/preferences/${optionKey}`), newValue);
      console.warn('-- sent option to DB');
    }
    const varName = '--user-' + optionKey.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    document.documentElement.style.setProperty(varName, newValue.toString())
  }

  const handleValidWord = (word: string) => {
    let wordValue;
    if (word.length >= 8) {
      wordValue = pointValues[8];
    } else {
      wordValue = pointValues[word.length];
    }
    const nextPlayer = { ...player };
    nextPlayer.score += wordValue;
    nextPlayer.wordsFound.add(word);
    setPlayer(nextPlayer);
  };

  const uploadPuzzle = async () => {
    if (!currentGame) return;
    const nextPuzzleData = {
      allWords: Array.from(currentGame.allWords),
      dimensions: currentGame.dimensions,
      letterString: encodeMatrix(currentGame.letterMatrix, currentGame.metadata.key).map(row => row.join('')).join(''),
      metadata: currentGame.metadata,
    };
    const newPuzzleId = `${currentGame.dimensions.width}${currentGame.dimensions.height}${nextPuzzleData.letterString}`;
    console.log('uploading', nextPuzzleData)
    await set(ref(database, 'puzzles/' + newPuzzleId), nextPuzzleData);
    console.warn('puzzle uploaded!')
  };

  const fetchRandomPuzzle = async ({ dimensions, difficulty }: GameOptions): Promise<CurrentGameData> => {
    const snapshot = await get(child(ref(database), `puzzles/`));
    const data: StoredPuzzleData[] = snapshot.val();
    console.warn('got puzzles from Firebase DB:', Object.values(data))
    const wordLimits = difficultyWordAmounts[difficulty];
    const randomPool = Object.values(data).filter(puzzle => {
      const sizeMatches = puzzle.dimensions.width === dimensions.width && puzzle.dimensions.height === dimensions.height;
      const notTooFewWords = puzzle.allWords.length >= wordLimits.min;
      const notTooManyWords = puzzle.allWords.length <= wordLimits.max;
      return (sizeMatches && notTooFewWords && notTooManyWords);
    });
    if (randomPool.length === 0) {
      console.error('NO PUZZLES FOUND!');
    }
    const randomPuzzle: StoredPuzzleData = randomPool[randomInt(0, randomPool.length - 1)];
    const nextMatrix = stringTo2DArray(randomPuzzle.letterString, dimensions.width, dimensions.height);
    const nextGameData: CurrentGameData = {
      allWords: new Set(randomPuzzle.allWords),
      letterMatrix: decodeMatrix(nextMatrix, randomPuzzle.metadata.key),
      metadata: randomPuzzle.metadata,
      dimensions: {
        width: dimensions.width,
        height: dimensions.height,
      },
    }
    return nextGameData;
  }

  const generateUrl = process.env.NODE_ENV === 'development' ? `${location.protocol}//${location.hostname}:3000/language-api/generateBoggle/` : 'https://mikedonovan.dev/language-api/generateBoggle/'

  const createSolvedPuzzle = async (options: BoardRequestData): Promise<GeneratedBoardData | undefined> => {
    console.log('>>>>>>>>>>>>  Using API to create puzzle with options', options);
    const fetchStart = Date.now();
    try {
      const rawResponse = await fetch(generateUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', },
        body: JSON.stringify(options),
      });
      const response = await rawResponse.json();
      if (response.success) {
        const data: GeneratedBoardData = response.data
        console.warn(`${response.message} in ${Date.now() - fetchStart}ms`);
        console.warn('<<<<<<<<<<<<  returning GeneratedBoardData', response.data);
        return data;
      } else {
        console.error(response.message);
        return undefined;
      }
    } catch (error) {
      console.error('Error fetching puzzle:', error);
      return undefined;
    }
  };

  const createPuzzle = async (boardOptions: BoardRequestData): Promise<CurrentGameData | undefined> => {
    const nextPuzzle = await createSolvedPuzzle(boardOptions);
    if (nextPuzzle) {
      const nextGameData: CurrentGameData = {
        allWords: new Set(nextPuzzle.wordList),
        letterMatrix: nextPuzzle.matrix,
        dimensions: {
          width: boardOptions.dimensions.width,
          height: boardOptions.dimensions.height,
        },
        metadata: nextPuzzle.metadata,
        customizations: nextPuzzle.customizations,
        filters: nextPuzzle.filters,
      }
      console.log('made CurrentGameData nextGameData', nextGameData)
      return nextGameData;
    } else {
      return undefined;
    }
  }

  const startStoredPuzzle = (puzzle: StoredPuzzleData) => {
    console.log('startStoredPuzzle', puzzle)
    const nextMatrix = stringTo2DArray(puzzle.letterString, puzzle.dimensions.width, puzzle.dimensions.height);
    const nextGameData = {
      allWords: new Set(puzzle.allWords),
      letterMatrix: decodeMatrix(nextMatrix, puzzle.metadata.key),
      dimensions: {
        width: puzzle.dimensions.width,
        height: puzzle.dimensions.height,
      },
      metadata: puzzle.metadata
    }

    setCurrentGame(nextGameData)
    changePhase('game')
  }

  // const changePhase = (newPhase: string) => {
  //   if (!user) return;
  //   if (currentGame && phase === 'game') {
  //     console.log('currentGame exists while clicked away from game')
  //     setConfirmingGameExit(true);
  //     return;
  //   }
  //   setUser((prevUser: UserData | null) => {
  //     if (prevUser) {
  //       return {
  //         ...prevUser,
  //         phase: newPhase
  //       };
  //     } else {
  //       return defaultUser;
  //     }
  //   });
  // }

  const startSinglePlayerGame = async (gameOptions: GameOptions) => {
    const randomPuzzle = await fetchRandomPuzzle(gameOptions);
    setCurrentGame({
      ...randomPuzzle,
      timeLimit: gameOptions.timeLimit,
    });
    changePhase('game');
  }

  const startCreatedPuzzlePreview = async (boardOptions: BoardRequestData) => {
    const newPuzzlePreview = await createPuzzle(boardOptions);
    if (newPuzzlePreview) {
      setCurrentGame(newPuzzlePreview)
      changePhase('game');
    }
    return;
  }

  const changeOption = (optionKey: string, newValue: string | number) => {
    saveToLocalStorage('buggle-options', { ...user?.preferences, [optionKey]: newValue })
    setUser((prevUser: UserData | null): UserData | null => {
      let nextOptions;
      if (prevUser) {
        console.log('prevuser, is user', prevUser)
        nextOptions = {
          ...prevUser,
          preferences: {
            ...prevUser.preferences,
            [optionKey]: newValue
          } as OptionsData
        };
        return nextOptions;
      } else if (user) {
        console.log('no prevuser, is user', user)
        nextOptions = {
          ...user,
          preferences: {
            ...user.preferences,
            [optionKey]: newValue
          } as OptionsData
        }
      } else {
        nextOptions = null;
      }
      console.log('NEXT OPTIONS', nextOptions);
      return nextOptions;
    });
    if (user) {
      saveUserPreference(optionKey, newValue);
    }
  }

  const handleConfirmGameExit = () => {
    changePhase('title');
    setPlayer({
      score: 0,
      wordsFound: new Set(),
    });
    setConfirmingGameExit(false);
  }

  const handleConfirmSignOut = () => {
    setConfirmingSignOut(false);
    setUserMenuShowing(false);
    handleSignOut();
  }

  return (
    <>
      <MessageBanner isOpen={false} message={'balls'} />
      <div
        className={'screen-container'}
        style={{
          opacity: userReady ? 1 : 0,
          // transform: userReady ? 'scaleX(1)' : 'scaleX(1.1)',
        }}
      >
        <TitleScreen hidden={phase !== 'title'} showOptions={() => setOptionsShowing(true)} />
        {userReady ?
          <>
        <CreateScreen hidden={phase !== 'create'} handleClickStoredPuzzle={startStoredPuzzle} startCreatedPuzzlePreview={startCreatedPuzzlePreview} />
        <SelectScreen hidden={phase !== 'select'} handleClickStoredPuzzle={startStoredPuzzle} startSinglePlayerGame={startSinglePlayerGame} />
        {phase === 'lobby' && <LobbyScreen hidden={phase !== 'lobby'} />}
        {phase === 'game' && currentGame &&
          < GameScreen
            hidden={phase !== 'game'}
            player={player}
            currentGame={currentGame}
            handleValidWord={handleValidWord}
            uploadPuzzle={uploadPuzzle}
          />
        }

        {userReady && optionsShowing && <OptionsScreen hidden={!optionsShowing} changeOption={changeOption} />}

        <Modal isOpen={confirmingGameExit} noCloseButton style={{
          height: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2rem',
          padding: '2.5rem',
        }}>
          <h3>Really leave the game?</h3>
          <div className={'button-group row'}>
            <button onClick={handleConfirmGameExit} className={'start'}>OK</button>
            <button onClick={() => setConfirmingGameExit(false)} className={'cancel'}>No</button>
          </div>
        </Modal>
        <Modal isOpen={confirmingSignOut} noCloseButton style={{
          height: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2rem',
          padding: '2.5rem',
        }}>
          <h3>Really sign out?</h3>
          <div className={'button-group row'}>
            <button onClick={handleConfirmSignOut} className={'start'}>OK</button>
            <button onClick={() => setConfirmingSignOut(false)} className={'cancel'}>No</button>
          </div>
        </Modal>
          </>
          :
          <div>loading...</div>
        }
      </div>
      <Footer
        optionsShowing={optionsShowing}
        userMenuShowing={userMenuShowing}
        showSignOutConfirm={() => setConfirmingSignOut(true)}
        showExitGameConfirm={() => setConfirmingGameExit(true)}
        toggleOptionsShowing={() => setOptionsShowing(!optionsShowing)}
        toggleUserMenuShowing={() => setUserMenuShowing(!userMenuShowing)}
      />
      <UserMenu
        userMenuShowing={userMenuShowing}
        showSignOutConfirm={() => setConfirmingSignOut(true)}
      />
    </>
  )
}

export default App
