import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from 'firebase/auth';
import { BestLists, BoardRequestData, CurrentGameData, DifficultyLevel, GameOptions, GeneratedBoardData, StoredPuzzleData, UserData } from "../types/types";
import { difficulties } from '../config.json';
import { stringTo2DArray, decodeMatrix, getRandomPuzzleWithinRange } from "./util";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const database = getDatabase(app);
const firestore = getFirestore(app);


console.warn('Firebase initialized.');

const loadBestLists = async (): Promise<BestLists | undefined> => {
  try {
    const response = await fetch('https://mikedonovan.dev/buggle-training-data/research/best_lists.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const bestLists = await response.json();
    console.log('got bestLists', bestLists)
    return bestLists;
  } catch (error) {
    console.error('Error loading best lists:', error);
  }
};

const fetchRandomPuzzle = async ({ difficulty, dimensions, timeLimit, wordBonus }: GameOptions, seenPuzzles: string[]): Promise<CurrentGameData | null> => {
  try {
    const bestLists = await loadBestLists() as BestLists;
    const diff = difficulty as DifficultyLevel;
    const difficultyAmounts = difficulties[diff].totalWords;
    const availablePuzzles: { [key: string]: number } = {};
    for (const puzzleId in bestLists) {
      if (!seenPuzzles?.includes(puzzleId)) {
        availablePuzzles[puzzleId] = bestLists[puzzleId];
      }
    }
    console.log('--- User has seen', seenPuzzles.length);
    console.log('selecting among', Object.entries(availablePuzzles).length, 'availablePuzzles')
    const randomLetterList = getRandomPuzzleWithinRange(availablePuzzles, difficultyAmounts.min, difficultyAmounts.max)
    const letters = randomLetterList ? randomLetterList[0] : null;

    const nextMatrix = stringTo2DArray(letters || '', dimensions.width, dimensions.height);

    const randomPuzzleOptions = {
      dimensions,
      letterDistribution: 'boggle',
      maxAttempts: 1,
      returnBest: true,
      customizations: {
        customLetters: {
          letterList: letters?.split('') || [],
          convertQ: true,
          shuffle: false,
        }
      }
    } as BoardRequestData;

    const randomPuzzle = await createSolvedPuzzle(randomPuzzleOptions);
    if (randomPuzzle) {
      const nextGameData: CurrentGameData = {
        ...randomPuzzle,
        dimensions,
        allWords: new Set(randomPuzzle.wordList),
        letterMatrix: decodeMatrix(nextMatrix, randomPuzzle.metadata.key),
        gameOver: false,
        playerProgress: {},
        timeLimit,
        wordBonus
      };
      return nextGameData;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching random puzzle:", error);
    throw error; // Re-throw the error for higher-level handling
  }
};

const fetchPuzzleById = async (puzzleId: string): Promise<StoredPuzzleData | null> => {
  const puzzleRef = doc(firestore, 'puzzles', puzzleId);
  const snapshot = await getDoc(puzzleRef);
  if (snapshot.exists()) {
    return snapshot.data() as StoredPuzzleData;
  } else {
    return null;
  }
}

const generateUrl = process.env.NODE_ENV === 'development' ? `${location.protocol}//${location.hostname}:3000/language-api/generateBoggle/` : 'https://mikedonovan.dev/language-api/generateBoggle/';

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
      console.warn('<<<<<<  returning GeneratedBoardData', response.data);
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

const createUserInDatabase = async (userData: UserData) => {
  const userRef = doc(firestore, 'users', userData.uid);
  await setDoc(userRef, userData);
};

const getUserFromDatabase = async (uid: string) => {
  const userRef = doc(firestore, 'users', uid);
  return await getDoc(userRef);
};

export {
  auth,
  database,
  firestore,
  createSolvedPuzzle,
  createUserInDatabase,
  fetchPuzzleById,
  fetchRandomPuzzle,
  getUserFromDatabase,
  loadBestLists,
}

