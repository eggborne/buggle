import './OptionsScreen.css'

interface OptionsScreenProps {
  changePhase: (newPhase: string) => void;
};

function OptionsScreen({ changePhase }: OptionsScreenProps) {

  return (
    <main className='options-screen'>
      <button onClick={() => changePhase('title')}>Back</button>
    </main>
  )
}

export default OptionsScreen;