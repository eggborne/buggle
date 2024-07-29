import { useState, useEffect } from 'react';
import { triggerShowMessage } from './hooks/useMessageBanner';
import { useUser } from './context/UserContext';
import './App.css'
import {
  // BannerOptions,
  BoardRequestData,
  ConfirmData,
  CurrentGameData,
  GameOptions,
  GeneratedBoardData,
  OptionsData,
  PlayerData,
  PointValues,
  StoredPuzzleData,
  UserData,
} from './types/types';
import LoadingDisplay from './components/LoadingDisplay';
import Footer from './components/Footer';
import TitleScreen from './components/TitleScreen';
import LobbyScreen from './components/LobbyScreen';
import SelectScreen from './components/SelectScreen';
import GameScreen from './components/GameScreen';
import OptionsModal from './components/OptionsModal';
import CreateScreen from './components/CreateScreen';
import { set, get, ref, child } from 'firebase/database';
import { database } from './scripts/firebase';
import { stringTo2DArray, randomInt, decodeMatrix, encodeMatrix } from "./scripts/util";
import MessageBanner from './components/MessageBanner/';
import SideMenu from './components/SideMenu';
import { useFirebase } from './context/FirebaseContext';
import ConfirmModal from './components/ConfirmModal';

const defaultUserPreferences = {
  style: {
    cubeColor: "#ddddca",
    cubeRoundness: 39,
    cubeScale: 62,
    cubeTextColor: "#2b2b2b",
    footerHeight: 3,
    gameBackgroundColor: "#837693",
    gameBoardBackgroundColor: "#a19191",
    gameBoardSize: 1,
  },
  gameplay: {
    swipeBuffer: 70,
  }
};

export const defaultUser: UserData = {
  displayName: 'Guest',
  photoURL: '/assets/generic-user-icon.jpg',
  phase: 'title',
  preferences: defaultUserPreferences,
  uid: 'GuestId'
};


const difficultyWordAmounts: Record<string, { min: number, max: number }> = {
  easy: { min: 200, max: 10000 },
  medium: { min: 150, max: 250 },
  hard: { min: 1, max: 150 }
};
const pointValues: PointValues = { 3: 1, 4: 1, 5: 2, 6: 3, 7: 5, 8: 11 };

function App() {
  const {
    user,
    isLoading,
    isLoggedIn,
    changePhase,
    handleSignOut,

  } = useUser();
  const phase = user?.phase;
  const { revokeOutgoingChallenges } = useFirebase();
  const [userReady, setUserReady] = useState<boolean>(false);
  const [optionsShowing, setOptionsShowing] = useState<boolean>(false);
  const [sideMenuShowing, setSideMenuShowing] = useState<boolean>(false);
  const [confirmShowing, setConfirmShowing] = useState<ConfirmData | null>(null);

  const [player, setPlayer] = useState<PlayerData>({
    score: 0,
    wordsFound: new Set(),
  });

  const [currentGame, setCurrentGame] = useState<CurrentGameData | null>(null);

  useEffect(() => {
    if (!isLoading && !userReady) {
      console.log('setting userReady');
      isLoggedIn && revokeOutgoingChallenges(user?.uid || '');
      requestAnimationFrame(() => {
        setUserReady(true);
      })
    }
  }, [isLoading]);

  useEffect(() => {
    if (isLoggedIn && user) {
      triggerShowMessage(`${user?.displayName} logged in!`);
    }
  }, [isLoggedIn]);

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

  const showConfirmModal = (confirmData: ConfirmData | null, hide?: boolean) => {
    if (!confirmData) return;
    if (hide) {
      setConfirmShowing({
        ...confirmData,
        typeOpen: ''
      });
      return;
    }
    setConfirmShowing(confirmData);
  };

  const handleConfirmGameExit = () => {
    changePhase('title');
    setPlayer({
      score: 0,
      wordsFound: new Set(),
    });
  }

  const handleConfirmSignOut = async () => {
    setSideMenuShowing(false);
    handleSignOut();
    revokeOutgoingChallenges(user?.uid || '');
  }

  return (
    isLoading ? <LoadingDisplay /> :
      <>
        <MessageBanner />
        <div
          className={'screen-container'}
          style={{
            opacity: userReady ? 1 : 0,
          }}
        >
          <TitleScreen hidden={phase !== 'title'} showOptions={() => setOptionsShowing(true)} />
          <CreateScreen hidden={phase !== 'create'} handleClickStoredPuzzle={startStoredPuzzle} startCreatedPuzzlePreview={startCreatedPuzzlePreview} />
          <SelectScreen hidden={phase !== 'select'} handleClickStoredPuzzle={startStoredPuzzle} startSinglePlayerGame={startSinglePlayerGame} />
          {phase === 'lobby' && <LobbyScreen hidden={phase !== 'lobby'} />}
          {phase === 'game' && currentGame &&
            <GameScreen
              hidden={phase !== 'game'}
              player={player}
              currentGame={currentGame}
              handleValidWord={handleValidWord}
              showConfirmModal={showConfirmModal}
              uploadPuzzle={uploadPuzzle}
            />
          }
          {/* {userReady && <OptionsScreen hidden={!optionsShowing} changeOption={changeOption} />} */}
          {<OptionsModal hidden={!optionsShowing} />}
          <ConfirmModal
            // isOpen={!!(confirmShowing && confirmShowing.typeOpen)}
            isOpen={confirmShowing ? confirmShowing.typeOpen !== '' : false}
            message={confirmShowing?.message || ''}
            style={{ height: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', padding: '2.5rem' }}
            onConfirm={() => {
              confirmShowing?.typeOpen === 'leaveGame' ? handleConfirmGameExit() : handleConfirmSignOut();
              changePhase(confirmShowing?.targetPhase || '');
              showConfirmModal(confirmShowing, true);
            }}
            onCancel={() => {
              showConfirmModal(confirmShowing, true);
            }}
          />
        </div>
        <Footer
          optionsShowing={optionsShowing}
          sideMenuShowing={sideMenuShowing}
          // showSignOutConfirm={() => setConfirmingSignOut(true)}
          showConfirmModal={showConfirmModal}
          // showExitGameConfirm={() => setConfirmingGameExit(true)}
          toggleOptionsShowing={() => setOptionsShowing(!optionsShowing)}
          toggleSideMenuShowing={() => setSideMenuShowing(!sideMenuShowing)}
        />
        <SideMenu
          sideMenuShowing={sideMenuShowing}
          setOptionsShowing={() => { setOptionsShowing(true); setSideMenuShowing(false) }}
          showConfirmModal={showConfirmModal}
        />
      </>
  )
}

export default App
