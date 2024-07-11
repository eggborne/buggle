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

export const debounce = <T extends (...args: any[]) => void>(func: T, delay: number): (...args: Parameters<T>) => void => {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, delay);
  };
};
