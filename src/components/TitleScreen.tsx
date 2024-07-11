import styles from './TitleScreen.module.css'

interface TitleScreenProps {
  changePhase: (phase: string) => void;
}

function TitleScreen({ changePhase }: TitleScreenProps) {

  return (
    <main className={styles.TitleScreen}>
      <div className='button-group'>
        <button onClick={() => changePhase('select')}>Single Player</button>
        <button onClick={() => changePhase('lobby')}>Multiplayer</button>
        <button onClick={() => changePhase('options')}>Options</button>
        <button onClick={() => changePhase('create')}>Create</button>
      </div>
    </main>
  )
}

export default TitleScreen;