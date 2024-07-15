import styles from './CreateScreen.module.css';
import { useState, useRef } from 'react';
import { StoredPuzzleData, BoardRequestData } from '../App.tsx';


interface CreateScreenProps {
  handleClickPremadePuzzle: (puzzle: StoredPuzzleData) => void;
  startCreatedPuzzlePreview: (options: BoardRequestData) => void;
}

const defaultValues = {
  dimensions: {
    width: 5,
    height: 5
  },
  letterDistribution: 'boggle',
  maxAttempts: 10,
}

function CreateScreen({ startCreatedPuzzlePreview }: CreateScreenProps) {
  const [optionsEnabled, setOptionsEnabled] = useState<Record<string, boolean>>({
    totalWordsOption: false,
    averageWordLengthOption: false,
    uncommonWordLimitOption: false,
  });
  const [generating, setGenerating] = useState<boolean>(false);
  const [filtersShowing, setFiltersShowing] = useState<boolean>(true);
  const formRef = useRef<HTMLFormElement>(null);
  const widthInputRef = useRef<HTMLInputElement>(null);
  const heightInputRef = useRef<HTMLInputElement>(null);
  const biasInputRef = useRef<HTMLInputElement>(null);
  const attemptsInputRef = useRef<HTMLInputElement>(null);

  const handleStartCreatedPuzzle = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const target = e.currentTarget as HTMLFormElement;
    const options: BoardRequestData = {
      dimensions: {
        width: parseInt((target.elements.namedItem('puzzleWidth') as HTMLInputElement).value, 10) || defaultValues.dimensions.width,
        height: parseInt((target.elements.namedItem('puzzleHeight') as HTMLInputElement).value, 10) || defaultValues.dimensions.height
      },
      letterDistribution: (target.elements.namedItem('letterDistribution') as HTMLInputElement).value || defaultValues.letterDistribution,
      totalWordLimits: optionsEnabled['totalWordsOption'] ? {
        min: parseInt((target.elements.namedItem('minWords') as HTMLInputElement).value, 10) || 1,
        max: parseInt((target.elements.namedItem('maxWords') as HTMLInputElement).value, 10) || Infinity,
      } : undefined,
      averageWordLengthFilter: optionsEnabled['averageWordLengthOption'] ? {
        comparison: (target.elements.namedItem('averageWordLengthComparison') as HTMLInputElement).value,
        value: parseFloat((target.elements.namedItem('averageWordLengthValue') as HTMLInputElement).value),
      } : undefined,
      uncommonWordLimit: optionsEnabled['uncommonWordLimitOption'] ?
        (biasInputRef.current && !isNaN(parseInt(biasInputRef.current.value))) ?
          parseInt(biasInputRef.current.value) : undefined
        : undefined,
      wordLengthLimits: undefined,
      maxAttempts: attemptsInputRef.current && parseInt(attemptsInputRef.current.value) || defaultValues.maxAttempts
    };
    startCreatedPuzzlePreview(options);
  }

  const handleChangeSizeSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    const sliderValue = target.value;
    if (widthInputRef.current && heightInputRef.current) {
      widthInputRef.current.value = sliderValue.toString();
      heightInputRef.current.value = sliderValue.toString();
    }
  }

  const handleChangeBiasSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    const sliderValue = target.value;
    if (biasInputRef.current) {
      biasInputRef.current.value = sliderValue;
    }
  }

  const handleClickCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    setOptionsEnabled((prevOptionsEnabled) => ({
      ...prevOptionsEnabled,
      [target.name]: !prevOptionsEnabled[target.name],
    }));
  };

  return (
    <main className={styles.CreateScreen}>
      <div className={styles.creationArea}>
        <h1>Create Puzzle</h1>
        <form ref={formRef} onSubmit={handleStartCreatedPuzzle}>
          <button type='submit' style={{ position: 'absolute', display: 'none' }}>submit</button>
          <div className={styles.puzzleOptions}>
            <div className={styles.mainSettings}>
              <label style={{ flexDirection: 'row', gap: '2rem' }}>
                <span>Letter distribution</span>
                <select defaultValue={defaultValues.letterDistribution} id='letterDistribution' name='letterDistribution'>
                  <option value='boggle'>Boggle®</option>
                  <option value='bigBoggle'>Big Boggle®</option>
                  <option value='superBigBoggle'>Super Big Boggle®</option>
                  <option value='scrabble'>Scrabble®</option>
                  <option value='modernEnglish'>Standard English</option>
                  <option value='random'>True Random</option>
                  <option value='syllableUnits'>Syllables</option>
                </select>
              </label>
              <div className={styles.dimensionsInputRow}>
                <label>
                  <span>Width</span>
                  <input ref={widthInputRef} type='number' defaultValue={defaultValues.dimensions.width} min='3' max='64' id='puzzleWidth' name='puzzleWidth' />
                </label>
                <label>
                  <span>Height</span>
                  <input ref={heightInputRef} type='number' defaultValue={defaultValues.dimensions.height} min='3' max='64' id='puzzleHeight' name='puzzleHeight' />
                </label>
                <input type='range' defaultValue={defaultValues.dimensions.width} onChange={handleChangeSizeSlider} min={3} max={9} step='1' />
              </div>
            </div>
            <div className={styles.optionalSettings}>
              <div className={`${styles.buttonHeader} ${filtersShowing ? styles.active : styles.inactive}`} onClick={() => setFiltersShowing(prevState => !prevState)}>
                <h2>Filters</h2>
              </div>
              <div className={`${styles.filterArea} ${filtersShowing ? styles.showing : styles.inactive}`}>
                <div className={styles.optionalRow}>
                  <input checked={optionsEnabled['totalWordsOption']} onChange={handleClickCheckbox} type='checkbox' id={'totalWordsOption'} name={'totalWordsOption'} />
                  <div className={`${styles.optionalInputRow} ${optionsEnabled['totalWordsOption'] ? styles.active : styles.inactive}`}>
                    <h4>Total words</h4>
                    <label>
                      <span>Min</span>
                      <input disabled={!optionsEnabled['totalWordsOption']} type='number' min='1' max='1000' id='minWords' name='minWords' />
                    </label>
                    <label>
                      <span>Max</span>
                      <input disabled={!optionsEnabled['totalWordsOption']} type='number' min='2' max='9999' id='maxWords' name='maxWords' />
                    </label>
                  </div>
                </div>

                <div className={styles.optionalRow}>
                  <input checked={optionsEnabled['uncommonWordLimitOption']} onChange={handleClickCheckbox} type='checkbox' id={'uncommonWordLimitOption'} name={'uncommonWordLimitOption'} />
                  <div className={`${styles.optionalInputRow} ${optionsEnabled['uncommonWordLimitOption'] ? styles.active : styles.inactive}`}>
                    <h4>Uncommon word limit</h4>
                    <div className={styles.sliderDisplayRow}>
                      <input readOnly={!optionsEnabled['uncommonWordLimitOption']} type='range' onChange={handleChangeBiasSlider} min={1} max={99} step='1' defaultValue={99} />
                      <input readOnly className={styles.sliderValueDisplay} ref={biasInputRef} />
                      <span>%</span>
                    </div>
                  </div>
                </div>

                <div className={styles.optionalRow}>
                  <input checked={optionsEnabled['averageWordLengthOption']} onChange={handleClickCheckbox} type='checkbox' id={'averageWordLengthOption'} name={'averageWordLengthOption'} />
                  <div className={`${styles.optionalInputRow} ${optionsEnabled['averageWordLengthOption'] ? styles.active : styles.inactive}`}>
                    <h4>Average Word Length</h4>
                    <label>
                      <select disabled={!optionsEnabled['averageWordLengthOption']} defaultValue={'moreThan'} id='averageWordLengthComparison' name='averageWordLengthComparison'>
                        <option value='lessThan'>Less than</option>
                        <option value='moreThan'>More than</option>
                      </select>
                    </label>
                    <label>
                      <input disabled={!optionsEnabled['averageWordLengthOption']} type='number' step={'0.01'} defaultValue={'1'} min='0' max={'9999'} id='averageWordLengthValue' name='averageWordLengthValue' />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className={styles.submitArea}>
            <label>
              <span>Max. attempts</span>
              <input ref={attemptsInputRef} type='number' min={10} max={10000} defaultValue={10} />
            </label>
            <button type='submit' className={styles.start}>Generate puzzle</button>
          </div>
        </form>
      </div>
    </main>
  )
}

export default CreateScreen;