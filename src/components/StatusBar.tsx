import styles from './StatusBar.module.css'

interface StatusBarProps {
  message: string;
  showing: boolean;
}

function StatusBar({ message, showing }: StatusBarProps) {

  return (
    <div className={styles.statusBar + ' ' + ((showing || !message) ? styles.showing : '')}>
      {message}
    </div>
  )
}

export default StatusBar;