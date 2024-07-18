import styles from './CreateScreen.module.css';
import { useState, useEffect, useRef } from 'react';
import { StoredPuzzleData, BoardRequestData, WordLengthPreference, WordLength, PuzzleDimensions } from '../App.tsx';
import WordLengthLimitSelector from './WordLengthLimitSelector.tsx';


interface CreateScreenProps {
  handleClickPremadePuzzle: (puzzle: StoredPuzzleData) => void;
  startCreatedPuzzlePreview: (options: BoardRequestData) => Promise<void>;
}

const defaultValues: BoardRequestData = {
  dimensions: {
    width: 5,
    height: 5
  },
  letterDistribution: 'boggle',
  maxAttempts: 10,
  returnBest: true,
}

function CreateScreen({ startCreatedPuzzlePreview }: CreateScreenProps) {
  const [optionsEnabled, setOptionsEnabled] = useState<Record<string, boolean>>({
    customLettersOption: false,
    totalWordsOption: false,
    averageWordLengthOption: false,
    uncommonWordLimitOption: false,
    wordLengthLimitOption: false,
  });
  const [dimensions, setDimensions] = useState<PuzzleDimensions>({
    width: defaultValues.dimensions.width,
    height: defaultValues.dimensions.height,
  });
  const [userLetters, setUserLetters] = useState<string[]>([]);
  const [wordLengthPrefs, setWordLengthPrefs] = useState<WordLengthPreference[]>([]);
  const [generating, setGenerating] = useState<boolean>(false);
  const [filtersShowing, setFiltersShowing] = useState<boolean>(true);

  const newWordLengthInputRef = useRef<HTMLInputElement>(null);
  const attemptsInputRef = useRef<HTMLInputElement>(null);
  const returnBestInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (optionsEnabled['customLettersOption'] && userLetters.length > (dimensions.width * dimensions.height)) {
      const shortenedLetters = [...userLetters];
      shortenedLetters.length = dimensions.width * dimensions.height;
      setUserLetters(shortenedLetters);
    }
  }, [dimensions, optionsEnabled]);

  const handleStartCreatedPuzzle = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const target = e.currentTarget as HTMLFormElement;
    const options: BoardRequestData = {
      ...defaultValues,
      dimensions,
      letterDistribution: (target.elements.namedItem('letterDistribution') as HTMLInputElement).value,
      maxAttempts: attemptsInputRef.current && parseInt(attemptsInputRef.current.value) || defaultValues.maxAttempts,      
      returnBest: returnBestInputRef.current ? returnBestInputRef.current.checked : defaultValues.returnBest,
    };
    if (Object.values(optionsEnabled).some((o => o))) {
      options.filters = {};
      if (optionsEnabled['totalWordsOption']) {
        options.filters.totalWordLimits = {
          min: parseInt((target.elements.namedItem('minWords') as HTMLInputElement).value, 10) || 1,
          max: parseInt((target.elements.namedItem('maxWords') as HTMLInputElement).value, 10) || 99999,
        };
      }
      if (optionsEnabled['averageWordLengthOption']) {
        options.filters.averageWordLengthFilter = {
          comparison: (target.elements.namedItem('averageWordLengthComparison') as HTMLInputElement).value,
          value: parseFloat((target.elements.namedItem('averageWordLengthValue') as HTMLInputElement).value),
        };
      }
      if (optionsEnabled['uncommonWordLimitOption']) {
        options.filters.uncommonWordLimit = {
          comparison: (target.elements.namedItem('uncommonWordLimitComparison') as HTMLInputElement).value,
          value: parseInt((target.elements.namedItem('uncommonWordLimitValue') as HTMLInputElement).value),
        };
      }
      if (optionsEnabled['wordLengthLimitOption']) {
        options.filters.wordLengthLimits = [...wordLengthPrefs];
      }
      if (optionsEnabled['customLettersOption']) {
        options.customizations = options.customizations || {};
        options.customizations.customLetters = userLetters.join('');
      }
    }
    setGenerating(true);
    await startCreatedPuzzlePreview(options);
    setGenerating(false);
  }

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newWidth = parseInt(e.target.value, 10);
    setDimensions({ ...dimensions, width: newWidth });
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHeight = parseInt(e.target.value, 10);
    setDimensions({ ...dimensions, height: newHeight });
  };

  const handleChangeSizeSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(e.target.value, 10);
    setDimensions({ width: newSize, height: newSize });
  }

  const handleClickCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    setOptionsEnabled((prevOptionsEnabled) => ({
      ...prevOptionsEnabled,
      [target.name]: !prevOptionsEnabled[target.name],
    }));
  };

  const handleAddNewWordLength = () => {
    if (newWordLengthInputRef.current) {
      const wordLength = parseInt(newWordLengthInputRef.current.value);
      newWordLengthInputRef.current.value = '';
      if (!isNaN(wordLength) && wordLengthPrefs.filter(pref => pref.wordLength === wordLength).length === 0) {
        setWordLengthPrefs((prevPrefs) => {
          return [...prevPrefs, {
            wordLength,
            comparison: 'moreThan',
            value: 1,
          }]
        });
      }
    }
  };

  const handleRemoveWordLength = (wordLength: WordLength) => {
    setWordLengthPrefs((prevPrefs) => {
      return [...prevPrefs].filter(pref => pref.wordLength !== wordLength);
    });
  };

  const handleChangeWordLengthAmount = (e: React.ChangeEvent, wordLength: WordLength) => {
    const target = e.target as HTMLInputElement;
    const nextPrefs = [...wordLengthPrefs];
    const newLengthPref = nextPrefs.filter(pref => pref.wordLength === wordLength)[0];
    newLengthPref.value = parseInt(target.value);
    setWordLengthPrefs(nextPrefs);
  };

  const handleChangeWordLengthComparison = (e: React.ChangeEvent, wordLength: WordLength) => {
    const target = e.target as HTMLInputElement;
    const nextPrefs = [...wordLengthPrefs];
    const newLengthPref = nextPrefs.filter(pref => pref.wordLength === wordLength)[0];
    newLengthPref.comparison = target.value;
    setWordLengthPrefs(nextPrefs);
  };

  const handleChangeCustomLetters = (e: React.ChangeEvent) => {
    const cleanInput = (e.target as HTMLInputElement).value.trim().replace(/[^a-zA-Z]/g, '').toLowerCase().split('');
    if (cleanInput.length <= dimensions.width * dimensions.height) {
      setUserLetters(cleanInput)
    }
  }

  const getTotalLetterAmount = () => dimensions.width * dimensions.height;

  return (
    <main className={styles.CreateScreen}>
      <div className={styles.creationArea}>
        <h1>Create Puzzle</h1>
        <form onSubmit={handleStartCreatedPuzzle}>
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
                  <input value={dimensions.width} onChange={handleWidthChange} type='number' placeholder={defaultValues.dimensions.width.toString()} min='3' max='64' id='puzzleWidth' name='puzzleWidth' />
                </label>
                <label>
                  <span>Height</span>
                  <input value={dimensions.height} onChange={handleHeightChange} type='number' placeholder={defaultValues.dimensions.height.toString()} min='3' max='64' id='puzzleHeight' name='puzzleHeight' />
                </label>
                <input type='range' defaultValue={defaultValues.dimensions.width} onChange={handleChangeSizeSlider} min={3} max={9} step='1' />
              </div>
            </div>
            <div className={styles.optionalSettings}>
              <div className={`${styles.buttonHeader} ${filtersShowing ? styles.active : styles.inactive}`} onClick={() => setFiltersShowing(prevState => !prevState)}>
                <h2>Customization</h2>
              </div>
              <div className={styles.optionalRow}>
                <input checked={optionsEnabled['customLettersOption']} onChange={handleClickCheckbox} type='checkbox' id={'customLettersOption'} name={'customLettersOption'} />
                <div className={`${styles.optionalInputRow} ${styles.textRow} ${optionsEnabled['customLettersOption'] ? styles.active : styles.inactive}`}>
                  <h4>Letters</h4>
                  <div className={styles.textReminder}>{`${getTotalLetterAmount() - userLetters.length} remaining`}</div>
                  <label>    
                    <input onChange={handleChangeCustomLetters} value={userLetters.join('')} disabled={!optionsEnabled['customLettersOption']} type='text' min='9' max='144'/>
                  </label>
                </div>
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
                      <input disabled={!optionsEnabled['totalWordsOption']} type='number' min='1' max='9999' id='minWords' name='minWords' />
                    </label>
                    <label>
                      <span>Max</span>
                      <input disabled={!optionsEnabled['totalWordsOption']} type='number' min='2' max='99999' id='maxWords' name='maxWords' />
                    </label>
                  </div>
                </div>

                <div className={styles.optionalRow}>
                  <input checked={optionsEnabled['uncommonWordLimitOption']} onChange={handleClickCheckbox} type='checkbox' id={'uncommonWordLimitOption'} name={'uncommonWordLimitOption'} />
                  <div className={`${styles.optionalInputRow} ${optionsEnabled['uncommonWordLimitOption'] ? styles.active : styles.inactive}`}>
                    <h4>Uncommon word %</h4>
                    <label>
                      <select disabled={!optionsEnabled['uncommonWordLimitOption']} defaultValue={'moreThan'} id='uncommonWordLimitComparison' name='uncommonWordLimitComparison'>
                        <option value='lessThan'>Less than</option>
                        <option value='moreThan'>More than</option>
                      </select>
                    </label>
                    <label>
                      <input disabled={!optionsEnabled['uncommonWordLimitOption']} type='number' step={'1'} defaultValue={'1'} min='0' max={'9999'} id='uncommonWordLimitValue' name='uncommonWordLimitValue' />
                    </label>
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
                      <input disabled={!optionsEnabled['averageWordLengthOption']} type='number' step={'0.1'} defaultValue={'1'} min='0' max={'9999'} id='averageWordLengthValue' name='averageWordLengthValue' />
                    </label>
                  </div>
                </div>

                <div className={`${styles.optionalRow} ${styles.expandable}`}>
                  <input checked={optionsEnabled['wordLengthLimitOption']} onChange={handleClickCheckbox} type='checkbox' id={'wordLengthLimitOption'} name={'wordLengthLimitOption'} />
                  <div className={`${styles.optionalInputRow} ${styles.tripleInput} ${optionsEnabled['wordLengthLimitOption'] ? styles.active : styles.inactive}`}>
                    <h4>Amount of word lengths</h4>
                    <div className={styles.gridBody}>
                      <div>length</div><div>must appear</div><div>amount</div><div></div>
                      {wordLengthPrefs.map((lengthPref => {
                        return (
                          <WordLengthLimitSelector
                            key={`lengthSelector${lengthPref.wordLength}`}
                            prefs={lengthPref}
                            disabled={!optionsEnabled['wordLengthLimitOption']}
                            handleRemoveWordLength={handleRemoveWordLength}
                            handleChangeWordLengthAmount={handleChangeWordLengthAmount}
                            handleChangeWordLengthComparison={handleChangeWordLengthComparison}
                          />
                        )
                      }))}
                      <label>
                        <input ref={newWordLengthInputRef} disabled={!optionsEnabled['wordLengthLimitOption']} type='number' step={'1'} min='0' max={'15'} id={`newWordLengthLimitInput`} name={`newWordLengthLimitInput`} />
                      </label>
                      <div><button type='button' onClick={handleAddNewWordLength} disabled={!optionsEnabled['wordLengthLimitOption']}>Add</button></div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
          <div className={styles.submitArea}>
            <label htmlFor={'attempts'}>
              <span>Max. attempts</span>
              <input id={'attempts'} name={'attempts'} ref={attemptsInputRef} type='number' min={1} max={100000} defaultValue={10} />
            </label>
            <label htmlFor={'returnBest'} className={styles.checkboxArea}>
              <span>Return best</span>
              <input id={'returnBest'} name={'returnBest'} ref={returnBestInputRef} type='checkbox' />
            </label>
            <button disabled={generating} type='submit' className={styles.start}>{generating ? `Generating...` : `Generate puzzle`}</button>
          </div>
        </form>
      </div>
    </main>
  )
}

export default CreateScreen;