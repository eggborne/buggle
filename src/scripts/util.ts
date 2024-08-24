import { arrayUnion, doc, updateDoc } from 'firebase/firestore';
import { difficulties } from '../config.json'
import { firestore, getPuzzleListFromDatabase, loadBestLists } from './firebase';
import { BestLists, CurrentGameData, StoredPuzzleData, UserData } from '../types/types';

export const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
export const pause = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));
export const stringTo2DArray = (input: string, width: number, height: number): string[][] => {
  const result: string[][] = [];
  let index = 0;
  for (let i = 0; i < height; i++) {
    const row: string[] = [];
    for (let j = 0; j < width; j++) {
      row.push(input[index]);
      index++;
    }
    result.push(row);
  }
  return result;
}

export const saveToLocalStorage = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    console.log(`Data saved successfully with key: ${key}`);
  } catch (error) {
    console.error('Error saving data to local storage:', error);
  }
};

export const getFromLocalStorage = <T>(key: string): T | null => {
  try {
    const storedValue = localStorage.getItem(key);
    if (storedValue) {
      return JSON.parse(storedValue);
    } else {
      console.log(`No data found with key: ${key}`);
      return null;
    }
  } catch (error) {
    console.error('Error getting data from local storage:', error);
    return null;
  }
};

export const debounce = <Args extends unknown[], R>(func: (...args: Args) => R, delay: number): (...args: Args) => void => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return (...args: Args) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, delay);
  };
};


export const decodeMatrix = (matrix: string[][], key: Record<string, string> | undefined): string[][] => {
  if (!key) return matrix;
  console.log('decoding matrix', matrix)
  console.log('decoding with', key)
  const convertedMatrix = matrix.map(row =>
    row.map(cell => {
      cell = cell.toLowerCase();
      return Object.prototype.hasOwnProperty.call(key, cell) ? key[cell] : cell;
    })
  );
  return convertedMatrix;
}

export const encodeMatrix = (matrix: string[][], key: Record<string, string> | undefined): string[][] => {
  if (!key) return matrix;
  console.log('encoding matrix', matrix)
  console.log('emcoding with', key)
  const reversedKey: Record<string, string> = Object.fromEntries(
    Object.entries(key).map(([k, v]) => [v, k])
  );

  const unconvertedMatrix = matrix.map(row =>
    row.map(cell => {
      cell = cell.toLowerCase();
      return Object.prototype.hasOwnProperty.call(reversedKey, cell) ? reversedKey[cell] : cell;
    })
  );
  return unconvertedMatrix;
};

export const formatDateAndTime = (dateCreated: number) => {
  const date = new Date(dateCreated);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear().toString().slice(-2);
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const amPm = hours >= 12 ? 'pm' : 'AM';

  // Convert hour from 24-hour to 12-hour format
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'

  const formattedDate = `${month.toString()}/${day.toString().padStart(2, '0')}/${year}`;
  const formattedTime = `${hours}:${minutes.toString().padStart(2, '0')}${amPm}`;
  return { date: formattedDate, time: formattedTime };
};

export const getRandomPuzzleWithinRange = (puzzles: { [key: string]: number }, min: number, max: number): [string, number] | null => {
  // Filter the entries that are within the range
  const validEntries = Object.entries(puzzles).filter(
    ([, value]) => value >= min && value <= max
  );

  // If there are no valid entries, return null
  if (validEntries.length === 0) {
    return null;
  }

  // Select a random entry from the valid entries
  const randomIndex = Math.floor(Math.random() * validEntries.length);
  return validEntries[randomIndex];
}

const findBucket = (listScore: number) => {
  for (const [difficulty, { totalWords }] of Object.entries(difficulties)) {
    if (listScore >= totalWords.min && listScore <= totalWords.max) {
      return difficulty;
    }
  }
  return 'easy';
}

export const updateLetterLists = async (): Promise<void> => {
  try {
    let newCount = 0;
    const bestLists = await loadBestLists() as BestLists;
    const existingList = await getPuzzleListFromDatabase() || {};
    for (const puzzleId in bestLists) {
      const listScore = bestLists[puzzleId];
      const currentItem = { letterList: puzzleId, totalWords: listScore };
      const targetBucketName = findBucket(listScore);
      const keyList = Object.values(existingList).flat().map(e => e.letterList);
      if (existingList && !keyList.includes(currentItem.letterList)) {
        const docRef = doc(firestore, `letterLists`, '4');
        await updateDoc(docRef, {
          [targetBucketName]: arrayUnion(currentItem),
        });
        newCount++;
        console.log('Added', currentItem, 'to', targetBucketName);
      }
    }
    console.warn('LIST UPDATED! NEW:', newCount);
  } catch (error) {
    console.error("Error updating bestLists:", error);
    throw error; // Re-throw the error for higher-level handling
  }
};

export const gameDataFromStoredPuzzle = (puzzle: StoredPuzzleData, userUid: string, opponentUid?: string): CurrentGameData => {
  const nextMatrix = stringTo2DArray(puzzle.letterString, puzzle.dimensions.width, puzzle.dimensions.height);
  const newGameData = {
    ...puzzle,
    allWords: new Set(puzzle.allWords),
    letterMatrix: decodeMatrix(nextMatrix, puzzle.metadata.key),
    playerProgress: {
      [userUid]: {
        attackPoints: 0,
        foundOpponentWords: {},
        uid: userUid,
        score: 0,
        touchedCells: [],
      },
    },
    gameOver: false,
    startTime: Date.now(),
    endTime: Date.now() + (600 * 1000),
    timeLimit: 600,
    wordBonus: 5,
  }
  if (opponentUid) {
    newGameData.playerProgress[opponentUid] = {
      attackPoints: 0,
      foundOpponentWords: {},
      uid: opponentUid,
      score: 0,
      touchedCells: [],
    }
  }
  return newGameData;
}
