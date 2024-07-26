import styles from './Logo.module.css'

function Logo() {
  return (
    <div className={styles.Logo}>
      {['B', 'U', 'G', 'G', 'L', 'E'].map((letter, l) =>
        <div key={l} className={styles.tile}>{letter}</div>
      )}      
    </div>
  )
}

export default Logo;