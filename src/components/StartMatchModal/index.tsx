import styles from './StartMatchModal.module.css';
import Modal from '../Modal';
import { useUser } from '../../context/UserContext';
import { useFirebase } from '../../context/FirebaseContext';
import { useEffect, useState } from 'react';
import { ChallengeData, UserData } from '../../types/types';
import ChallengeListItem from '../ChallengeListItem';
import { getUserFromDatabase } from '../../scripts/firebase';

const StartMatchModal = () => {
  const { challenges, joinNewGame, revokeOutgoingChallenge, setPlayerReady } = useFirebase();
  const { user, changePhase } = useUser();
  const [acceptedChallenge, setAcceptedChallenge] = useState<ChallengeData | null>(null);
  const [opponentData, setOpponentData] = useState<UserData | null>(null);

  useEffect(() => {
    if (challenges && user) {
      const accepted = Object.values(challenges).find(challenge => challenge.accepted && challenge.instigatorUid === user.uid);
      if (accepted) {
        setAcceptedChallenge(accepted);
      } else {
        setAcceptedChallenge(null);
      }
    }
  }, [challenges]);

  useEffect(() => {
    if (acceptedChallenge && acceptedChallenge.id) {
      const getProspectiveOpponentData = async () => {
        const snapshot = await getUserFromDatabase(acceptedChallenge.respondentUid);
        if (snapshot.exists()) {
          const prospectiveOpponentData = snapshot.data() as UserData;
          if (prospectiveOpponentData !== null) {
            setOpponentData(prospectiveOpponentData);
          }
        } else {
          return null;
        }
      }
      getProspectiveOpponentData();      
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
    if (user && acceptedChallenge?.id) {
      const newGameId = acceptedChallenge?.id;
      newGameId && joinNewGame(newGameId);
      revokeOutgoingChallenge(acceptedChallenge?.id);
      setAcceptedChallenge(null);
      changePhase('game');
      setPlayerReady(user.uid);
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
        key={acceptedChallenge.id}
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