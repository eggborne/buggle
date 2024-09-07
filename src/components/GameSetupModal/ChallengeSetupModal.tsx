import styles from './GameSetupModal.module.css';
import { StoredPuzzleData, PendingOutgoingChallengeData, ChallengeData } from '../../types/types';
import Modal from '../Modal';
import { useUser } from '../../context/UserContext';
import { Dispatch, SetStateAction, useRef, useState } from 'react';
import StoredPuzzleList from '../StoredPuzzleList';
import { database } from '../../scripts/firebase';
import LoadingDisplay from '../LoadingDisplay';
import SizeSelection from '../SizeSelection';
import { ref, push, update } from 'firebase/database';
import { triggerShowMessage } from '../../hooks/useMessageBanner';

interface ChallengeModalProps {
  pendingOutgoingChallenge: PendingOutgoingChallengeData | null;
  sentChallenges: ChallengeData[];
  setPendingOutgoingChallenge: Dispatch<SetStateAction<PendingOutgoingChallengeData | null>>;
  setSentChallenges: Dispatch<SetStateAction<ChallengeData[]>>;
}

const ChallengeModal = ({
  pendingOutgoingChallenge,
  sentChallenges,
  setPendingOutgoingChallenge,
  setSentChallenges
}: ChallengeModalProps) => {
  const { user } = useUser();
  const [puzzleSelected, setPuzzleSelected] = useState<StoredPuzzleData | null>(null);
  const [puzzleListShowing, setPuzzleListShowing] = useState<boolean>(false);
  const [selectionType, setSelectionType] = useState<string>('random');
  const [sizeSelected, setSizeSelected] = useState<number>(4);
  const [generating, _setGenerating] = useState(false);
  const timeLimitInputRef = useRef<HTMLSelectElement>(null);
  const wordBonusInputRef = useRef<HTMLSelectElement>(null);
  const difficultyInputRef = useRef<HTMLInputElement>(null);

  const sendChallenge = async () => {
    if (user && pendingOutgoingChallenge && timeLimitInputRef.current && wordBonusInputRef.current) {      
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
          const nextSentChallenges: ChallengeData[] = [...prevSentChallenges];
          const newChallengeData: ChallengeData = { ...newChallenge, id: newChallengeId };
          nextSentChallenges.push(newChallengeData);
          return nextSentChallenges;
        });
        await update(ref(database, `challenges/${newChallengeId}`), { id: newChallengeId });
        setPendingOutgoingChallenge(null);
      }
    }
  };

  return (
    <div className={styles.ChallengeModal}>
      <Modal
        isOpen={pendingOutgoingChallenge !== null}
        noCloseButton
        className={styles.GameSetupModal}
      >
        <h2 className={styles.challengeHeader}>
          <div>Challenging</div>
          <div className={styles.opponentName}>{pendingOutgoingChallenge?.respondent.displayName}</div>
          <img className={'profile-pic'} src={pendingOutgoingChallenge?.respondent.photoURL || undefined} />
        </h2>
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
            <div className={`${styles.puzzleSelectRow}`}>
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
            <select defaultValue='5' ref={wordBonusInputRef}>
              <option value='5'>2 seconds</option>
              <option value='5'>5 seconds</option>
              <option value='5'>10 seconds</option>
            </select>
          </div>
        </div>
        <div className={`button-group ${styles.lowerButtons}`}>
          <button onClick={sendChallenge} className={`start ${styles.startButton}`}>Send Challenge</button>
          <button onClick={() => setPendingOutgoingChallenge(null)} className={'cancel'}>Cancel</button>
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
    </div>
  );
}

export default ChallengeModal;