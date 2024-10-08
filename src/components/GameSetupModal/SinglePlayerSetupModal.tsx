import styles from './GameSetupModal.module.css';
import { StoredPuzzleData, CurrentGameData } from '../../types/types';
import Modal from '../Modal';
import { useUser } from '../../context/UserContext';
import { useRef, useState } from 'react';
import StoredPuzzleList from '../StoredPuzzleList';
import { useFirebase } from '../../context/FirebaseContext';
import { gameDataFromStoredPuzzle } from '../../scripts/util';
import { difficulties } from '../../config.json';
import { findBestPuzzle } from '../../scripts/firebase';
import LoadingDisplay from '../LoadingDisplay';
import SizeSelection from '../SizeSelection';

interface SinglePlayerSetupModalProps {
  isOpen: boolean
  onClose: () => void
}

const SinglePlayerSetupModal = ({ isOpen, onClose }: SinglePlayerSetupModalProps) => {
  const { user, changePhase } = useUser();
  const { startNewGame, uploadPuzzle } = useFirebase();
  const [puzzleSelected, setPuzzleSelected] = useState<StoredPuzzleData | null>(null);
  const [puzzleListShowing, setPuzzleListShowing] = useState<boolean>(false);
  const [selectionType, setSelectionType] = useState<string>('random');
  const [sizeSelected, setSizeSelected] = useState<number>(4);
  const [generating, setGenerating] = useState(false);
  const timeLimitInputRef = useRef<HTMLSelectElement>(null);
  const wordBonusInputRef = useRef<HTMLSelectElement>(null);
  const difficultyInputRef = useRef<HTMLInputElement>(null);

  const handleClickStartGame = async () => {
    if (!user) return;
    setGenerating(true);
    let selected = puzzleSelected;
    if (selected) {
      console.log('clicked while puzzle selected', puzzleSelected);
    } else {
      const difficultyIndex = Object.keys(difficulties)[4 - Number(difficultyInputRef.current?.value || 4)] as keyof typeof difficulties;
      const difficultyRange = difficulties[difficultyIndex].totalWords;
      console.log('difficulty range', difficultyRange);
      console.log('Finding puzzle within range', difficultyRange.min, difficultyRange.max, 'not among', user.seenPuzzles?.length, 'seenPuzzles', user.seenPuzzles);
      selected = await findBestPuzzle(difficultyRange.min, difficultyRange.max, user.seenPuzzles || [], sizeSelected);
      console.log('got selected~', selected)
    }
    if (!selected) return;
    setGenerating(false);
    const notSolvedInDB = !selected.allWords;
    const dataFromStored = await gameDataFromStoredPuzzle(selected, user.uid);
    const newGameData = {
      ...dataFromStored,
      timeLimit: Number(timeLimitInputRef.current?.value),
      wordBonus: Number(wordBonusInputRef.current?.value)
    }
    if (newGameData) {
      onClose();
      startNewGame(newGameData as CurrentGameData);
      changePhase('game');
      if (notSolvedInDB) {
        uploadPuzzle(selected);
      }
    }
  }

  return (
    <div className={styles.SinglePlayerSetupModal}>
      <Modal
        isOpen={isOpen}
        noCloseButton
        className={styles.GameSetupModal}
      >
        <h1>Practice</h1>
        <div className={styles.puzzleOptions}>
          <SizeSelection sizeSelected={sizeSelected} handleChangeSize={(newSize: number) => setSizeSelected(newSize)} iconSize={{
            width: `4.5rem`,
            height: `4.5rem`
          }} />
          <div className={styles.puzzleSelectToggle}>
            <div role='button' className={`${styles.toggleButton} ${selectionType === 'random' ? styles.selected : ''}`} onClick={() => setSelectionType('random')}>Random</div>
            <div role='button' className={`${styles.toggleButton} ${selectionType === 'themed' ? styles.selected : ''}`} onClick={() => setSelectionType('themed')}>Themed</div>
          </div>
          {selectionType === 'random' ?
            <div className={`button-group ${styles.puzzleSelectRow}`}>
              <span>Word amount</span>
              <input ref={difficultyInputRef} type='range' name='difficulty' min='0' max='4' defaultValue={4}></input>
            </div>
            :
            <div className={`button-group row ${styles.puzzleSelectRow}`}>
              {puzzleSelected ?
                <button className={styles.themeSelectButton} onClick={() => setPuzzleListShowing(true)}>{puzzleSelected.theme}<p>click to change</p></button>
                :
                <button className={styles.themeSelectButton} onClick={() => setPuzzleListShowing(true)}>Select theme...</button>
              }
            </div>
          }
          <div className={`button-group row ${styles.timeSelectRow}`}>
            <span>Max time</span>
            <span>Word bonus</span>
            <select defaultValue='30' ref={timeLimitInputRef}>
              <option value='5'>5 seconds</option>
              <option value='10'>10 seconds</option>
              <option value='30'>30 seconds</option>
              <option value='120'>2 minutes</option>
            </select>
            <select defaultValue='30' ref={wordBonusInputRef}>
              <option value='5'>5 seconds</option>
              <option value='pointValue'>Boggle® value</option>
              {/* <option value='pointValue'>Scrabble® value</option> */}
            </select>
          </div>
        </div>
        <div className={`button-group ${styles.lowerButtons}`}>
          <button disabled={false} onClick={handleClickStartGame} className={`start ${styles.startButton}`}>Start Game</button>
          <button onClick={onClose} className={'cancel'}>Cancel</button>
        </div>
      </Modal>
      <Modal isOpen={puzzleListShowing} onClose={() => setPuzzleListShowing(false)}>
        <StoredPuzzleList showing={puzzleListShowing} size={sizeSelected} onClickStoredPuzzle={(puzzle) => {
          setPuzzleSelected(puzzle);
          setPuzzleListShowing(false);
        }} />
      </Modal>
      <Modal
        isOpen={generating}
        className={styles.LoadingModal}
        noCloseButton
        onClose={() => null}
      >
        <h2>Generating...</h2>
        <LoadingDisplay style={{
          height: '1rem'
        }} />
      </Modal>
    </div >
  );
}

export default SinglePlayerSetupModal;