import { BoardRequestData, GeneratedBoardData } from "../types/types";

const generateUrl = process.env.NODE_ENV === 'development' ? `${location.protocol}//${location.hostname}:3000/language-api/generateBoggle/` : 'https://mikedonovan.dev/language-api/generateBoggle/';
const solveUrl = process.env.NODE_ENV === 'development' ? `${location.protocol}//${location.hostname}:3000/language-api/solveBoggle/` : 'https://mikedonovan.dev/language-api/solveBoggle/';

export const createSolvedPuzzle = async (options: BoardRequestData): Promise<GeneratedBoardData | undefined> => {
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

export const solvePuzzleFromLetterString = async (letterString: string): Promise<Record<string, string[]> | null> => {
  console.log('>>>>>>>>>>>>  Using API to solve', letterString);
  const fetchStart = Date.now();
  try {
    const rawResponse = await fetch(`${solveUrl}${letterString}`, {
      method: 'POST',
    });
    const response = await rawResponse.json();
    if (response.success) {
      const data: Record<string, string[]> = response.data
      console.log(`${response.message} in ${Date.now() - fetchStart}ms`);
      return data;
    } else {
      console.error(response.message);
    }
  } catch (error) {
    console.error('Error fetching puzzle:', error);
  }
  return null;
};