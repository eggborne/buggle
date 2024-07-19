import styles from './TitleScreen.module.css'

interface TitleScreenProps {
  hidden: boolean;
  changePhase: (phase: string) => void;
}

function TitleScreen({ hidden, changePhase }: TitleScreenProps) {
  const titleScreenClass = `${styles.TitleScreen}${hidden ? ' hidden' : ''}`;
  return (
    <main className={titleScreenClass}>
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