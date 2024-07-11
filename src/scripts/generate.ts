import { randomInt } from './util';
import { Trie } from "./trie";
import { CreatePuzzleOptions } from '../App';

const wordListUrl = 'https://mikedonovan.dev/buggle/wordsonlylist.json';

const wordTrie = new Trie();

const letterFrequencies: { [letter: string]: number } = {
  A: 42, B: 10, C: 23, D: 17, E: 56, F: 9, G: 12, H: 15, I: 38,
  J: 1, K: 6, L: 27, M: 15, N: 33, O: 36, P: 16, Q: 1, R: 38,
  S: 29, T: 35, U: 18, V: 5, W: 6, X: 1, Y: 9, Z: 1
};

const letterListfromFrequencyMap = (frequencyMap: { [letter: string]: number }): string[] => {
  const proportionalArray = Object.entries(frequencyMap).flatMap(([letter, count]) => Array(count).fill(letter));
  return Array.from({ length: proportionalArray.length }, () => proportionalArray[randomInt(0, proportionalArray.length - 1)]);
};

const cubes = {
  regular: ['AAEEGN', 'ABBJOO', 'ACHOPS', 'AFFKPS', 'AOOTTW', 'CIMOTU', 'DEILRX', 'DELRVY', 'DISTTY', 'EEGHNW', 'EEINSU', 'EHRTVW', 'EIOSST', 'ELRTTY', 'HIMNUQ', 'HLNNRZ'],
  big: ['AAAFRS', 'AAEEEE', 'AAFIRS', 'ADENNN', 'AEEEEM', 'AEEGMU', 'AEGMNN', 'AFIRSY', 'BBJKXZ', 'CCENST', 'EIILST', 'CEIPST', 'DDHNOT', 'DHHLOR', 'DHHNOW', 'DHLNOR', 'EIIITT', 'EILPST', 'EMOTTT', 'ENSSSU', 'ENSSSU', 'GORRVW', 'IPRSYY', 'NOOTUW', 'OOOTTU'],
  superBig: ['AAAFRS', 'AAEEEE', 'AAEEOO', 'AAFIRS', 'ABDEIO', 'ADENNN', 'AEEEEM', 'AEEGMU', 'AEGMNN', 'AEILMN', 'AEINOU', 'AFIRSY', 'AFIRSY', 'BBJKXZ', 'CCENST', 'CDDLNN', 'CEIITT', 'CEIPST', 'CFGNUY', 'DDHNOT', 'DHHLOR', 'DHHNOW', 'DHLNOR', 'EHILRS', 'EIILST', 'EILPST', 'EIO000', 'EMTTTO', 'ENSSSU', 'GORRVW', 'HIRSTV', 'HOPRST', 'IPRSYY', 'JKQWXZ', 'NOOTUW', 'OOOTTU']
};

const letterListFromCubes = (cubes: string[]): string[] => cubes.map(cube => cube[randomInt(0, cube.length - 1)]);

// const tieredLetters = [ ['E', 'A', 'O', 'I', 'U'], ['L', 'N', 'S', 'T', 'R'], ['D', 'G'], ['B', 'C', 'M', 'P'], ['F', 'H', 'V', 'W', 'Y', 'K'], ['J', 'X'], ['Q', 'Z'] ].map((tier, index) => tier.flatMap(letter => Array([12, 10, 8, 4, 3, 2, 1][index]).fill(letter))) .reduce((acc, val) => acc.concat(val), []);

const generateLetterMatrix = (letters: string, width: number, height: number): string[][] => {
  document.documentElement.style.setProperty('--puzzle-width', width.toString());
  document.documentElement.style.setProperty('--puzzle-height', height.toString());

  const letterMatrix: string[][] = [];

  for (let i = 0; i < height; i++) {
    const row: string[] = [];
    for (let j = 0; j < width; j++) {
      const randomLetter = letters.charAt(Math.floor(Math.random() * letters.length));
      row.push(randomLetter);
    }
    letterMatrix.push(row);
  }

  return letterMatrix;
};

const findAllWords = (matrix: string[][], maximumPathLength: number): Set<string> => {
  let checked = 0;
  const startTime = Date.now();
  const rows = matrix.length;
  const cols = matrix[0].length;
  const result: Set<string> = new Set();
  const visited: boolean[][] = Array.from({ length: rows }, () =>
    Array(cols).fill(false)
  );

  const directions = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

  const dfs = (x: number, y: number, currentWord: string): void => {

    if (currentWord.length >= maximumPathLength) return;

    visited[x][y] = true;

    for (const [dx, dy] of directions) {
      const newX = x + dx;
      const newY = y + dy;
      if (
        newX >= 0 &&
        newY >= 0 &&
        newX < rows &&
        newY < cols &&
        !visited[newX][newY]
      ) {
        dfs(newX, newY, currentWord + matrix[newX][newY]);
      }
    }

    if (currentWord.length >= 3) {
      if (wordTrie.search(currentWord)) {
        result.add(currentWord);
      }
      checked++;
    }

    visited[x][y] = false;
  };

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      dfs(i, j, matrix[i][j]);
    }
  }

  const timeElapsed = Date.now() - startTime;
  console.warn("checked", checked, "paths in", timeElapsed, "ms");
  return result;
};

const generateBoard = async ({ puzzleSize, maximumPathLength, letterDistribution }: CreatePuzzleOptions): Promise<{ randomMatrix: string[][]; wordList: Set<string> }> => {
  let letterList;
  const { width, height } = puzzleSize;
  if (width === height && letterDistribution === 'boggle') {
    if (width === 4) {
      letterList = letterListFromCubes(cubes.regular);
      console.warn('using freq map cubes.regular')
    } else if (width === 5) {
      letterList = letterListFromCubes(cubes.big);
      console.warn('using freq map cubes.big')
    } else if (width === 6) {
      letterList = letterListFromCubes(cubes.superBig);
      console.warn('using freq map cubes.superBig')
    } else {
      letterList = letterListfromFrequencyMap(letterFrequencies);
      console.warn('using freq map letterFrequencies')
    }
  } else {
    letterList = letterListfromFrequencyMap(letterFrequencies);
    console.warn('using freq map letterFrequencies')
  }
  const randomMatrix = generateLetterMatrix(letterList.join(''), width, height);
  const wordListData = findAllWords(randomMatrix, maximumPathLength);
  const wordList = new Set(Array.from(wordListData).sort((a, b) => a.length - b.length));
  console.log(wordList.size, 'words in puzzle', randomMatrix.flat().join(''), wordList)
  return { randomMatrix, wordList };
}

const fetchWords = async () => {
  console.warn('fetching words...')
  const fetchStart = Date.now();
  try {
    const response = await fetch(wordListUrl);
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

const initializeTrie = async (wordList: string[]) => {
  let wordsDone = 0;
  for (const word of wordList.filter(word => word.length > 2)) {
    wordTrie.insert(word);
    wordsDone++;
  }
  console.warn('put', wordsDone, 'words in trie')
  return wordTrie;
}

const fetchWordList = async () => {
  const fetchStart = Date.now();
  const wordList = await fetchWords();
  const fetchTime = (Date.now() - fetchStart);
  console.log(wordList.length, `words downloaded in ${fetchTime}ms`);
  const listStatusElement = document.getElementById('list-status');
  if (listStatusElement) {
    listStatusElement.innerText = `${wordList.length} words downloaded in ${fetchTime}ms`;
  }
  return wordList;
}
const buildTrie = async (wordList: string[]) => {
  const trieStart = Date.now();
  await initializeTrie(wordList);
  const dictTime = (Date.now() - trieStart);
  console.log(`Dictionary built in ${dictTime}ms`);
  const dictStatusElement = document.getElementById('dict-status');
  if (dictStatusElement) {
    dictStatusElement.innerText = `Dictionary built in ${dictTime}ms`;
  }
}

const createDictionary = async () => {
  const wordList = await fetchWordList();
  await buildTrie(wordList);
}

export {
  createDictionary,
  generateBoard,
};