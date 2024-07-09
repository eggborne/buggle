import './OptionsScreen.css'

interface OptionsScreenProps {
  changePhase: (newPhase: string) => void;
}

function OptionsScreen({ changePhase }: OptionsScreenProps) {

  return (
    <main className='options-screen'>
      options
    </main>
  )
}

export default OptionsScreen;