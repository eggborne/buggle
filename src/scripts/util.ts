export const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
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

const BOGGLE_LETTER_KEY: Record<string, string> = { '0': '', '1': 'In', '2': 'Th', '3': 'Er', '4': 'He', '5': 'An', 'Q': 'Qu' }

export const convertMatrix = (matrix: string[][], key: Record<string, string> = BOGGLE_LETTER_KEY): string[][] => {
  const convertedMatrix = matrix.map(row =>
    row.map(cell => {
      return Object.prototype.hasOwnProperty.call(key, cell) ? key[cell] : cell;
    })
  );
  return convertedMatrix;
}

export const unconvertMatrix = (matrix: string[][], key: Record<string, string> = BOGGLE_LETTER_KEY): string[][] => {
  const reversedKey: Record<string, string> = Object.fromEntries(
    Object.entries(key).map(([k, v]) => [v, k])
  );

  const unconvertedMatrix = matrix.map(row =>
    row.map(cell => {
      return Object.prototype.hasOwnProperty.call(reversedKey, cell) ? reversedKey[cell] : cell;
    })
  );
  return unconvertedMatrix;
};
