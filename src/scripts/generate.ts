import { wordTrie } from '../App';

const tieredLetters = [
  ['E', 'A', 'O', 'I', 'U'],
  ['L', 'N', 'S', 'T', 'R'],
  ['D', 'G'],
  ['B', 'C', 'M', 'P'],
  ['F', 'H', 'V', 'W', 'Y', 'K'],
  ['J', 'X'],
  ['Q', 'Z']
].map((tier, index) => tier.flatMap(letter => Array([12, 10, 8, 4, 3, 2, 1][index]).fill(letter)))
  .reduce((acc, val) => acc.concat(val), []);

const generateLetterMatrix = (width: number, height: number): string[][] => {
  document.documentElement.style.setProperty('--puzzle-width', width.toString());
  document.documentElement.style.setProperty('--puzzle-height', height.toString());
  const letters = tieredLetters.join('');
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

const findAllWords = (matrix: string[][]): Set<string> => {
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

    // const maxPathLength = (rows * cols);
    const maxPathLength = 10;

    if (currentWord.length >= maxPathLength) {
      return;
    }

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
      checked++;
      if (wordTrie.search(currentWord)) {
        result.add(currentWord);
      }
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

const generateBoard = async (width: number, height: number): Promise<{ randomMatrix: string[][]; wordList: Set<string> }> => {
  const randomMatrix = generateLetterMatrix(width, height);
  const wordListData = findAllWords(randomMatrix);
  const wordList = new Set(Array.from(wordListData).sort((a, b) => a.length - b.length));
  console.log(wordList.size, 'words in puzzle', randomMatrix.flat().join(''), wordList)
  return { randomMatrix, wordList };
}

export {
  generateBoard,
};