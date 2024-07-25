import styles from './TitleScreen.module.css'
import { useUser } from '../../context/UserContext'
import { useState } from 'react'
import Modal from '../Modal';
import Login from '../Login/Login';

interface TitleScreenProps {
  hidden: boolean;
  changePhase: (phase: string) => void;
  showOptions: () => void;
}

function TitleScreen({ hidden, changePhase, showOptions }: TitleScreenProps) {
  const { user, isLoggedIn } = useUser();
  const [loginShowing, setLoginShowing] = useState<boolean>(false);

  const handleClickMultiplayer = () => {
    if (!isLoggedIn) {
      setLoginShowing(true);
    } else {
      changePhase('lobby');
    }
  }

  const titleScreenClass = `${styles.TitleScreen}${hidden ? ' hidden' : ''}`;
  return (
    <main className={titleScreenClass}>
      <div className='button-group'>
        <button className={styles.select} onClick={() => changePhase('select')}>Single Player</button>
        <button className={styles.lobby} onClick={handleClickMultiplayer}>
          Multiplayer
          <div className={styles.buttonMenu}>{isLoggedIn && user ?
            <div>Logged in as {user.displayName}</div>
            :
            <Login />}
          </div>
        </button>
        <button className={styles.options} onClick={showOptions}>Options</button>
        <button className={styles.create} onClick={() => changePhase('create')}>Create</button>
      </div>
    </main>
  )
}

export default TitleScreen;