import styles from './StartMatchModal.module.css';
import Modal from '../Modal';
import { useUser } from '../../context/UserContext';
import { useFirebase } from '../../context/FirebaseContext';
import { useEffect, useState } from 'react';
import { ChallengeData, UserData } from '../../types/types';
import ChallengeListItem from '../ChallengeListItem';

const StartMatchModal = () => {
  const { challenges, playerList, joinNewGame, revokeOutgoingChallenge } = useFirebase();
  const { user, changePhase } = useUser();
  const [acceptedChallenge, setAcceptedChallenge] = useState<ChallengeData | null>(null);
  const [opponentData, setOpponentData] = useState<UserData | null>(null);

  useEffect(() => {
    if (challenges && user) {
      const accepted = Object.values(challenges).find(challenge => challenge.accepted && challenge.instigator === user.uid);
      if (accepted) {
        setAcceptedChallenge(accepted);
      } else {
        setAcceptedChallenge(null);
      }
    }
  }, [challenges]);

  useEffect(() => {
    if (acceptedChallenge && acceptedChallenge.id) {
      setOpponentData(playerList?.find(player => player.uid === acceptedChallenge.respondent) || null);
    } else {
      setOpponentData(null);
    }
  }, [acceptedChallenge]);

  const handleRejectAcceptance = () => {
    if (!acceptedChallenge?.id) {
      return;
    }
    revokeOutgoingChallenge(acceptedChallenge.id);
  }

  const handleConfirmAcceptance = async () => {
    if (acceptedChallenge?.id) {
      const newGameId = acceptedChallenge?.id;
      newGameId && joinNewGame(newGameId);
      await revokeOutgoingChallenge(acceptedChallenge?.id);
      await setAcceptedChallenge(null);
      changePhase('game');
    } else {
      console.error('StartMatchModal found no acceptedChallange.id', acceptedChallenge)
    }
  }

  return (
    <Modal
      className={`${styles.StartMatchModal}`}
      isOpen={acceptedChallenge !== null}
      noCloseButton
      style={{
        height: 'auto',
      }}
    >
      <h2>{opponentData?.displayName} accepted your challenge!</h2>
      {acceptedChallenge && <ChallengeListItem
        challenge={acceptedChallenge}
        opponentData={opponentData}
      />}
      {acceptedChallenge && <div className={`button-group ${styles.responseButtons}`}>
        <button className={'start'} onClick={handleConfirmAcceptance}>Start!</button>
        <button className={'cancel'} onClick={handleRejectAcceptance}>Never mind</button>
      </div>}
    </Modal>
  )
}

export default StartMatchModal;