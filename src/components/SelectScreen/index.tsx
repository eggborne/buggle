import { useState } from 'react'
import styles from './SelectScreen.module.css'
import { StoredPuzzleData } from '../../types/types';
// import PuzzleIcon from '../PuzzleIcon'
import Modal from '../Modal';
import StoredPuzzleList from '../StoredPuzzleList';
import { useFirebase } from '../../context/FirebaseContext';
import { useUser } from '../../context/UserContext';
import { gameDataFromStoredPuzzle } from '../../scripts/util';
import GameSetupModal from '../GameSetupModal/GameSetupModal';
import { updateBestPuzzles } from '../../scripts/firebase';

interface SelectScreenProps {
  hidden: boolean;
}

function SelectScreen({ hidden }: SelectScreenProps) {
  const { user, changePhase } = useUser();
  const { startNewGame } = useFirebase();
  const [listShowing, setListShowing] = useState<boolean>(false);

  // const getRandomPuzzleWithOptions = async (newGameOptions: GameOptions): Promise<CurrentGameData | null> => {
  //   const seenPuzzles = user?.seenPuzzles || [];
  //   const fetchedPuzzle = await fetchRandomPuzzle(newGameOptions, seenPuzzles);
  //   if (user) {
  //     const newUser: UserData = {
  //       ...user,
  //       seenPuzzles: [
  //         ...(user.seenPuzzles ?? []),
  //         ...(fetchedPuzzle ? [fetchedPuzzle.letterMatrix.flat().join('')] : [])
  //       ]
  //     }
  //     setUser(newUser);
  //   }
  //   if (!fetchedPuzzle) return null;
  //   const newGameData: CurrentGameData = {
  //     ...fetchedPuzzle,
  //     allWords: Array.from(fetchedPuzzle.allWords),
  //     startTime: Date.now(),
  //     endTime: Date.now() + (newGameOptions.timeLimit * 1000),
  //     timeLimit: newGameOptions.timeLimit,
  //   }
  //   return newGameData;
  // };

  // const handleClickStartRandomGame = async (e: React.FormEvent<HTMLFormElement>) => {
  //   e.preventDefault();
  //   if (!user) return;
  //   const target = e.currentTarget as HTMLFormElement;
  //   const difficultyIndex = Number((target.elements.namedItem('difficulty') as HTMLSelectElement).value);
  //   const difficulty = Object.keys(difficulties)[4 - difficultyIndex];
  //   const newGameOptions: GameOptions = {
  //     difficulty,
  //     dimensions: {
  //       width: sizeSelected,
  //       height: sizeSelected
  //     },
  //     timeLimit: Number((target.elements.namedItem('timeLimit') as HTMLSelectElement).value),
  //     wordBonus: Number((target.elements.namedItem('wordBonus') as HTMLSelectElement).value),
  //   };
  //   const newGameData = await getRandomPuzzleWithOptions(newGameOptions);
  //   if (!newGameData) return;
  //   newGameData.playerProgress = {
  //     [user.uid]: {
  //       attackPoints: 0,
  //       foundOpponentWords: {},
  //       uid: user.uid,
  //       score: 0,
  //       touchedCells: [],
  //     },
  //   };
  //   newGameData.wordBonus = 5;
  //   await startNewGame(newGameData);
  //   changePhase('game');
  // }

  const handleClickStoredPuzzle = async (puzzle: StoredPuzzleData) => {
    if (!user) return;
    const newGameData = await gameDataFromStoredPuzzle(puzzle, user.uid);
    if (newGameData) {
      await startNewGame(newGameData);
      changePhase('game');
    } else {
      console.error('did not get proper newGameData from getDataFromStoredPuzzle.')
    }
  }

  const selectScreenClass = `${styles.SelectScreen}${hidden ? ' hidden' : ''}`;
  return (
    <main className={selectScreenClass}>
      <GameSetupModal />
      {process.env.NODE_ENV === 'development' &&
        <button className={'debug-button'} onClick={async () => {
          console.warn('clicked update puzzles')
          updateBestPuzzles(4);
        }}>Update puzzles
        </button>}
      <Modal isOpen={listShowing} onClose={() => setListShowing(false)}>
        <>
          <h2>Saved puzzles</h2>
          <StoredPuzzleList showing={listShowing} onClickStoredPuzzle={async (e) => {
            handleClickStoredPuzzle(e);
            if (listShowing) {
              setListShowing(false);
            }
          }} />
        </>
      </Modal>
    </main>
  )
}

export default SelectScreen;