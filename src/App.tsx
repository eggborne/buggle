import { useState, useEffect } from 'react';
import { triggerShowMessage } from './hooks/useMessageBanner';
import { useUser } from './context/UserContext';
import './App.css'
import { ConfirmData } from './types/types';
import LoadingDisplay from './components/LoadingDisplay';
import Footer from './components/Footer';
import TitleScreen from './components/TitleScreen';
import LobbyScreen from './components/LobbyScreen';
import GameScreen from './components/GameScreen';
import OptionsModal from './components/OptionsModal';
import CreateScreen from './components/CreateScreen';
import MessageBanner from './components/MessageBanner/';
import SideMenu from './components/SideMenu';
import { useFirebase } from './context/FirebaseContext';
import ConfirmModal from './components/ConfirmModal';
import PlayerAnnouncementEffect from './effects/PlayerAnnouncementEffect';
import StartMatchModal from './components/StartMatchModal';
import SinglePlayerSetupModal from './components/GameSetupModal/SinglePlayerSetupModal';
import { updateBestPuzzles } from './scripts/firebase';

function App() {
  const {
    user,
    isLoading,
    isLoggedIn,
    changePhase,
    handleSignOut,
  } = useUser();
  const phase = user?.phase;
  const { currentMatch, destroyGame, revokeAllOutgoingChallenges } = useFirebase();
  const [userReady, setUserReady] = useState<boolean>(false);
  const [optionsShowing, setOptionsShowing] = useState<boolean>(false);
  const [sideMenuShowing, setSideMenuShowing] = useState<boolean>(false);
  const [confirmShowing, setConfirmShowing] = useState<ConfirmData | null>(null);
  const [singlePlayerMenuOpen, setSinglePlayerMenuOpen] = useState<boolean>(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!loaded) {
      requestAnimationFrame(() => {
        setLoaded(true);
      })
    }
  }, []);

  useEffect(() => {
    if (!isLoading && !userReady) {
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

  const handleConfirmGameExit = async () => {
    await destroyGame(currentMatch?.id || '');
    // changePhase('title');    
  }

  const handleConfirmSignOut = async () => {
    setSideMenuShowing(false);
    handleSignOut();
    revokeAllOutgoingChallenges(user?.uid || '');
  }

  return (
    (!loaded || isLoading) ? <LoadingDisplay /> :
      <>
        {isLoggedIn && <PlayerAnnouncementEffect />}
        <div
          className={'screen-container'}
          style={{
            opacity: userReady ? 1 : 0,
          }}
        >
          <MessageBanner />
          <TitleScreen
            hidden={phase !== 'title' || !userReady}
            showOptions={() => setOptionsShowing(true)}
            showSinglePlayerSetupModal={() => setSinglePlayerMenuOpen(true)}
          />
          <CreateScreen hidden={phase !== 'create'} />
          <SinglePlayerSetupModal
            isOpen={singlePlayerMenuOpen}
            onClose={() => setSinglePlayerMenuOpen(false)}
          />
          {phase === 'lobby' && <LobbyScreen hidden={phase !== 'lobby'} />}
          {phase === 'game' &&
            <GameScreen
              hidden={phase !== 'game'}
              showConfirmModal={showConfirmModal}
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
        <SideMenu
          sideMenuShowing={sideMenuShowing}
          setOptionsShowing={() => { setOptionsShowing(true); setSideMenuShowing(false) }}
          showConfirmModal={showConfirmModal}
        />
        <Footer
          optionsShowing={optionsShowing}
          sideMenuShowing={sideMenuShowing}
          showConfirmModal={showConfirmModal}
          toggleOptionsShowing={() => setOptionsShowing(!optionsShowing)}
          toggleSideMenuShowing={() => setSideMenuShowing(!sideMenuShowing)}
        />
        </div>
        {isLoggedIn && <StartMatchModal />}
        {process.env.NODE_ENV === 'development' &&
          <button className={'debug-button'} onClick={async () => {
            console.warn('clicked update puzzles')
            updateBestPuzzles(4);
          }}>Update puzzles
          </button>}
      </>
  )
}

export default App
