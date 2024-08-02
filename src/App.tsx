import { useState, useEffect } from 'react';
import { triggerShowMessage } from './hooks/useMessageBanner';
import { useUser } from './context/UserContext';
import './App.css'
import { ConfirmData, PointValues, UserData, } from './types/types';
import LoadingDisplay from './components/LoadingDisplay';
import Footer from './components/Footer';
import TitleScreen from './components/TitleScreen';
import LobbyScreen from './components/LobbyScreen';
import SelectScreen from './components/SelectScreen';
import GameScreen from './components/GameScreen';
import OptionsModal from './components/OptionsModal';
import CreateScreen from './components/CreateScreen';
import { set, ref } from 'firebase/database';
import { database } from './scripts/firebase';
import { encodeMatrix } from "./scripts/util";
import MessageBanner from './components/MessageBanner/';
import SideMenu from './components/SideMenu';
import { useFirebase } from './context/FirebaseContext';
import ConfirmModal from './components/ConfirmModal';

import PlayerAnnouncementEffect from './effects/PlayerAnnouncementEffect';
import StartMatchModal from './components/StartMatchModal';


const defaultUserPreferences = {
  style: {
    cubeColor: "#ddddca",
    cubeRoundness: 27,
    cubeScale: 83,
    cubeTextColor: "#2b2b2b",
    footerHeight: 3,
    gameBackgroundColor: "#523e6a",
    gameBoardBackgroundColor: "#a19191",
    gameBoardSize: 17,
  },
  gameplay: {
    swipeBuffer: 70,
  }
};

export const defaultUser: UserData = {
  displayName: 'Guest',
  photoURL: '/assets/generic-user-icon.jpg',
  phase: 'title',
  preferences: defaultUserPreferences,
  uid: 'GuestId'
};


export const difficultyWordAmounts: Record<string, { min: number, max: number }> = {
  easy: { min: 200, max: 10000 },
  medium: { min: 150, max: 250 },
  hard: { min: 1, max: 150 }
};
const pointValues: PointValues = { 3: 1, 4: 1, 5: 2, 6: 3, 7: 5, 8: 11 };

function App() {
  const {
    user,
    isLoading,
    isLoggedIn,
    changePhase,
    handleSignOut,

  } = useUser();
  const phase = user?.phase;
  const { currentMatch, revokeAllOutgoingChallenges, setCurrentMatch, updatePlayerFoundWords, updatePlayerScore } = useFirebase();
  const [userReady, setUserReady] = useState<boolean>(false);
  const [optionsShowing, setOptionsShowing] = useState<boolean>(false);
  const [sideMenuShowing, setSideMenuShowing] = useState<boolean>(false);
  const [confirmShowing, setConfirmShowing] = useState<ConfirmData | null>(null);

  useEffect(() => {
    if (!isLoading && !userReady) {
      console.log('setting userReady');
      isLoggedIn && revokeAllOutgoingChallenges(user?.uid || '');
      requestAnimationFrame(() => {
        setUserReady(true);
      })
    }
  }, [isLoading]);

  useEffect(() => {
    if (isLoggedIn && user) {
      triggerShowMessage(`Signed in as ${user?.displayName}!`);
    }
  }, [isLoggedIn]);

  const handleSubmitValidWord = async (word: string) => {
    if (!user) return
    let wordValue;
    if (word.length >= 8) {
      wordValue = pointValues[8];
    } else {
      wordValue = pointValues[word.length];
    }
    const nextScore = (currentMatch?.playerProgress[user.uid].score || 0) + wordValue;
    console.warn(user.uid, 'sending word', word, 'of', wordValue, 'points for new score', nextScore)
    await updatePlayerFoundWords(user.uid, word)
    await updatePlayerScore(user.uid, nextScore);
  };

  const uploadPuzzle = async () => {
    if (!currentMatch) return;
    const nextPuzzleData = {
      allWords: Array.from(currentMatch.allWords),
      dimensions: currentMatch.dimensions,
      letterString: encodeMatrix(currentMatch.letterMatrix, currentMatch.metadata.key).map(row => row.join('')).join(''),
      metadata: currentMatch.metadata,
    };
    const newPuzzleId = `${currentMatch.dimensions.width}${currentMatch.dimensions.height}${nextPuzzleData.letterString}`;
    console.log('uploading', nextPuzzleData)
    await set(ref(database, 'puzzles/' + newPuzzleId), nextPuzzleData);
    console.warn('puzzle uploaded!')
  };

  const showConfirmModal = (confirmData: ConfirmData | null, hide?: boolean) => {
    if (!confirmData) return;
    if (hide) {
      setConfirmShowing({
        ...confirmData,
        typeOpen: ''
      });
      return;
    }
    setConfirmShowing(confirmData);
  };

  const handleConfirmGameExit = () => {
    changePhase('title');
    setCurrentMatch(null);
  }

  const handleConfirmSignOut = async () => {
    setSideMenuShowing(false);
    handleSignOut();
    revokeAllOutgoingChallenges(user?.uid || '');
  }

  return (
    isLoading ? <LoadingDisplay /> :
      <>
        {isLoggedIn && <PlayerAnnouncementEffect />}
        <MessageBanner />
        <div
          className={'screen-container'}
          style={{
            opacity: userReady ? 1 : 0,
          }}
        >
          <TitleScreen hidden={phase !== 'title' || !userReady} showOptions={() => setOptionsShowing(true)} />
          <CreateScreen hidden={phase !== 'create'} />
          <SelectScreen
            hidden={phase !== 'select'}
          />
          {phase === 'lobby' && <LobbyScreen hidden={phase !== 'lobby'} />}
          {phase === 'game' && currentMatch &&
            <GameScreen
              hidden={phase !== 'game'}
              handleSubmitValidWord={handleSubmitValidWord}
              showConfirmModal={showConfirmModal}
              uploadPuzzle={uploadPuzzle}
            />
          }
          {<OptionsModal hidden={!optionsShowing} />}
          <ConfirmModal
            isOpen={confirmShowing ? confirmShowing.typeOpen !== '' : false}
            message={confirmShowing?.message || ''}
            style={{ height: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', padding: '2.5rem' }}
            onConfirm={() => {
              confirmShowing?.typeOpen === 'leaveGame' ? handleConfirmGameExit() : handleConfirmSignOut();
              changePhase(confirmShowing?.targetPhase || '');
              showConfirmModal(confirmShowing, true);
            }}
            onCancel={() => {
              showConfirmModal(confirmShowing, true);
            }}
          />
        </div>
        <Footer
          optionsShowing={optionsShowing}
          sideMenuShowing={sideMenuShowing}
          showConfirmModal={showConfirmModal}
          toggleOptionsShowing={() => setOptionsShowing(!optionsShowing)}
          toggleSideMenuShowing={() => setSideMenuShowing(!sideMenuShowing)}
        />
        <SideMenu
          sideMenuShowing={sideMenuShowing}
          setOptionsShowing={() => { setOptionsShowing(true); setSideMenuShowing(false) }}
          showConfirmModal={showConfirmModal}
        />
        {isLoggedIn && <StartMatchModal />}
      </>
  )
}

export default App
