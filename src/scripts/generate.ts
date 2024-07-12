import { randomInt, convertMatrix } from './util';
import { Trie } from "./trie";
import { CreatePuzzleOptions } from '../App';

const WORD_LIST_URL = process.env.NODE_ENV === 'development' ? 'https://mikedonovan.dev/buggle/wordsonlylist.json' : 'wordsonlylist.json';

let WORD_TRIE: Trie;

interface LetterFrequencyMap {
  [letter: string]: number;
}

const letterFrequencies: Record<string, LetterFrequencyMap> = {
  standardEnglish: { A: 42, B: 10, C: 23, D: 17, E: 56, F: 9, G: 12, H: 15, I: 38, J: 1, K: 6, L: 27, M: 15, N: 33, O: 36, P: 16, Q: 1, R: 38, S: 29, T: 35, U: 18, V: 5, W: 6, X: 1, Y: 9, Z: 1 },
  modifiedEnglish: { A: 5, E: 5, I: 5, O: 5, U: 5, B: 3, C: 4, D: 3, F: 3, G: 3, H: 3, J: 1, K: 2, L: 4, M: 3, N: 4, P: 3, Q: 1, R: 4, S: 4, T: 4, V: 2, W: 2, X: 1, Y: 2, Z: 1 },
  scrabble: { A: 9, B: 2, C: 2, D: 4, E: 12, F: 2, G: 3, H: 2, I: 9, J: 1, K: 1, L: 4, M: 2, N: 6, O: 8, P: 2, Q: 1, R: 6, S: 4, T: 6, U: 4, V: 2, W: 2, X: 1, Y: 2, Z: 1 },
  wordsWithFriends: { A: 9, B: 2, C: 2, D: 5, E: 13, F: 2, G: 3, H: 4, I: 8, J: 1, K: 1, L: 4, M: 2, N: 5, O: 8, P: 2, Q: 1, R: 6, S: 5, T: 7, U: 4, V: 2, W: 2, X: 1, Y: 2, Z: 1, },
  random: Object.fromEntries('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(letter => [letter, 1])),
};


const letterListfromFrequencyMap = (frequencyMap: LetterFrequencyMap) => {
  const proportionalArray = Object.entries(frequencyMap).flatMap(([letter, count]) => Array(count).fill(letter));
  return Array.from({ length: proportionalArray.length }, () => proportionalArray[randomInt(0, proportionalArray.length - 1)]);
};

const letterListFromCubeSet = (cubeSet: string[]) => {
  return cubeSet.map(cube => cube[randomInt(0, cube.length - 1)]);
}

const cubeSets = {
  regular: ['AAEEGN', 'ABBJOO', 'ACHOPS', 'AFFKPS', 'AOOTTW', 'CIMOTU', 'DEILRX', 'DELRVY', 'DISTTY', 'EEGHNW', 'EEINSU', 'EHRTVW', 'EIOSST', 'ELRTTY', 'HIMNUQ', 'HLNNRZ'],
  big: ['AAAFRS', 'AAEEEE', 'AAFIRS', 'ADENNN', 'AEEEEM', 'AEEGMU', 'AEGMNN', 'AFIRSY', 'BJKQXZ', 'CCENST', 'CEIILT', 'CEILPT', 'CEIPST', 'DDHNOT', 'DHHLOR', 'DHLNOR', 'DHLNOR', 'EIIITT', 'EMOTTT', 'ENSSSU', 'FIPRSY', 'GORRVW', 'IPRRRY', 'NOOTUW', 'OOOTTU'],
  superBig: ['AAAFRS', 'AAEEEE', 'AAEEOO', 'AAFIRS', 'ABDEIO', 'ADENNN', 'AEEEEM', 'AEEGMU', 'AEGMNN', 'AEILMN', 'AEINOU', 'AFIRSY', 'Q12345', 'BBJKXZ', 'CCENST', 'CDDLNN', 'CEIITT', 'CEIPST', 'CFGNUY', 'DDHNOT', 'DHHLOR', 'DHHNOW', 'DHLNOR', 'EHILRS', 'EIILST', 'EILPST', 'EIO000', 'EMTTTO', 'ENSSSU', 'GORRVW', 'HIRSTV', 'HOPRST', 'IPRSYY', 'JKQWXZ', 'NOOTUW', 'OOOTTU']
};

const fetchWords = async () => {
  console.warn('fetching words...')
  const fetchStart = Date.now();
  try {
    const response = await fetch(WORD_LIST_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.warn('got raw word list in', (Date.now() - fetchStart), 'ms');
    return data;
  } catch (error) {
    console.error('Error fetching word list:', error);
  }
};

const initializeTrie = async (wordList: string[]): Promise<Trie> => {
  const wordTrie = new Trie();
  let wordsDone = 0;
  for (const word of wordList.filter(word => word.length > 2)) {
    wordTrie.insert(word);
    wordsDone++;
  }
  console.warn('put', wordsDone, 'words in trie');
  return wordTrie;
}

const createDictionary = async () => {
  const wordList = await fetchWords();
  WORD_TRIE = await initializeTrie(wordList);
};

const findAllWords = (matrix: string[][], maximumPathLength: number): Set<string> => {
  const startTime = Date.now();
  const directions = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
  let checked = 0;
  const rows = matrix.length;
  const cols = matrix[0].length;
  const result: Set<string> = new Set();
  let visited: boolean[][] = Array.from({ length: rows }, () =>
    Array(cols).fill(false)
  );

  const dfs = (x: number, y: number, currentWord: string): void => {
    if (currentWord.length + matrix[x][y].length > maximumPathLength) return;
    visited[x][y] = true;
    for (const [dx, dy] of directions) {
      const newX = x + dx;
      const newY = y + dy;
      if (newX >= 0 && newY >= 0 && newX < rows && newY < cols && !visited[newX][newY]) {
        dfs(newX, newY, currentWord + matrix[newX][newY]);
      }
    }
    if (currentWord.length >= 3) {
      if (WORD_TRIE.search(currentWord.toUpperCase())) {
        result.add(currentWord);
      }
      checked++;
    }
    visited[x][y] = false;
  };

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      visited = Array.from({ length: rows }, () => Array(cols).fill(false));
      dfs(i, j, '');
    }
  }
  console.warn(`checked ${checked} paths in ${Date.now() - startTime}ms`);
  return result;
};

const generateLetterMatrix = (letters: string, width: number, height: number): string[][] => {
  const letterMatrix: string[][] = [];
  let atChar = 0;
  for (let i = 0; i < height; i++) {
    const row: string[] = [];
    for (let j = 0; j < width; j++) {
      row.push(letters[atChar]);
      atChar++;
    }
    letterMatrix.push(row);
  }
  return convertMatrix(letterMatrix);
};

const generateBoard = async ({ puzzleSize, maximumPathLength, letterDistribution }: CreatePuzzleOptions): Promise<{ randomMatrix: string[][]; wordList: Set<string> }> => {
  let letterList;
  const { width, height } = puzzleSize;
  if (width === height && letterDistribution === 'boggle') {
    if (width === 4) {
      letterList = letterListFromCubeSet(cubeSets.regular);
      console.warn('using freq map cubes.regular')
    } else if (width === 5) {
      letterList = letterListFromCubeSet(cubeSets.big);
      console.warn('using freq map cubes.big')
    } else if (width === 6) {
      letterList = letterListFromCubeSet(cubeSets.superBig);
      console.warn('using freq map cubes.superBig')
    } else {
      letterList = letterListfromFrequencyMap(letterFrequencies.standard);
      console.warn('using freq map letterFrequencies')
    }
  } else {
    letterList = letterListfromFrequencyMap(letterFrequencies[letterDistribution]);
  }
  const randomMatrix = generateLetterMatrix(letterList.join(''), width, height);
  const wordListData = findAllWords(randomMatrix, maximumPathLength);
  const wordList = new Set(Array.from(wordListData).sort((a, b) => a.length - b.length));
  console.log(wordList.size, 'words in puzzle', randomMatrix.flat().join(''));
  return { randomMatrix, wordList };
}

export {
  createDictionary,
  generateBoard,
};