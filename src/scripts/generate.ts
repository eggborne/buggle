import { Trie } from "./trie";

const fetchWords = async () => {
  const fetchStart = Date.now();
  try {
    const response = await fetch('https://mikedonovan.dev/language-api/wordsonlylist.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.warn('got raw word list in', (Date.now() - fetchStart), 'ms')
    return data;
  } catch (error) {
    console.error('Error fetching word list:', error);
  }
};

const wordList = await fetchWords();
const wordTrie = new Trie();
let wordsDone = 0;

const startTime = Date.now();
for (const word of wordList) {
  wordTrie.insert(word);
  wordsDone++;
}
console.log(wordsDone, 'words added to wordTrie in', (Date.now() - startTime), 'ms');

const tieredLetters = [
  ['E', 'A', 'O', 'I', 'U'],
  ['L', 'N', 'S', 'T', 'R'],
  ['D', 'G'],
  ['B', 'C', 'M', 'P'],
  ['F', 'H', 'V', 'W', 'Y', 'K'],
  ['J', 'X'],
  ['Q', 'Z']
].map((tier, index) => tier.flatMap(letter => Array([12, 10, 5, 4, 3, 2, 1][index]).fill(letter)))
  .reduce((acc, val) => acc.concat(val), []);

const generateLetterMatrix = (size: number): string[][] => {
  const letters = tieredLetters.join('');
  const letterMatrix: string[][] = [];

  for (let i = 0; i < size; i++) {
    const row: string[] = [];
    for (let j = 0; j < size; j++) {
      const randomLetter = letters.charAt(Math.floor(Math.random() * letters.length));
      row.push(randomLetter);
    }
    letterMatrix.push(row);
  }

  return letterMatrix;
};

const isValidWord = async (word: string): Promise<boolean> => {
  console.log('checking', word)
  try {
    const fetchUrl = `https://mikedonovan.dev/language-api/check?word=${word}`;
    const response = await fetch(fetchUrl);
    const data = await response.json();
    console.log('response', data);
    return data.exists;
  } catch (error) {
    console.error('Error checking word validity:', word, error);
    return false;
  }
};

const findAllWords = async (matrix: string[][]): Promise<Set<string>> => {
  let checked = 0;
  const startTime = Date.now();
  const rows = matrix.length;
  const cols = matrix[0].length;
  const result: Set<string> = new Set();
  const visited: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false));
  const directions = [
    [0, 1], [1, 0], [0, -1], [-1, 0],
    [1, 1], [-1, -1], [1, -1], [-1, 1]
  ];

  const cache: Map<string, boolean> = new Map();

  const dfs = async (x: number, y: number, currentWord: string): Promise<void> => {
    if (currentWord.length > 2) {
      if (cache.has(currentWord)) {
        if (cache.get(currentWord)) {
          result.add(currentWord);
        }
      } else {
        const valid = wordTrie.search(currentWord);
        checked++;
        cache.set(currentWord, valid);
        if (valid) {
          result.add(currentWord);
        }
      }
    }

    if (currentWord.length >= 10) {
      return;
    }

    visited[x][y] = true;

    for (const [dx, dy] of directions) {
      const newX = x + dx;
      const newY = y + dy;

      if (newX >= 0 && newY >= 0 && newX < rows && newY < cols && !visited[newX][newY]) {
        await dfs(newX, newY, currentWord + matrix[newX][newY]);
      }
    }

    visited[x][y] = false;
  };

  const promises = [];
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      promises.push(dfs(i, j, matrix[i][j]));
    }
  }

  await Promise.all(promises);
  const timeElapsed = Date.now() - startTime;
  console.log('checked', checked, 'words in', timeElapsed, 'ms');
  return result;
};


const generateBoard = async (size: number): Promise<{ randomMatrix: string[][]; wordList: Set<string> }> => {
  const randomMatrix = generateLetterMatrix(size);
  const wordList = await findAllWords(randomMatrix);
  console.log('generateBoard generated', randomMatrix);
  console.log(wordList.size, 'in wordList', wordList)
  return { randomMatrix, wordList };
}

export {
  generateBoard,
  wordTrie,
};