import React, { useState, useRef } from 'react';
import styles from './TitleScreen.module.css'
import { SinglePlayerOptions } from '../App';

interface TitleScreenProps {
  changePhase: (phase: string) => void;
  startSinglePlayerGame: (options: SinglePlayerOptions) => void;
}

function TitleScreen({ changePhase, startSinglePlayerGame }: TitleScreenProps) {

  const [optionsExpanded, setOptionsExpanded] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleStartSinglePlayer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const target = e.currentTarget as HTMLFormElement;
    const options: SinglePlayerOptions = {
      puzzleSize: {
        width: parseInt((target.elements.namedItem('puzzleWidth') as HTMLInputElement).value, 10),
        height: parseInt((target.elements.namedItem('puzzleWidth') as HTMLInputElement).value, 10)
      },
    };

    startSinglePlayerGame(options);
  }

  const handleSubmitPuzzleOptions = () => {
    if (formRef.current) {
      // Find the submit button inside the form
      const submitButton = formRef.current.querySelector('button[type="submit"]') as HTMLButtonElement | null;

      // Programmatically click the submit button
      if (submitButton) {
        submitButton.click();
      }
    }
  };

  return (
    <main className={styles.titleScreen}>
      <div className='button-group'>
        <form ref={formRef} onSubmit={handleStartSinglePlayer}>
          <button type='submit' style={{ position: 'absolute', display: 'none' }}>submit</button>
          <div className={styles.puzzleOptions + (optionsExpanded ? `` : ` ${styles.hidden}`)}>
            <label>
              <span>Size</span>
              <input type='number' defaultValue='5' min='3' max='16' id='puzzleWidth' name='puzzleWidth' />
            </label>            
          </div>
        </form>
        {optionsExpanded ?
          <>
            <button onClick={handleSubmitPuzzleOptions} className={optionsExpanded ? styles.start : ``}>Start!</button>
            <button onClick={() => setOptionsExpanded(false)} className={optionsExpanded ? styles.back : ``}>Back</button>
          </>
          :
          <button onClick={() => setOptionsExpanded(true)}>Single Player</button>
        }
        {!optionsExpanded &&
          <>
            <button onClick={() => changePhase('select')}>Multiplayer</button>
            <button onClick={() => changePhase('options')}>Options</button>
            <button style={{ backgroundColor: 'gray' }} onClick={() => changePhase('admin')}>Create</button>
          </>
        }
      </div>
    </main>
  )
}

export default TitleScreen;