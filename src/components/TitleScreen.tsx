import React, { useState } from 'react';
import styles from './TitleScreen.module.css'
import { SinglePlayerOptions } from '../App';

interface TitleScreenProps {
  changePhase: (phase: string) => void;
  startSinglePlayerGame: (options: SinglePlayerOptions) => void;
}

function TitleScreen({ changePhase, startSinglePlayerGame }: TitleScreenProps) {

  const [optionsExpanded, setOptionsExpanded] = useState(false);

  const handleStartSinglePlayer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const target = e.target as any;
    const options = {
      puzzleSize: {
        width: parseInt(target.elements.puzzleWidth.value),
        height: parseInt(target.elements.puzzleHeight.value)
      },
      minimumWordAmount: parseInt(target.elements.minWords.value),
    }

    startSinglePlayerGame(options);
  }

  return (
    <main className={styles.titleScreen}>
      <div className='button-group'>
        {optionsExpanded ?
          <form onSubmit={handleStartSinglePlayer}>
            <button className={optionsExpanded ? styles.start : `` }>Start!</button>
            <div className={styles.puzzleOptions + (optionsExpanded ? `` : ` ${styles.hidden}`)}>
              <label>
                <span>Width</span>
                <input type='number' defaultValue='4' min='4' max='12' id='puzzleWidth' name='puzzleWidth' />
              </label>
              <label>
                <span>Height</span>
                <input type='number' defaultValue='4' min='4' max='12' id='puzzleHeight' name='puzzleHeight' />
              </label>
              <label>
                <span>Min. Words</span>
                <input type='number' defaultValue='50' min='15' max='500' id='minWords' name='minWords' />
              </label>
            </div>
          </form>
          :
          <button onClick={() => setOptionsExpanded(true)}>Single Player</button>
        }
        <button onClick={() => changePhase('select')}>Multiplayer</button>
        <button onClick={() => changePhase('options')}>Options</button>
      </div>
    </main>
  )
}

export default TitleScreen;