import styles from './Logo.module.css'

interface LogoProps {
  hidden: boolean;
}

function Logo({ hidden }: LogoProps) {
  return (
    <div className={`${styles.Logo} ${hidden ? styles.hidden : ''}`}>
      {['B', 'U', 'G', 'G', 'L', 'E'].map((letter, l) =>
        <div key={l} className={styles.tile}>{letter}</div>
      )}      
    </div>
  )
}

export default Logo;