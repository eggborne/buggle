import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from 'firebase/auth';
import { BoardRequestData, CurrentGameData, GameOptions, GeneratedBoardData, StoredPuzzleData, UserData } from "../types/types";
import { difficultyWordAmounts } from "../App";
import { randomInt, stringTo2DArray, decodeMatrix } from "./util";
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, where, DocumentData, Query, query, WhereFilterOp } from "firebase/firestore";
// import { getAnalytics } from "firebase/analytics";

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
const database = getDatabase(app);
const auth = getAuth(app);
// const analytics = getAnalytics(app);

console.warn('Firebase initialized.');

const fetchRandomPuzzle = async ({ dimensions, difficulty }: GameOptions): Promise<CurrentGameData> => {
  try {
    const puzzlesCollection = collection(firestore, 'puzzles');
    const wordLimits = difficultyWordAmounts[difficulty];

    const q = query(
      puzzlesCollection,
      where('dimensions.width', '==', dimensions.width),
      where('dimensions.height', '==', dimensions.height),
      where('wordCount', '>=', wordLimits.min),
      where('wordCount', '<=', wordLimits.max)
    )
    const puzzlesSnapshot = await getDocs(q);
    if (puzzlesSnapshot.empty) {
      throw new Error('No matching puzzles found');
    }
    const randomPool = puzzlesSnapshot.docs.map(doc => doc.data()) as StoredPuzzleData[];
    const randomPuzzle: StoredPuzzleData = randomPool[randomInt(0, randomPool.length - 1)];
    const nextMatrix = stringTo2DArray(randomPuzzle.letterString, dimensions.width, dimensions.height);
    const nextGameData: CurrentGameData = {
      ...randomPuzzle,
      allWords: new Set(randomPuzzle.allWords),
      letterMatrix: decodeMatrix(nextMatrix, randomPuzzle.metadata.key),
      dimensions: {
        width: dimensions.width,
        height: dimensions.height,
      },
      gameOver: false,
      playerProgress: {},
    };

    return nextGameData;
  } catch (error) {
    console.error("Error fetching random puzzle:", error);
    throw error; // Re-throw the error for higher-level handling
  }
};

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

const firestore = getFirestore();

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
  fetchRandomPuzzle,
  getUserFromDatabase,
}

