import { useState, useEffect } from 'react'
import './App.css'
import { useUser } from './context/UserContext.tsx';
import Footer from './components/Footer/Footer.tsx'
import TitleScreen from './components/TitleScreen/TitleScreen.tsx'
import LobbyScreen from './components/LobbyScreen/LobbyScreen.tsx'
import SelectScreen from './components/SelectScreen/SelectScreen.tsx'
import GameScreen from './components/GameScreen/GameScreen.tsx'
import OptionsScreen from './components/OptionsScreen/OptionsScreen.tsx'
import CreateScreen from './components/CreateScreen/CreateScreen.tsx'
import { set, get, ref, child } from 'firebase/database';
import { database } from './scripts/firebase';
import { stringTo2DArray, randomInt, saveToLocalStorage, getFromLocalStorage, decodeMatrix, encodeMatrix } from "./scripts/util.ts";
import Modal from './components/Modal.tsx'

export type WordLength = number;
export type Comparison = string;
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface PlayerData {
  score: number;
  wordsFound: Set<string>;
}

export interface UserData {
  currentGame?: CurrentGameData;
  displayName: string | null,
  photoURL: string | null,
  phase: string | null;
  preferences: OptionsData | null;
  uid: string | null,
}

interface PuzzleMetadata {
  averageWordLength: number;
  dateCreated: number;
  percentUncommon: number;
  key?: Record<string, string>;
}

export interface PuzzleDimensions {
  height: number;
  width: number;
}

export interface ComparisonFilterData {
  comparison: Comparison,
  value: number,
}

export interface SinglePlayerOptions {
  difficulty: Difficulty;
  dimensions: PuzzleDimensions;
}

export interface StoredPuzzleData {
  allWords: string[];
  dimensions: PuzzleDimensions;
  letterString: string;
  metadata: PuzzleMetadata;
}

export type WordLengthPreference = {
  comparison: Comparison;
  wordLength: WordLength;
  value: number;
};

interface BoardCustomizations {
  requiredWords?: {
    wordList: string[],
    convertQ?: boolean,
  };
  customLetters?: {
    letterList: string[],
    convertQ?: boolean,
    shuffle?: boolean;
  };
}

interface BoardFilters {
  averageWordLengthFilter?: ComparisonFilterData;
  totalWordLimits?: { min?: number, max?: number };
  uncommonWordLimit?: ComparisonFilterData;
  wordLengthLimits?: WordLengthPreference[];
}

export interface BoardRequestData {
  dimensions: PuzzleDimensions;
  letterDistribution?: string;
  maxAttempts: number;
  returnBest: boolean;
  customizations?: BoardCustomizations;
  filters?: BoardFilters;
}

interface GeneratedBoardData {
  attempts: number,
  matrix: string[][];
  wordList: string[];
  metadata: PuzzleMetadata;
  customizations?: BoardCustomizations;
  filters?: BoardFilters;
}

export interface CurrentGameData {
  allWords: Set<string>;
  dimensions: PuzzleDimensions;
  letterMatrix: string[][];
  metadata: {
    key?: Record<string, string>;
    percentUncommon: number;
  };
  customizations?: BoardCustomizations;
  filters?: BoardFilters;
  timeLimit: number;
}

interface PointValues {
  [key: number]: number;
}

export interface OptionsData {
  cubeColor: string,
  cubeTextColor: string,
  footerHeight: number,
  cubeGap: number;
  cubeRoundness: number;
  gameBackgroundColor: string;
  gameBoardBackgroundColor: string,
  gameBoardPadding: number;
  gameBoardSize: number;
  swipeBuffer: number;
}

const defaultUserOptions = {
  cubeColor: '#aaaaaa',
  cubeGap: 44,
  cubeTextColor: '#222222',
  cubeRoundness: 32,
  footerHeight: 16,
  gameBackgroundColor: '#223300',
  gameBoardBackgroundColor: '#2a283e',
  gameBoardPadding: 32,
  gameBoardSize: 96,
  swipeBuffer: 70,
};

const difficultyWordAmounts: Record<Difficulty, { min: number, max: number }> = {
  easy: { min: 200, max: 10000 },
  medium: { min: 150, max: 250 },
  hard: { min: 1, max: 150 }
};
const pointValues: PointValues = { 3: 1, 4: 1, 5: 2, 6: 3, 7: 5, 8: 11 };

function App() {
  const { user, isLoggedIn, setUser } = useUser();
  const [options, setOptions] = useState<OptionsData>(defaultUserOptions);
  const [phase, setPhase] = useState<string>('title');
  const [optionsShowing, setOptionsShowing] = useState<boolean>(false);
  const [confirmingGameExit, setConfirmingGameExit] = useState<boolean>(false);

  const [player, setPlayer] = useState<PlayerData>({
    score: 0,
    wordsFound: new Set(),
  });

  const [currentGame, setCurrentGame] = useState<CurrentGameData>({
    allWords: new Set(),
    dimensions: {
      width: 5,
      height: 5,
    },
    letterMatrix: [],
    metadata: {
      percentUncommon: 0,
      key: undefined,
    },
    timeLimit: 60,
  });

  useEffect(() => {
    if (isLoggedIn && user) {
      console.warn('App.useEffect[isLoggedIn]: USER SIGNED IN!', user);
      const getUserData = async () => {
        const dbRef = ref(database);
        const snapshot = await get(child(dbRef, `users/${user.uid}`));
        if (snapshot.exists()) {
          const userData: UserData = snapshot.val();
          setUser(userData);
          console.log('set userData', userData);
          // setOptions(userData.preferences);
          
        } else {
          // create in database
          const userData: UserData = {
            ...user,
            phase,
            preferences: options,
          };
          console.log(`No user data available for uid ${userData.uid}. Creating new user in database!`);
          console.log('sending user data to db:', userData)
          await set(ref(database, `users/${userData.uid}`), userData);
        }
      }
      getUserData();
    } else {
      // check for local saved options
      let initialOptions = defaultUserOptions;
      const localOptions = getFromLocalStorage('buggle-options') as OptionsData;
      if (localOptions) {
        initialOptions = localOptions;
        console.warn('found local options', initialOptions);
      } else {
        console.warn('using default options', initialOptions);
      }
      setOptions(initialOptions);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    window.addEventListener('popstate', function () {
      history.pushState(null, '', document.URL);
    });
    history.pushState(null, '', document.URL);
  }, []);

  useEffect(() => {
    for (const optionKey in options) {
      const varName = '--user-' + optionKey.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
      const newValue = options[optionKey as keyof OptionsData].toString();
      document.documentElement.style.setProperty(varName, newValue)
    }    
  }, [options]);

  const saveUserPreference = async (optionKey: string, newValue: string | number) => {
    console.warn('-- sending options to DB');
    await set(ref(database, `users/${user?.uid}/preferences/${optionKey}`), newValue);
    console.warn('-- sent options to DB');

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

  const fetchRandomPuzzle = async ({ dimensions, difficulty }: SinglePlayerOptions): Promise<CurrentGameData> => {
    const dbRef = ref(database);
    const snapshot = await get(child(dbRef, `puzzles/`));
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
      timeLimit: 60,
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

  const createPuzzle = async (options: BoardRequestData): Promise<CurrentGameData | undefined> => {
    const nextPuzzle = await createSolvedPuzzle(options);
    if (nextPuzzle) {
      const nextGameData: CurrentGameData = {
        allWords: new Set(nextPuzzle.wordList),
        letterMatrix: nextPuzzle.matrix,
        dimensions: {
          width: options.dimensions.width,
          height: options.dimensions.height,
        },
        metadata: nextPuzzle.metadata,
        customizations: nextPuzzle.customizations,
        filters: nextPuzzle.filters,
        timeLimit: 60,
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
      timeLimit: 60,
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

  const changePhase = (newPhase: string) => {
    if (phase === 'game') {
      if (currentGame) {
        setConfirmingGameExit(true);
        return;
      }
    }
    setPhase(newPhase);
  }

  const startSinglePlayerGame = async (options: SinglePlayerOptions) => {
    const randomPuzzle = await fetchRandomPuzzle(options);
    setCurrentGame(randomPuzzle);
    setPhase('game');
  }

  const startCreatedPuzzlePreview = async (options: BoardRequestData) => {
    const newPuzzlePreview = await createPuzzle(options);
    if (newPuzzlePreview) {
      setCurrentGame(newPuzzlePreview)
      setPhase('game');
    }
    return;
  }

  const changeOption = (optionKey: string, newValue: string | number) => {
    console.log('changing', optionKey, 'to', newValue);
    saveToLocalStorage('buggle-options', { ...options, [optionKey]: newValue })
    setOptions(prevOptions => {
      return { ...prevOptions, [optionKey]: newValue };
    });
    if (isLoggedIn && user) {
      saveUserPreference(optionKey, newValue);
    }
  }

  const handleConfirmGameExit = () => {
    setConfirmingGameExit(false);
    setPhase('title');
  }

  // const multiplayerGameId = 'public/1' // for testing

  return (
    <>
      <div className={'screen-container'}>
        <TitleScreen hidden={phase !== 'title'} changePhase={changePhase} showOptions={() => setOptionsShowing(true)} />
        <CreateScreen hidden={phase !== 'create'} handleClickStoredPuzzle={startStoredPuzzle} startCreatedPuzzlePreview={startCreatedPuzzlePreview} />
        <SelectScreen hidden={phase !== 'select'} handleClickStoredPuzzle={startStoredPuzzle} startSinglePlayerGame={startSinglePlayerGame} />
        {phase === 'lobby' && <LobbyScreen hidden={phase !== 'lobby'} />}
        {phase === 'game' &&
          <GameScreen
            // gameId={multiplayerGameId}
            hidden={phase !== 'game'}
            player={player}
            currentGame={currentGame}
            options={options}
            handleValidWord={handleValidWord}
            uploadPuzzle={uploadPuzzle}
          />
        }
        <OptionsScreen hidden={!optionsShowing} options={options} changeOption={changeOption} />

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
      </div>
      <Footer
        phase={phase}
        changePhase={changePhase}
        toggleOptionsShowing={() => setOptionsShowing(!optionsShowing)}
        optionsShowing={optionsShowing}
      />
    </>
  )
}

export default App
