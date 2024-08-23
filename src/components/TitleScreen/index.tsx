import styles from './TitleScreen.module.css'
import { useUser } from '../../context/UserContext'
import { useFirebase } from '../../context/FirebaseContext'
import Login from '../Login';

interface TitleScreenProps {
  hidden: boolean;
  showOptions: () => void;
}

function TitleScreen({ hidden, showOptions }: TitleScreenProps) {
  const { user, isLoggedIn, changePhase } = useUser();
  const { totalPlayers } = useFirebase();

  const handleClickMultiplayer = () => {
    if (!isLoggedIn) {
      null;
    } else {
      changePhase('lobby');
    }
  }

  const titleScreenClass = `${styles.TitleScreen} ${hidden ? `${styles.hidden}` : ''}`;
  const playerAmount = isLoggedIn ? totalPlayers - 1 : totalPlayers;
  const playersString = `${playerAmount === 0 ? 'No' : playerAmount}${isLoggedIn ? ' other' : ''} player${playerAmount !== 1 ? 's' : ''} here`;
  return (
    <main className={titleScreenClass}>
      <div className={`${styles.titleButtons}`}>
        <button className={`${styles.select} ${styles.titleButton} ${styles.small}`} onClick={() => changePhase('select')}>Practice</button>
        <div role='button' className={`${styles.lobby} ${styles.titleButton}`} onClick={handleClickMultiplayer}> Multiplayer <div style={{ fontSize: '1rem', fontWeight: 'normal', color: '#fff' }}>{playersString}</div> <div className={styles.buttonMenu}> {(isLoggedIn && user) ? <div role='button' className={styles.enterButton}>Enter lobby</div> : <Login /> } </div> </div>
        <div className={'button-group row'}>
          <button className={`${styles.options} ${styles.titleButton} ${styles.small}`} onClick={showOptions}>Options</button>
          <button className={`${styles.create} ${styles.titleButton} ${styles.small}`} onClick={() => changePhase('create')}>Create</button>
        </div>
      </div>
    </main>
  )
}

export default TitleScreen;