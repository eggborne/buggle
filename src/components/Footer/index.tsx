import styles from './Footer.module.css'
import Logo from '../../components/Logo';
import backArrow from '/assets/back_arrow.svg';
import optionsIcon from '/assets/options_icon.svg';
import closeIcon from '/assets/close_icon.svg';
import { useUser } from '../../context/UserContext';

interface FooterProps {
  optionsShowing: boolean;
  sideMenuShowing: boolean;
  toggleOptionsShowing: () => void;
  toggleSideMenuShowing: () => void;
  showExitGameConfirm: () => void
  showSignOutConfirm: () => void
}

function Footer({ optionsShowing, sideMenuShowing, showExitGameConfirm, toggleOptionsShowing, toggleSideMenuShowing }: FooterProps) {
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
        className={`${styles.back} ${optionsShowing || (phase !== 'title') ? styles.showing : ''}`}
        onClick={optionsShowing ? toggleOptionsShowing : handleClickBackButton}
      >
        <img src={backArrow} />
      </button>
      <Logo />
      <button
        onClick={toggleSideMenuShowing}
        className={`${(sideMenuShowing) ? styles.showing : ''} x-close`}>
        <img src={closeIcon} />
      </button>
      <button
        onClick={toggleSideMenuShowing}
            className={`${styles.profileButton} ${(!sideMenuShowing && phase !== 'game') ? styles.showing : ''}`}>
            <img className={'profile-pic'} src={user?.photoURL || ''} />
          </button>
      <button
        className={`${styles.profileButton} ${styles.options} ${styles.showing}`}
        onClick={toggleSideMenuShowing}
        style={{
          visibility: (phase !== 'game' || optionsShowing) ? 'hidden' : 'visible'
        }}
      ><img className={'profile-pic'} src={optionsIcon} /></button>
      <div className={styles.footerKnob}></div>
    </footer>
  )
}

export default Footer;