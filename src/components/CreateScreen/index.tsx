import styles from './CreateScreen.module.css';
import { useState, useEffect, useRef } from 'react';
import { BoardRequestData, WordLengthPreference, PuzzleDimensions } from '../../types/types';
import { useFirebase } from '../../context/FirebaseContext';
import { useUser } from '../../context/UserContext';
import { createSolvedPuzzle } from '../../scripts/fetch';

interface CreateScreenProps {
  hidden: boolean;
}

interface WordLengthLimitSelectorProps {
  prefs: WordLengthPreference;
  disabled: boolean;
  handleRemoveWordLength: (wordLength: number) => void;
  handleChangeWordLengthAmount: (e: React.ChangeEvent, wordLength: number) => void;
  handleChangeWordLengthComparison: (e: React.ChangeEvent, wordLength: number) => void;
}


function WordLengthLimitSelector({ prefs, disabled, handleRemoveWordLength, handleChangeWordLengthAmount, handleChangeWordLengthComparison }: WordLengthLimitSelectorProps) {
  const { comparison, value, wordLength } = prefs;
  return (
    <>
      <label>
        <input readOnly disabled={disabled} type='number' defaultValue={wordLength} min='0' max={'9999'} id={`length${wordLength}Id`} name={`length${wordLength}Id`} />
      </label>
      <label>
        <select onChange={(e) => handleChangeWordLengthComparison(e, wordLength)} disabled={disabled} defaultValue={'moreThan'} id={`length${wordLength}${comparison}Id`} name={`length${wordLength}${comparison}Id`}>
          <option value='lessThan'>Less than</option>
          <option value='moreThan'>More than</option>
        </select>
      </label>
      <label>
        <input onChange={(e) => handleChangeWordLengthAmount(e, wordLength)} disabled={disabled} type='number' step={'1'} defaultValue={'0'} min='0' max={'99999'} id={`length${wordLength}${value}Id`} name={`length${wordLength}${value}Id`} />
      </label>
      <button
        onClick={() => handleRemoveWordLength(wordLength)}
        className={`x-close`}
        style={{
          fontSize: '1rem',
          width: '1.75rem',
          height: '1.75rem',
          padding: '0',
          borderRadius: '0.1rem',
        }}
      >X</button>
    </>
  );
}

const defaultValues: BoardRequestData = {
  dimensions: {
    width: 5,
    height: 5
  },
  maxAttempts: 10,
  returnBest: true,
}

function CreateScreen({ hidden }: CreateScreenProps) {
  const { user, changePhase } = useUser();
  const { startNewGame } = useFirebase();

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
  const [userWords, setUserWords] = useState<string[]>([]);
  const [wordLengthPrefs, setWordLengthPrefs] = useState<WordLengthPreference[]>([]);
  const [generating, setGenerating] = useState<boolean>(false);
  const [filtersShowing, setFiltersShowing] = useState<boolean>(true);

  const newWordLengthInputRef = useRef<HTMLInputElement>(null);
  const attemptsInputRef = useRef<HTMLInputElement>(null);
  const returnBestInputRef = useRef<HTMLInputElement>(null);
  const shuffleCustomLettersRef = useRef<HTMLInputElement>(null);
  const requiredWordInputRef = useRef<HTMLInputElement>(null);
  const convertQForLettersRef = useRef<HTMLInputElement>(null);
  const convertQForWordsRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (optionsEnabled['customLettersOption'] && userLetters.length > (dimensions.width * dimensions.height)) {
      setUserLetters((prevLetters) => prevLetters.slice(0, dimensions.width * dimensions.height));
    }
  }, [dimensions, optionsEnabled]);

  const customOptions: BoardRequestData | false = false;
  
  // const testSize = 5;
  // const customOptions = {
  //   dimensions: {
  //     width: testSize,
  //     height: testSize
  //   },
  //   letterDistribution: 'modernEnglish',
  //   maxAttempts: 20000000,
  //   returnBest: true,
  //   customizations: {
  //     // customLetters: {
  //     //   letterList: 'XXXXXXXXRIEVERGOODBOYPAWK'.split(''),
  //     //   shuffle: true,
  //     // },
  //     requiredWords: {
  //       wordList: [
  //         "sketch", "paint", "sculpt", "collage", "etch",
  //         "print", "carve", "mold", "weave", "mosaic",
  //         "stipple",
  //       ],
  //       convertQ: false,
  //     }
  //   },
  //   theme: '🖌️ Art Techniques 🖌️'
  // }

  const handleStartCreatedPuzzle = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const target = e.currentTarget as HTMLFormElement;
    const options: BoardRequestData = customOptions || {
      ...defaultValues,
      dimensions,
      letterDistribution: (target.elements.namedItem('letterDistribution') as HTMLInputElement).value,
      maxAttempts: attemptsInputRef.current && Number(attemptsInputRef.current.value) || defaultValues.maxAttempts,
      returnBest: returnBestInputRef.current ? returnBestInputRef.current.checked : defaultValues.returnBest,
    };

    if (Object.values(optionsEnabled).some((o => o))) {
      console.log('-------------------------------------------> options enables??', optionsEnabled, options)
      // if (filters) {
        if (optionsEnabled['totalWordsOption']) {
          options.filters = {};
          options.filters.totalWordLimits = {
            min: Number((target.elements.namedItem('minWords') as HTMLInputElement).value) || 1,
            max: Number((target.elements.namedItem('maxWords') as HTMLInputElement).value) || 99999,
          };
        }
        if (optionsEnabled['averageWordLengthOption']) {
          options.filters = {};
          options.filters.averageWordLengthFilter = {
            comparison: (target.elements.namedItem('averageWordLengthComparison') as HTMLInputElement).value,
            value: Number((target.elements.namedItem('averageWordLengthValue') as HTMLInputElement).value),
          };
        }
        if (optionsEnabled['uncommonWordLimitOption']) {
          options.filters = {};
          options.filters.uncommonWordLimit = {
            comparison: (target.elements.namedItem('uncommonWordLimitComparison') as HTMLInputElement).value,
            value: Number((target.elements.namedItem('uncommonWordLimitValue') as HTMLInputElement).value),
          };
        }
        if (optionsEnabled['wordLengthLimitOption']) {
          options.filters = {};
          options.filters.wordLengthLimits = [...wordLengthPrefs];
        }
      // }
      // if (customizations) {
        console.log('-------------------------------------------> customizations enables??', optionsEnabled)

        if (optionsEnabled['customLettersOption']) {
          options.customizations = {};
          options.customizations.customLetters = {
            letterList: userLetters,
            convertQ: convertQForLettersRef.current !== null && convertQForLettersRef.current.checked,
            shuffle: shuffleCustomLettersRef.current !== null && shuffleCustomLettersRef.current.checked
          };
        }
        if (optionsEnabled['requiredWordsOption']) {
          options.customizations = {};
          options.customizations.requiredWords = {
            wordList: userWords.sort((a, b) => b.length - a.length),
            convertQ: convertQForWordsRef.current !== null && convertQForWordsRef.current.checked
          };
        }
      // }
    }
    setGenerating(true);
    const generatedBoardData = await createSolvedPuzzle(options);
    console.log('generatedBoardData', generatedBoardData);
    if (!generatedBoardData) return;
    const gameData = {
      ...generatedBoardData,
      allWords: new Set(generatedBoardData.wordList),
      dimensions: options.dimensions,
      letterMatrix: generatedBoardData.matrix,
      gameOver: false,
      playerProgress: {
        [user.uid]: {
          attackPoints: 0,
          foundOpponentWords: {},
          score: 0,
          touchedCells: [],
          uid: user.uid,
        },
      },
      timeLimit: 180,
      wordBonus: 5,
    };
    if (options.customizations) {
      if (options.customizations.requiredWords) {
        gameData.specialWords = options.customizations.requiredWords.wordList.map(word => word.toLowerCase());
        gameData.theme = options.theme;
      }
    }
    await startNewGame(gameData);
    changePhase('game');
    setGenerating(false);
  }

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newWidth = Number(e.target.value);
    setDimensions({ ...dimensions, width: newWidth });
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHeight = Number(e.target.value);
    setDimensions({ ...dimensions, height: newHeight });
  };

  const handleChangeSizeSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = Number(e.target.value);
    setDimensions({ width: newSize, height: newSize });
  }

  const handleClickCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    setOptionsEnabled((prevOptionsEnabled) => {
      const newOption = target.name;
      const nextChangedOptionStatus = !prevOptionsEnabled[newOption];
      const nextOptions = { ...prevOptionsEnabled };
      nextOptions[target.name] = nextChangedOptionStatus;
      if (nextChangedOptionStatus === true) {
        if (newOption === 'requiredWordsOption') {
          nextOptions.customLettersOption = false;
        }
        if (newOption === 'customLettersOption') {
          nextOptions.requiredWordsOption = false;
        }
      }
      return nextOptions;
    });
  };

  const handleAddNewWordLength = () => {
    if (newWordLengthInputRef.current) {
      const wordLength = Number(newWordLengthInputRef.current.value);
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

  const handleRemoveWordLength = (wordLength: number) => {
    setWordLengthPrefs((prevPrefs) => {
      return [...prevPrefs].filter(pref => pref.wordLength !== wordLength);
    });
  };

  const handleChangeWordLengthAmount = (e: React.ChangeEvent, wordLength: number) => {
    const target = e.target as HTMLInputElement;
    const nextPrefs = [...wordLengthPrefs];
    const newLengthPref = nextPrefs.filter(pref => pref.wordLength === wordLength)[0];
    newLengthPref.value = Number(target.value);
    setWordLengthPrefs(nextPrefs);
  };

  const handleChangeWordLengthComparison = (e: React.ChangeEvent, wordLength: number) => {
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

  const handleAddRequiredWord = () => {
    if (requiredWordInputRef.current) {
      const newWord = requiredWordInputRef.current.value;
      const cleanedWord = newWord.trim().replace(/[^a-zA-Z]/g, '').toUpperCase();
      if (!cleanedWord || cleanedWord.length < 3 || userWords.includes(cleanedWord)) {
        requiredWordInputRef.current.value = cleanedWord;
        return;
      }
      setUserWords(prevRequiredWords => [...prevRequiredWords, cleanedWord]);
      requiredWordInputRef.current.value = '';
      requiredWordInputRef.current.focus();
    }
  }

  const handleRemoveRequiredWord = (wordToRemove: string) => {
    setUserWords((prevUserWords) => {
      const nextUserWords = [...prevUserWords.filter(word => word !== wordToRemove)];
      return nextUserWords;
    });
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddRequiredWord();
    }
  }

  const getTotalLetterAmount = () => dimensions.width * dimensions.height;

  const createScreenClass = `${styles.CreateScreen}${hidden ? ' hidden' : ''}`;
  return (
    <main className={createScreenClass}>
      <h1>Create a Puzzle</h1>
      <form className={styles.puzzleOptions} onSubmit={handleStartCreatedPuzzle}>
        <button type='submit' style={{ position: 'absolute', display: 'none' }}>submit</button>

        <div className={styles.mainSettings}>
          <label className={styles.selectRow}>
            <span>Letter distribution</span>
            <select disabled={optionsEnabled['customLettersOption'] || optionsEnabled['requiredWordsOption']} id='letterDistribution' name='letterDistribution'>
              <option value='boggle'>Boggle®</option>
              <option value='bigBoggle'>Big Boggle®</option>
              <option value='superBigBoggle'>Super Big Boggle®</option>
              <option value='scrabble'>Scrabble®</option>
              <option value='modernEnglish'>Modern English</option>
              <option value='random'>True Random</option>
              <option value='syllableUnits'>Syllables</option>
            </select>
          </label>
          <label>
            <span>Width</span>
            <input value={dimensions.width} onChange={handleWidthChange} type='number' placeholder={defaultValues.dimensions.width.toString()} min='3' max='64' id='puzzleWidth' name='puzzleWidth' />
          </label>
          <label>
            <span>Height</span>
            <input value={dimensions.height} onChange={handleHeightChange} type='number' placeholder={defaultValues.dimensions.height.toString()} min='3' max='64' id='puzzleHeight' name='puzzleHeight' />
          </label>
          <label>
            <input type='range' defaultValue={defaultValues.dimensions.width} onChange={handleChangeSizeSlider} min={3} max={9} step='1' />
          </label>
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
                <input onChange={handleChangeCustomLetters} value={userLetters.join('')} disabled={!optionsEnabled['customLettersOption']} type='text' min='9' max='144' />
              </label>
              <label style={{
                gridColumnStart: 2,
              }}>
                <span>Convert Q to Qu</span>
                <input ref={convertQForLettersRef} disabled={!optionsEnabled['customLettersOption']} type='checkbox' />
                <span>Shuffle</span>
                <input ref={shuffleCustomLettersRef} disabled={!optionsEnabled['customLettersOption']} type='checkbox' />
              </label>
            </div>
          </div>
          <div className={styles.optionalRow}>
            <input checked={optionsEnabled['requiredWordsOption']} onChange={handleClickCheckbox} type='checkbox' id={'requiredWordsOption'} name={'requiredWordsOption'} />
            <div className={`${styles.optionalInputRow} ${styles.textRow} ${optionsEnabled['requiredWordsOption'] ? styles.active : styles.inactive}`}>
              <h4>Required words</h4>
              <div className={styles.wordCollection}>
                {userWords.sort((a, b) => b.length - a.length).map(word =>
                  <div key={word} className={styles.collectionMember}>
                    <span>{word}</span>
                    <button onClick={() => handleRemoveRequiredWord(word)} type='button' className='x-close'>X</button>
                  </div>
                )}
              </div>
              <label>
                <input autoCorrect='on' onKeyDown={handleKeyPress} ref={requiredWordInputRef} disabled={!optionsEnabled['requiredWordsOption']} type='text' min='3' max='15' />
                <button onClick={handleAddRequiredWord} type='button'>Add</button>
              </label>
              <label style={{
                gridColumnStart: 2,
              }}>
                <span>Convert Q to Qu</span>
                <input ref={convertQForWordsRef} disabled={!optionsEnabled['requiredWordsOption']} type='checkbox' />
              </label>
            </div>
          </div>
        </div>

        <div className={styles.optionalSettings}>
          <div className={`${styles.buttonHeader} ${filtersShowing ? styles.active : styles.inactive}`} onClick={() => setFiltersShowing(prevState => !prevState)}>
            <h2>Filters</h2>
          </div>
          <div className={styles.optionalRow}>
            <input checked={optionsEnabled['totalWordsOption']} onChange={handleClickCheckbox} type='checkbox' id={'totalWordsOption'} name={'totalWordsOption'} />
            <div className={`${styles.optionalInputRow} ${optionsEnabled['totalWordsOption'] ? styles.active : styles.inactive}`}>
              <h4>Total words</h4>
              <div className={styles.doubleInputRow}>
                <label>
                  <span>Min</span>
                  <input disabled={!optionsEnabled['totalWordsOption']} type='number' min='1' max='999 99' id='minWords' name='minWords' />
                </label>
                <label>
                  <span>Max</span>
                  <input disabled={!optionsEnabled['totalWordsOption']} type='number' min='2' max='99999' id='maxWords' name='maxWords' />
                </label>
              </div>
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

          <div className={`${styles.optionalRow}`}>
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

        <div className={styles.submitArea}>
          <label htmlFor={'attempts'}>
            <span>Max. attempts</span>
            <input id={'attempts'} name={'attempts'} ref={attemptsInputRef} type='number' min={1} max={1000000} defaultValue={10} />
          </label>
          <label htmlFor={'returnBest'} className={styles.checkboxArea}>
            <span>Return best</span>
            <input id={'returnBest'} name={'returnBest'} ref={returnBestInputRef} type='checkbox' />
          </label>
          {/* <button disabled={generating} type='submit' className={styles.start}>{generating ? `Generating...` : `Generate puzzle`}</button> */}
          <button disabled={false} type='submit' className={styles.start}>{generating ? `Generating...` : `Generate puzzle`}</button>
        </div>

      </form>
    </main>
  )
}

export default CreateScreen;