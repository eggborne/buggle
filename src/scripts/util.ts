import { difficulties, letterKeys } from '../config.json'
import { CurrentGameData, StoredPuzzleData } from '../types/types';
import { solvePuzzleFromLetterString } from './fetch';

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

export const findBucket = (listScore: number) => {
  for (const [difficulty, { totalWords }] of Object.entries(difficulties)) {
    if (listScore >= totalWords.min && listScore <= totalWords.max) {
      return difficulty;
    }
  }
  return 'easy';
}

export const gameDataFromStoredPuzzle = async (puzzle: StoredPuzzleData, userUid: string, opponentUid?: string): Promise<CurrentGameData | null> => {
  console.log('gameDataFromStoredPuzzle got puzzle', puzzle)
  if (!puzzle.allWords) {
    console.error('no word list!');
    const puzzleData = await solvePuzzleFromLetterString(puzzle.letterString);
    console.log('got puzzleData', puzzleData)
    puzzle.allWords = puzzleData?.wordList || [];
  }
  if (puzzle.allWords.length !== puzzle.totalWords) {
    console.error('***************** Different total words on solving saved puzzle!', puzzle.letterString);
    return null;
  }
  const nextMatrix = stringTo2DArray(puzzle.letterString, puzzle.dimensions.width, puzzle.dimensions.height);
  const key = letterKeys[puzzle.dimensions.width === 4 ? 'boggle' : puzzle.dimensions.width === 5 ? 'bigBoggle' : puzzle.dimensions.width === 6 ? 'superBigBoggle' : 'boggle'];
  const newGameData = {
    dimensions: puzzle.dimensions,
    allWords: new Set(puzzle.allWords),
    letterMatrix: decodeMatrix(nextMatrix, key),
    playerProgress: {
      [userUid]: {
        attackPoints: 0,
        foundOpponentWords: {},
        uid: userUid,
        score: 0,
        touchedCells: [],
      },
    },
    metadata: {
      totalWords: puzzle.totalWords,
      averageWordLength: puzzle.averageWordLength,
      commonWordAmount: puzzle.commonWordAmount,
      dateCreated: puzzle.dateCreated,
      key: puzzle.key,
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
