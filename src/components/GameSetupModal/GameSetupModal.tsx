import styles from './GameSetupModal.module.css';
import { ChallengeData, PendingOutgoingChallengeData, StoredPuzzleData } from '../../types/types';
import Modal from '../Modal';
import { useUser } from '../../context/UserContext';
import { ref, push, update } from 'firebase/database';
import { MouseEventHandler, useRef, useState } from 'react';
import { triggerShowMessage } from '../../hooks/useMessageBanner';
import { database } from '../../scripts/firebase';
import StoredPuzzleList from '../StoredPuzzleList';
import { useFirebase } from '../../context/FirebaseContext';
import { gameDataFromStoredPuzzle } from '../../scripts/util';
import PuzzleIcon from '../PuzzleIcon';

interface GameSetupModalProps {

}

const GameSetupModal = ({

}: GameSetupModalProps) => {
  const { user, changePhase } = useUser();
  const { startNewGame } = useFirebase();
  const [puzzleSelected, setPuzzleSelected] = useState<StoredPuzzleData | null>(null);
  const [puzzleListShowing, setPuzzleListShowing] = useState<boolean>(false);
  const [selectionType, setSelectionType] = useState<string>('themed');
  const [sizeSelected, setSizeSelected] = useState<number>(4);
  const timeLimitInputRef = useRef<HTMLSelectElement>(null);
  const wordBonusInputRef = useRef<HTMLSelectElement>(null);
  const difficultyInputRef = useRef<HTMLInputElement>(null);

  const handleClickStartGame = async () => {
    if (!user) return;
    let newGameData;
    if (puzzleSelected) {
      console.log('clicked while puzzle selected', puzzleSelected);
      newGameData = gameDataFromStoredPuzzle(puzzleSelected, user.uid);
      newGameData = {
        ...newGameData,
        timeLimit: Number(timeLimitInputRef.current?.value),
        wordBonus: Number(wordBonusInputRef.current?.value)
      }
    } else {
      const difficultyIndex = Number(difficultyInputRef.current?.value);

    }
    if (!newGameData) return;
    await startNewGame(newGameData);
    changePhase('game');
  }

  return (
    <div className={styles.GameSetupModal}>
      <h1>Single Player</h1>
      <div className={styles.puzzleOptions}>
        <div className={styles.sizeSelections}>
          <span style={{ borderColor: sizeSelected === 4 ? '#8f8' : 'transparent' }}
            onClick={() => setSizeSelected(4)}
          ><PuzzleIcon iconSize={{
            width: `4rem`,
            height: `4rem`
          }} puzzleDimensions={{ width: 4, height: 4 }} contents={[]} /></span>
          <span style={{ borderColor: sizeSelected === 5 ? '#8f8' : 'transparent' }}
          // onClick={() => setSizeSelected(5)}
          ><PuzzleIcon iconSize={{
            width: `4rem`,
            height: `4rem`
          }} puzzleDimensions={{ width: 5, height: 5 }} contents={[]} /></span>
          <span style={{ borderColor: sizeSelected === 6 ? '#8f8' : 'transparent' }}
          // onClick={() => setSizeSelected(6)}
          ><PuzzleIcon iconSize={{
            width: `4rem`,
            height: `4rem`
          }} puzzleDimensions={{ width: 6, height: 6 }} contents={[]} /></span>
        </div>
        <div className={styles.puzzleSelectToggle}>
          <div role='button' className={`${styles.toggleButton} ${selectionType === 'random' ? styles.selected : ''}`} onClick={() => setSelectionType('random')}>Random</div>
          <div role='button' className={`${styles.toggleButton} ${selectionType === 'themed' ? styles.selected : ''}`} onClick={() => setSelectionType('themed')}>Themed</div>
        </div>
        {selectionType === 'random' ?
          <div className={`button-group ${styles.puzzleSelectRow}`}>
            <span>Word amount</span>
            <input ref={difficultyInputRef} type='range' name='difficulty' max='4' defaultValue={4}></input>
          </div>
          :
          <div className={`button-group row ${styles.puzzleSelectRow}`}>
            {puzzleSelected ?
              <button className={styles.themeSelectButton} onClick={() => setPuzzleListShowing(true)}>{puzzleSelected.theme}<p>click to change</p></button>
              :
              <button className={styles.themeSelectButton} onClick={() => setPuzzleListShowing(true)}>Select puzzle...</button>
            }
          </div>
        }
        <div className={`button-group row ${styles.timeSelectRow}`}>
          <span>Max time</span>
          <select defaultValue='30' ref={timeLimitInputRef}>
            <option value='5'>5 seconds</option>
            <option value='10'>10 seconds</option>
            <option value='30'>30 seconds</option>
            <option value='120'>2 minutes</option>
          </select>
        </div>
        <div className={`button-group row ${styles.timeSelectRow}`}>
          <span>Word bonus</span>
          <select defaultValue='30' ref={wordBonusInputRef}>
            <option value='5'>5 seconds</option>
            <option value='pointValue'>Boggle® value</option>
            {/* <option value='pointValue'>Scrabble® value</option> */}
          </select>
        </div>
      </div>
      <div className={`button-group ${styles.lowerButtons}`}>
        <button disabled={!puzzleSelected} onClick={handleClickStartGame} className={'start'}>Start Game</button>
      </div>
      <Modal isOpen={puzzleListShowing} onClose={() => setPuzzleListShowing(false)}>
        <StoredPuzzleList showing={puzzleListShowing} onClickStoredPuzzle={(puzzle) => {
          setPuzzleSelected(puzzle);
          setPuzzleListShowing(false);
        }} />
      </Modal>
    </div>
  );
}

export default GameSetupModal;