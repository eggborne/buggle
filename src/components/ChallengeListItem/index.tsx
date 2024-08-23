import styles from './ChallengeListItem.module.css';

import { ChallengeData, UserData } from "../../types/types";
import PuzzleIcon from "../PuzzleIcon";

interface ChallengeListItemProps {
  challenge: ChallengeData;
  opponentData: UserData | null;
  handleDeclineChallenge?: (opponentUid: string) => void;
  handleAcceptChallenge?: (challenge: ChallengeData) => void;
}

const ChallengeListItem = ({ challenge, opponentData, handleDeclineChallenge, handleAcceptChallenge }: ChallengeListItemProps) => {

  return (
    <div
      key={challenge.id}
      className={styles.ChallengeListItem}
      style={{
        backgroundColor: opponentData?.preferences?.style?.gameBackgroundColor,
        gridTemplateRows: handleAcceptChallenge ? '4rem auto' : '4rem'
      }}
    >
      <span><img className='profile-pic' src={opponentData?.photoURL || undefined} /></span>
      <span>{opponentData?.displayName}</span>
      <div className={styles.difficultyLabel}>
        <span>{`${challenge.timeLimit} seconds`}</span>
        <span>{challenge.difficulty}</span>
      </div>
      <span><PuzzleIcon puzzleDimensions={{
        width: challenge.puzzleId ? Number(challenge.puzzleId[0]) : 5,
        height: challenge.puzzleId ? Number(challenge.puzzleId[1]) : 5
      }} contents={[]} iconSize={{ width: '4rem', height: '4rem' }} /></span>
      {handleDeclineChallenge && handleAcceptChallenge &&
        <div className={`button-group row ${styles.challengeButtons}`}>
          <button className={`cancel ${styles.declineButton}`} onClick={() => handleDeclineChallenge(challenge.instigatorUid)}>Decline</button>
          <button className={`start ${styles.acceptButton}`} onClick={() => handleAcceptChallenge(challenge)}>Accept</button>
        </div>}
    </div>
  );
}

export default ChallengeListItem;

