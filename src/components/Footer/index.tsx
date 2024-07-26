import styles from './Footer.module.css'
import Logo from '../../components/Logo';
import backArrow from '/assets/back_arrow.svg';
import optionsIcon from '/assets/options_icon.svg';
import closeIcon from '/assets/close_icon.svg';
import { useUser } from '../../context/UserContext';

interface FooterProps {
  optionsShowing: boolean;
  userMenuShowing: boolean;
  toggleOptionsShowing: () => void;
  toggleUserMenuShowing: () => void;
  showExitGameConfirm: () => void
  showSignOutConfirm: () => void
}

function Footer({ optionsShowing, userMenuShowing, showExitGameConfirm, toggleOptionsShowing, toggleUserMenuShowing }: FooterProps) {
  const { user, isLoggedIn, changePhase } = useUser();
  const phase = user?.phase;

  const handleClickBackButton = () => {
    if (!user) return;
    if (phase === 'game') {
      showExitGameConfirm();
      return;
    }
    changePhase('title');
  }

  return (
    <footer className={styles.Footer}>
      <div className={styles.footerKnob}></div>
      <button
        className={`${styles.back} ${optionsShowing || phase !== 'title' ? styles.showing : ''}`}
        onClick={optionsShowing ? toggleOptionsShowing : handleClickBackButton}
        // style={{
        //   visibility: (phase === 'title' && !optionsShowing) ? 'hidden' : 'visible',
        //   opacity: 0.1,
        //   pointerEvents: 'none',
        // }}
      >
        <img src={backArrow} />
      </button>
        
      <Logo />
      {/* <button className={optionsShowing ? styles.close : styles.options} onClick={toggleOptionsShowing} style={{ visibility: (phase !== 'game' && !optionsShowing) ? 'hidden' : 'visible' }} ><img src={optionsShowing ? closeIcon : optionsIcon} /></button> */}
      {isLoggedIn ?
        <>
          <button
            onClick={toggleUserMenuShowing}
            className={`${userMenuShowing ? styles.showing : ''} x-close`}>
            <img src={closeIcon} />
          </button>
          
          <button
            onClick={toggleUserMenuShowing}
            className={`${styles.profileButton} ${!userMenuShowing ? styles.showing : ''}`}>
            <img className={'profile-pic'} src={user?.photoURL || ''} />
          </button>
        </>
        :
        <button
        className={styles.options}
        onClick={toggleOptionsShowing}
        style={{
          visibility: (phase !== 'game' || optionsShowing) ? 'hidden' : 'visible'
        }}
        ><img src={optionsIcon} /></button>
      }
      <div className={styles.footerKnob}></div>
    </footer>
  )
}

export default Footer;