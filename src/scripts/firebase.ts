import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from 'firebase/auth';
import { BestLists, StoredPuzzleData, UserData } from "../types/types";
import { bestListPath } from '../config.json';
import { getFirestore, doc, setDoc, getDoc, DocumentData, collection, getDocs, writeBatch, orderBy, where, Query, query } from "firebase/firestore";

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

const fetchPuzzleById = async (puzzleId: string): Promise<StoredPuzzleData | null> => {
  const size = Math.sqrt(puzzleId.length - 2)
  const puzzleRef = doc(firestore, `puzzles_${size}`, puzzleId);
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
    const data: Record<string, Record<string, StoredPuzzleData>> = {};
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
    !(`${size}${size}${id}` in existingRemoteLists)
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

const fetchThemedPuzzles = async (size: number): Promise<StoredPuzzleData[] | null> => {
  try {
    const puzzlesCollection = collection(firestore, `puzzles_${size}`);
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

  const q: Query = query(puzzlesRef,
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
  fetchThemedPuzzles,
  findBestPuzzle,
  getUserFromDatabase,
  getCollectionFromDatabase,
  loadBestLists,
}

