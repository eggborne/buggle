import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from 'firebase/auth';
import { BestLists, BoardRequestData, CurrentGameData, DifficultyLevel, GameOptions, GeneratedBoardData, StoredPuzzleData, UserData } from "../types/types";
import { bestListPath, difficulties } from '../config.json';
import { stringTo2DArray, decodeMatrix, getRandomPuzzleWithinRange } from "./util";
import { getFirestore, doc, setDoc, getDoc, DocumentData, collection, getDocs, writeBatch, orderBy, where, Query, query } from "firebase/firestore";
import { createSolvedPuzzle } from "./fetch";

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

const loadBestLists = async (fileName: string): Promise<BestLists | undefined> => {
  try {
    const remotePath = `${bestListPath}${fileName}`;
    const response = await fetch(remotePath);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const bestLists = await response.json();
    return bestLists;
  } catch (error) {
    console.error('Error loading best lists:', error);
  }
};

const fetchRandomPuzzle = async (
  { difficulty, dimensions, timeLimit, wordBonus }: GameOptions,
  seenPuzzles: string[]
): Promise<CurrentGameData | null> => {
  try {
    const bestLists = await loadBestLists('best-totalWords.json') as BestLists;
    const diff = difficulty as DifficultyLevel;
    const difficultyAmounts = difficulties[diff].totalWords;
    const availablePuzzles: { [key: string]: number } = {};
    // for (const puzzleId in bestLists) {
    //   if (!seenPuzzles?.includes(puzzleId)) {
    //     availablePuzzles[puzzleId] = bestLists[puzzleId];
    //   }
    // }
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

const createUserInDatabase = async (userData: UserData) => {
  const userRef = doc(firestore, 'users', userData.uid);
  await setDoc(userRef, userData);
};

const getUserFromDatabase = async (uid: string) => {
  const userRef = doc(firestore, 'users', uid);
  return await getDoc(userRef);
};

const getCollectionFromDatabase = async (collectionId: string): Promise<DocumentData | undefined> => {
  const collectionRef = collection(firestore, collectionId);
  const querySnapshot = await getDocs(collectionRef);
  if (!querySnapshot.empty) {
    const data: Record<string, any> = {};
    querySnapshot.forEach(doc => {
      data[doc.id] = doc.data();
    });
    return data;
  } else {
    console.error('No documents found.');
    return undefined;
  }
}

export const updateBestPuzzles = async (size: number) => {
  const localLists = await loadBestLists(`${size}_all_puzzles.json`) as BestLists;
  const localStart = Date.now();
  const existingRemoteLists = await getCollectionFromDatabase(`puzzles_${size}`) || {};
  console.log('Got local list in', Date.now() - localStart, 'ms');  
  const localArr = Object.entries(localLists);
  const existingArr = Object.entries(existingRemoteLists);
  const newEntries = localArr.filter(([id, _]) =>
    !existingRemoteLists.hasOwnProperty(`${size}${size}${id}`)
);
if (newEntries.length) {
    const batchStart = Date.now();
    const batch = writeBatch(firestore);
    const collectionRef = collection(firestore, `puzzles_${size}`);
    newEntries.forEach(([letterString, data]) => {
      const size = Math.sqrt(letterString.length);
      const puzzleId = `${size}${size}${letterString}`;
      const newDocRef = doc(collectionRef, puzzleId);
      const puzzleData: StoredPuzzleData = {
        dimensions: {
          height: size,
          width: size,
        },
        letterString,
        ...data,
        dateCreated: Date.now(),
        id: puzzleId,
      }
      batch.set(newDocRef, puzzleData);
    });
    console.log('Created batch in', Date.now() - batchStart, 'ms');
  
    const commitStart = Date.now();
    try {
      await batch.commit();
      console.log(newEntries.length, 'size', size, 'puzzles sent successfully. New total:', (existingArr.length + newEntries.length));
      console.log('Took', Date.now() - commitStart, 'ms to commit.')
    } catch (error) {
      console.error('Error updating best puzzles:', error);
    }
  } else {
    console.log('No new puzzles to update. Existing total:', existingArr.length);
  }
}

const fetchThemedPuzzles = async (): Promise<StoredPuzzleData[] | null> => {
  try {
    const puzzlesCollection = collection(firestore, 'puzzles');
    const puzzlesQuery = query(puzzlesCollection, where('theme', '!=', null));
    const puzzlesSnapshot = await getDocs(puzzlesQuery);
    const puzzleList: StoredPuzzleData[] = [];
    puzzlesSnapshot.forEach((doc) => {
      const puzzleData = doc.data() as StoredPuzzleData;
      puzzleList.push(puzzleData);
    });
    return puzzleList;
  } catch (error) {
    console.error("Error fetching puzzles: ", error);
  }
  return null;
}

const findBestPuzzle = async (
  minTotalWords: number = 50,
  maxTotalWords: number = 9999,
  seenPuzzleIds: string[],
  size: number
): Promise<StoredPuzzleData | null> => {
  const puzzlesRef = collection(firestore, `puzzles_${size}`);

  let q: Query = query(puzzlesRef,
    where('totalWords', '>=', minTotalWords),
    where('totalWords', '<=', maxTotalWords),
    orderBy('totalWords'),  // Required for the range query
    orderBy('averageWordLength', 'desc')
  );
  
  const querySnapshot = await getDocs(q);

  let bestPuzzle: StoredPuzzleData | null = null;

  for (const doc of querySnapshot.docs) {
    const puzzleData = doc.data() as StoredPuzzleData;
    if (!seenPuzzleIds.includes(doc.id)) {
      bestPuzzle = puzzleData;
      return bestPuzzle;
    }
  }
  console.error('NO APPROPRIATE PUZZLE FOUND!')
  return null;
}

export {
  auth,
  database,
  firestore,
  createUserInDatabase,
  fetchPuzzleById,
  fetchRandomPuzzle,
  fetchThemedPuzzles,
  findBestPuzzle,
  getUserFromDatabase,
  getCollectionFromDatabase,
  loadBestLists,
}

