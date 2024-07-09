import styles from './Logo.module.css'
import BoardCell from './BoardCell';

function Logo() {
  return (
    <div className={styles.Logo}>
      <div className={styles.tile}>B</div>
      <div className={styles.tile}>U</div>
      <div className={styles.tile}>G</div>
      <div className={styles.tile}>G</div>
      <div className={styles.tile}>L</div>
      <div className={styles.tile}>E</div>
    </div>
  )
}

export default Logo;