import './TitleScreen.css'

interface TitleScreenProps {
  changePhase: (phase: string) => void;
}

function TitleScreen({ changePhase }: TitleScreenProps) {

  return (
    <main className='title-screen'>
      <div className='button-group'>
        <button onClick={() => changePhase('game-board')}>Single Player</button>
        <button onClick={() => changePhase('select')}>Multiplayer</button>
        <button onClick={() => changePhase('options')}>Options</button>
      </div>
    </main>
  )
}

export default TitleScreen;