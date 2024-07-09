import { Trie } from "./scripts/trie";
import { useState, useEffect } from 'react'
import './App.css'
import Header from './components/Header'
import StatusBar from './components/StatusBar'
import TitleScreen from './components/TitleScreen'
import SelectScreen from './components/SelectScreen'
import GameScreen from './components/GameScreen'
import OptionsScreen from './components/OptionsScreen'
import { generateBoard } from './scripts/generate'

interface PuzzleDimensions {
  width: number;
  height: number;
}

export interface SinglePlayerOptions {
  puzzleSize: PuzzleDimensions;
  minimumWordAmount: number;
}

export interface PlayerData {
  score: number;
  wordsFound: Set<string>;
}
export interface CurrentGameData {
  allWords: Set<string>;
  timeLimit: number;
  gridSize: PuzzleDimensions;
}

interface PointValues {
  [key: number]: number;
}

interface PuzzleData {
  allWords: Set<string>;
  letters: string;
  gridSize: PuzzleDimensions;
}

const wordListUrl = 'https://mikedonovan.dev/buggle/wordsonlylist.json';
export const wordTrie = new Trie();

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
  for (const word of wordList) {
    wordTrie.insert(word);
    wordsDone++;
  }
  return wordTrie;
}

const pointValues: PointValues = { 3: 1, 4: 1, 5: 2, 6: 3, 7: 5, 8: 11, }

function App() {
  const [wordListFetched, setWordListFetched] = useState<boolean>(false);
  const [dictionaryLoaded, setDictionaryLoaded] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [statusShowing, setStatusShowing] = useState<boolean>(false);
  const [phase, setPhase] = useState<string>('title');
  const [letterMatrix, setLetterMatrix] = useState<string[][]>([]);
  const [puzzleSize, setPuzzleSize] = useState<PuzzleDimensions>({ width: 4, height: 4 });
  const [minimumWordAmount, setMinimumWordAmount] = useState<number>(50);

  const [player, setPlayer] = useState<PlayerData>({
    score: 0,
    wordsFound: new Set(),
  });
  const [currentGame, setCurrentGame] = useState<CurrentGameData>({
    allWords: new Set(),
    gridSize: {
      width: 5,
      height: 5,
    },
    timeLimit: 60,
  });

  useEffect(() => {
    const buildDictionary = async () => {
      const fetchStart = Date.now();
      const wordList = await fetchWords();      
      setWordListFetched(true);
      const fetchTime = (Date.now() - fetchStart);
      console.log(wordList);
      console.log(wordList.length, `words downloaded in ${fetchTime}ms`);
      const listStatusElement = document.getElementById('list-status');
      if (listStatusElement) {
        listStatusElement.innerText = `${wordList.length} words downloaded in ${fetchTime}ms`;
      }      
      console.log('first:', wordList[0]);
      console.log('last:', wordList[wordList.length-1])
      const trieStart = Date.now();
      await initializeTrie(wordList);
      setDictionaryLoaded(true);
      const dictTime = (Date.now() - trieStart);
      console.log(`Dictionary built in ${dictTime}ms`);
      const dictStatusElement = document.getElementById('dict-status');
      if (dictStatusElement) {
        dictStatusElement.innerText = `Dictionary built in ${dictTime}ms`;
      }
    }
    buildDictionary();
  }, []);

  const handleValidWord = (word: string) => {
    console.warn("Valid word:", word);
    if (player.wordsFound.has(word)) {
      console.error('already found', word)
    } else {
      let wordValue;
      if (word.length >= 8) {
        wordValue = pointValues[8];
      } else {
        wordValue = pointValues[word.length];
      }
      const nextPlayer = { ...player };
      nextPlayer.score += wordValue;
      nextPlayer.wordsFound.add(word);
      setPlayer(nextPlayer);
    }
  };

  const getPuzzle = async (options: SinglePlayerOptions) => {
    const nextPuzzle = await generateBoard(options.puzzleSize.width, options.puzzleSize.height);
    if (nextPuzzle.wordList.size < options.minimumWordAmount) {
      getPuzzle(options);
    } else {
      setLetterMatrix(nextPuzzle.randomMatrix);

      const nextGameData = {
        allWords: nextPuzzle.wordList,
        timeLimit: 60,
        gridSize: {
          width: options.puzzleSize.width,
          height: options.puzzleSize.height,
        },
      }
      setCurrentGame(nextGameData)
    }
  }

  const changePhase = (newPhase: string) => {
    setPhase(newPhase);
  }

  const startSinglePlayerGame = async (options: SinglePlayerOptions) => {
    const nextPuzzleSize = {
      width: options.puzzleSize.width,
      height: options.puzzleSize.height
    };
    setPuzzleSize(nextPuzzleSize);
    setMinimumWordAmount(options.minimumWordAmount);
    setPhase('select')
    await getPuzzle(options);
    setPhase('game-board');
  }

  return (
    <>
      <StatusBar message={statusMessage} showing={statusShowing} dictionaryLoaded={dictionaryLoaded} wordListFetched={wordListFetched} />
      {phase === 'title' && <TitleScreen changePhase={changePhase} startSinglePlayerGame={startSinglePlayerGame} />}
      {phase === 'options' && <OptionsScreen changePhase={changePhase} />}
      {phase === 'select' && <SelectScreen changePhase={changePhase} />}
      {phase === 'game-board' &&
        <GameScreen
          player={player}
          currentGame={currentGame}
          letterMatrix={letterMatrix}
          handleValidWord={handleValidWord}
        />}
      <Header phase={phase} changePhase={changePhase} />
    </>
  )
}

export default App
