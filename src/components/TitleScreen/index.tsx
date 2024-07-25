import styles from './TitleScreen.module.css'
import { useUser } from 'context/UserContext'
import { useFirebase } from 'context/FirebaseContext'
import Login from '../Login';

interface TitleScreenProps {
  hidden: boolean;
  showOptions: () => void;
}

function TitleScreen({ hidden, showOptions }: TitleScreenProps) {
  const { user, isLoggedIn, changePhase } = useUser();
  const { playerList } = useFirebase();

  const handleClickMultiplayer = () => {
    if (!isLoggedIn) {
      null;
    } else {
      changePhase('lobby');
    }
  }

  const titleScreenClass = `${styles.TitleScreen}${hidden ? ' hidden' : ''}`;
  const playerAmount = playerList ? playerList.length - (isLoggedIn ? 1 : 0) : 0
  const playersString = `${playerAmount === 0 ? 'No' : playerAmount} other players here`;
  return (
    <main className={titleScreenClass}>
      <div className={`${styles.titleButtons}`}>
        <button className={`${styles.select} ${styles.titleButton}`} onClick={() => changePhase('select')}>Practice</button>
        <button className={`${styles.lobby} ${styles.titleButton}`} onClick={handleClickMultiplayer}> Multiplayer <div style={{ fontSize: '1rem', fontWeight: 'normal', color: '#aaffaa' }}>{playersString}</div> <div className={styles.buttonMenu}> {(isLoggedIn && user) ? <button className={'start'}>Enter lobby</button> : <Login /> } </div> </button>
        <div className={'button-group row'}>
          <button className={`${styles.options} ${styles.titleButton} ${styles.small}`} onClick={showOptions}>Options</button>
          <button className={`${styles.create} ${styles.titleButton} ${styles.small}`} onClick={() => changePhase('create')}>Create</button>
        </div>
      </div>
    </main>
  )
}

export default TitleScreen;