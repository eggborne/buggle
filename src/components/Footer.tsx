import styles from './Footer.module.css'
import Logo from './Logo';
import backArrow from '/assets/back_arrow.svg';
import optionsIcon from '/assets/options_icon.svg';
import closeIcon from '/assets/close_icon.svg';

interface FooterProps {
  optionsShowing: boolean;
  phase: string;
  changePhase: (phase: string) => void;
  toggleOptionsShowing: () => void;
}

function Footer({ optionsShowing, phase, changePhase, toggleOptionsShowing }: FooterProps) {

  const handleClickBackButton = () => {
    changePhase('title');
  }

  return (
    <footer className={styles.Footer}>
      <button
        className={styles.back}
        onClick={handleClickBackButton}
        style={{
          visibility: (phase === 'title' || optionsShowing) ? 'hidden' : 'visible'
        }}
      ><img src={backArrow} /></button>
      <Logo />
      <button
        className={optionsShowing ? styles.close : styles.options}
        onClick={toggleOptionsShowing}
        style={{
          visibility: (phase !== 'game' && !optionsShowing) ? 'hidden' : 'visible'
        }}
      ><img src={optionsShowing ? closeIcon : optionsIcon} /></button>
    </footer>
  )
}

export default Footer;