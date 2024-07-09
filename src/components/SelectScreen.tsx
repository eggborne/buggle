import './SelectScreen.css'

interface SelectScreenProps {
  changePhase: (phase: string) => void;
}

function SelectScreen({ changePhase }: SelectScreenProps) {

  return (
    <main className='select-screen'>
      select screen
    </main>
  )
}

export default SelectScreen;