import styles from './TitleScreen.module.css'

interface TitleScreenProps {
  hidden: boolean;
  changePhase: (phase: string) => void;
  showOptions: () => void;
}

function TitleScreen({ hidden, changePhase, showOptions }: TitleScreenProps) {
  const titleScreenClass = `${styles.TitleScreen}${hidden ? ' hidden' : ''}`;
  return (
    <main className={titleScreenClass}>
      <div className='button-group'>
        <button className={styles.select} onClick={() => changePhase('select')}>Single Player</button>
        <button className={styles.lobby} onClick={() => changePhase('lobby')}>Multiplayer</button>
        <button className={styles.options} onClick={showOptions}>Options</button>
        <button className={styles.create} onClick={() => changePhase('create')}>Create</button>
      </div>
    </main>
  )
}

export default TitleScreen;