import styles from './StatusBar.module.css'

interface StatusBarProps {
  message: string;
  showing: boolean;
  dictionaryLoaded: boolean;
  wordListFetched: boolean;
}

function StatusBar({ message, showing, dictionaryLoaded, wordListFetched }: StatusBarProps) {

  return (
    <div className={styles.statusBar + ' ' + ((showing || !message) ? styles.showing : '')}>
      {message ||
        <>
          <div id='list-status' style={{ color: wordListFetched ? '#99ff99' : '#ffaaaa' }}>fetching word list...</div>
        <div id='dict-status' style={{ color: '#99ff99', opacity: dictionaryLoaded ? '1' : '0' }}></div>
        </>
      }
    </div>
  )
}

export default StatusBar;