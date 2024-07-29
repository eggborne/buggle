import styles from './Footer.module.css'
import Logo from '../../components/Logo';
import backArrow from '/assets/back_arrow.svg';
import optionsIcon from '/assets/options_icon.svg';
import closeIcon from '/assets/close_icon.svg';
import { useUser } from '../../context/UserContext';
import { ConfirmData } from '../../types/types';

interface FooterProps {
  optionsShowing: boolean;
  sideMenuShowing: boolean;
  toggleOptionsShowing: () => void;
  toggleSideMenuShowing: () => void;
  showConfirmModal: (confirmData: ConfirmData) => void;
}

function Footer({ optionsShowing, sideMenuShowing, showConfirmModal, toggleOptionsShowing, toggleSideMenuShowing }: FooterProps) {
  const { isLoggedIn, user, changePhase } = useUser();
  const phase = user?.phase;

  const handleClickBackButton = () => {
    if (!user) return;
    if (phase === 'game') {
      showConfirmModal({
        typeOpen: 'leaveGame',
        message: 'Are you sure you want to leave the game?',
        targetPhase: 'title',
      });
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
        onClick={isLoggedIn ? toggleSideMenuShowing : () => null } className={`${styles.profileButton} ${(!sideMenuShowing && phase !== 'game') ? styles.showing : ''}`}>
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