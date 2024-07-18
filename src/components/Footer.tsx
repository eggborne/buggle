import styles from './Footer.module.css'
import Logo from './Logo';
import backArrow from '/assets/back_arrow.svg';

interface FooterProps {
  phase: string;
  changePhase: (phase: string) => void;
}

function Footer({ phase, changePhase }: FooterProps) {

  return (
    <footer className={styles.Footer}>
      <button onClick={() => changePhase('title')} style={{ visibility: phase === 'title' ? 'hidden' : 'visible' }}><img src={backArrow} /></button>
      <Logo />
    </footer>
  )
}

export default Footer;