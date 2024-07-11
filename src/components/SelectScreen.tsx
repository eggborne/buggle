import { useState, useRef } from 'react'
import styles from './SelectScreen.module.css'
import { Difficulty, SinglePlayerOptions } from '../App';
import PuzzleIcon from './PuzzleIcon'

interface SelectScreenProps {
  startSinglePlayerGame: (options: SinglePlayerOptions) => void;
}

function SelectScreen({ startSinglePlayerGame }: SelectScreenProps) {
  const [sizeSelected, setSizeSelected] = useState<number>(5)
  const formRef = useRef<HTMLFormElement>(null);
  const handleStartSinglePlayer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const target = e.currentTarget as HTMLFormElement;
    const options: SinglePlayerOptions = {
      puzzleSize: {
        // width: parseInt((target.elements.namedItem('puzzleWidth') as HTMLInputElement).value, 10),
        // height: parseInt((target.elements.namedItem('puzzleWidth') as HTMLInputElement).value, 10)
        width: sizeSelected,
        height: sizeSelected
      },
      difficulty: (target.elements.namedItem('difficulty') as HTMLSelectElement).value as Difficulty
    };
    startSinglePlayerGame(options);
  }

  const handleSubmitPuzzleOptions = () => {
    if (formRef.current) {
      const submitButton = formRef.current.querySelector('button[type="submit"]') as HTMLButtonElement | null;
      if (submitButton) {
        submitButton.click();
      }
    }
  };

  return (
    <main className={styles.SelectScreen}>
      <div className='button-group'>
        <form ref={formRef} onSubmit={handleStartSinglePlayer}>
          <button type='submit' style={{ position: 'absolute', display: 'none' }}>submit</button>
          <div className={styles.puzzleOptions}>
            <div className={styles.sizeSelect}>
              <label>Size</label>
              {/* <input type='number' defaultValue='5' min='3' max='16' id='puzzleWidth' name='puzzleWidth' /> */}
              <div className={styles.sizeSelections}>
                <span style={{ borderColor: sizeSelected === 4 ? '#8f8' : 'transparent'}} onClick={() => setSizeSelected(4)}><PuzzleIcon size={{ width: 4, height: 4 }} /></span>
                <span style={{ borderColor: sizeSelected === 5 ? '#8f8' : 'transparent'}} onClick={() => setSizeSelected(5)}><PuzzleIcon size={{ width: 5, height: 5 }} /></span>
                <span style={{ borderColor: sizeSelected === 6 ? '#8f8' : 'transparent'}} onClick={() => setSizeSelected(6)}><PuzzleIcon size={{ width: 6, height: 6 }} /></span>
              </div>
            </div>
            <label>
              <span>Difficulty</span>
              <select name='difficulty'>
                <option value='easy'>Easy</option>
                <option value='medium'>Medium</option>
                <option value='hard'>Hard</option>
              </select>
            </label>
          </div>
        </form>
        <button onClick={handleSubmitPuzzleOptions} className={styles.start}>Start!</button>
      </div>
    </main>
  )
}

export default SelectScreen;