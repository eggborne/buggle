import styles from './Footer.module.css'
import Logo from './Logo';

interface FooterProps {
  phase: string;
  changePhase: (phase: string) => void;
}

function Footer({ phase, changePhase }: FooterProps) {

  return (
    <footer className={styles.Footer}>
      {phase !== 'title' && <button onClick={() => changePhase('title')}>{'<'}</button>}
      <Logo />
    </footer>
  )
}

export default Footer;