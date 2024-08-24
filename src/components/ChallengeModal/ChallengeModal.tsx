import styles from './ChallengeModal.module.css';
import { ChallengeData, PendingOutgoingChallengeData, StoredPuzzleData } from '../../types/types';
import Modal from '../Modal';
import { useUser } from '../../context/UserContext';
import { ref, push, update } from 'firebase/database';
import { useRef, useState } from 'react';
import { triggerShowMessage } from '../../hooks/useMessageBanner';
import { database } from '../../scripts/firebase';
import StoredPuzzleList from '../StoredPuzzleList';

interface ChallengeModalProps {
  pendingOutgoingChallenge: PendingOutgoingChallengeData | null;
  setPendingOutgoingChallenge: (pendingOutgoingChallenge: PendingOutgoingChallengeData | null) => void;
}

const ChallengeModal = ({
  pendingOutgoingChallenge,
  setPendingOutgoingChallenge,
}: ChallengeModalProps) => {
  const { user, setSentChallenges, sentChallenges } = useUser();
  const [puzzleSelected, setPuzzleSelected] = useState<StoredPuzzleData | null>(null);
  const [puzzleListShowing, setPuzzleListShowing] = useState<boolean>(false);
  const [selectionType, setSelectionType] = useState<string>('random');
  const timeLimitInputRef = useRef<HTMLSelectElement>(null);
  const wordBonusInputRef = useRef<HTMLSelectElement>(null);
  // const [sizeSelected, setSizeSelected] = useState<number>(5);


  const sendChallenge = async () => {
    if (user && pendingOutgoingChallenge && timeLimitInputRef.current && wordBonusInputRef.current) {
      if (sentChallenges.length > 0 && sentChallenges.some(c => c.respondentUid === pendingOutgoingChallenge.respondent.uid)) {
        // should never be able to occur as there would be no button
        console.warn('already challenging');
        triggerShowMessage(`Already challenging ${pendingOutgoingChallenge.respondent.displayName}!`);
        return;
      }
      const challengesRef = ref(database, 'challenges/');
      const newChallenge: ChallengeData = {
        accepted: false,
        difficulty: 'easy',
        instigatorUid: user.uid,
        respondentUid: pendingOutgoingChallenge.respondent.uid,
        timeLimit: Number(timeLimitInputRef.current.value),
        wordBonus: Number(wordBonusInputRef.current.value)
      }
      if (puzzleSelected) {
        newChallenge.puzzleId = `${puzzleSelected.dimensions.width}${puzzleSelected.dimensions.height}${puzzleSelected.letterString}`;
      }
      const newChallengeId = await push(challengesRef, newChallenge).key;
      if (newChallengeId) {
        triggerShowMessage(`Challenge sent to ${pendingOutgoingChallenge.respondent.displayName}!`);
        setSentChallenges(prevSentChallenges => {
          const nextSentChallenges = [...prevSentChallenges];
          const newChallengeData = { ...newChallenge, id: newChallengeId };
          nextSentChallenges.push(newChallengeData);
          return nextSentChallenges;
        });
        await update(ref(database, `challenges/${newChallengeId}`), { id: newChallengeId });
        setPendingOutgoingChallenge(null);
      }
    }
  };

  return (
    <>
      <Modal isOpen={pendingOutgoingChallenge !== null} noCloseButton
        style={{
          height: 'auto',
          minHeight: '100vmin',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          justifyContent: 'space-between',
          gap: '2rem',
          padding: '2.5rem',
        }}
      >
        <h3>Challenging {pendingOutgoingChallenge?.respondent.displayName}</h3>
        <div className={styles.puzzleOptions}>
          {/* <div className={styles.sizeSelections}>
            <span style={{ borderColor: sizeSelected === 4 ? '#8f8' : 'transparent' }} onClick={() => setSizeSelected(4)}><PuzzleIcon iconSize={{
              width: `4.5rem`,
              height: `4.5rem`
            }} puzzleDimensions={{ width: 4, height: 4 }} contents={[]} /></span>
            <span style={{ borderColor: sizeSelected === 5 ? '#8f8' : 'transparent' }} onClick={() => setSizeSelected(5)}><PuzzleIcon iconSize={{
              width: `4.5rem`,
              height: `4.5rem`
            }} puzzleDimensions={{ width: 5, height: 5 }} contents={[]} /></span>
            <span style={{ borderColor: sizeSelected === 6 ? '#8f8' : 'transparent' }} onClick={() => setSizeSelected(6)}><PuzzleIcon iconSize={{
              width: `4.5rem`,
              height: `4.5rem`
            }} puzzleDimensions={{ width: 6, height: 6 }} contents={[]} /></span>
          </div> */}
          <div className={styles.puzzleSelectToggle}>
            <div role='button' className={`${styles.toggleButton} ${selectionType === 'random' ? styles.selected : ''}`} onClick={() => setSelectionType('random')}>Random</div>
            <div role='button' className={`${styles.toggleButton} ${selectionType === 'themed' ? styles.selected : ''}`} onClick={() => setSelectionType('themed')}>Themed</div>
          </div>
          {selectionType === 'random' ?
            <div className={`button-group ${styles.puzzleSelectRow}`}>
              <span>Word amount</span>
              <input type='range' name='difficulty' max='4' defaultValue='4'></input>
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
          <button disabled={!puzzleSelected} onClick={sendChallenge} className={'start'}>Send Challenge</button>
          <button onClick={() => setPendingOutgoingChallenge(null)} className={'cancel'}>Cancel</button>
        </div>
      </Modal>
      <Modal isOpen={puzzleListShowing} onClose={() => setPuzzleListShowing(false)}>
        <StoredPuzzleList showing={puzzleListShowing} onClickStoredPuzzle={(puzzle) => {
          setPuzzleSelected(puzzle);
          setPuzzleListShowing(false);
        }} />
      </Modal>
    </>
  );
}

export default ChallengeModal;