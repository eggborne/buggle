import styles from './SelectScreen.module.css'
// import PuzzleIcon from '../PuzzleIcon'
import GameSetupModal from '../GameSetupModal/GameSetupModal';
import { updateBestPuzzles } from '../../scripts/firebase';

interface SelectScreenProps {
  hidden: boolean;
}

function SelectScreen({ hidden }: SelectScreenProps) {
  // const { user, changePhase } = useUser();
  // const { startNewGame } = useFirebase();

  // const handleClickStoredPuzzle = async (puzzle: StoredPuzzleData) => {
  //   if (!user) return;
  //   const newGameData = await gameDataFromStoredPuzzle(puzzle, user.uid);
  //   if (newGameData) {
  //     await startNewGame(newGameData);
  //     changePhase('game');
  //   } else {
  //     console.error('did not get proper newGameData from getDataFromStoredPuzzle.')
  //   }
  // }

  const selectScreenClass = `${styles.SelectScreen}${hidden ? ' hidden' : ''}`;
  return (
    <main className={selectScreenClass}>
      <GameSetupModal />
      {process.env.NODE_ENV === 'development' &&
        <button className={'debug-button'} onClick={async () => {
          console.warn('clicked update puzzles')
          updateBestPuzzles(6);
        }}>Update puzzles
        </button>}
    </main>
  )
}

export default SelectScreen;