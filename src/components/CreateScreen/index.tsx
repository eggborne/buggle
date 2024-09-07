import styles from './CreateScreen.module.css';
import { useState, useEffect, useRef } from 'react';
import { BoardRequestData, InputRefsData, PuzzleDimensions, StoredPuzzleData } from '../../types/types';
import { useFirebase } from '../../context/FirebaseContext';
import { useUser } from '../../context/UserContext';
import { createSolvedPuzzle } from '../../scripts/fetch';
import { defaultBoardRequestValues, letterKeys } from './../../config.json';
import { encodeMatrix } from '../../scripts/util';
import { triggerShowMessage } from '../../hooks/useMessageBanner';
import SizeSelection from '../SizeSelection';

interface CreateScreenProps {
  hidden: boolean;
}

const defaultValues: BoardRequestData = { ...defaultBoardRequestValues };

function CreateScreen({ hidden }: CreateScreenProps) {
  const { user, changePhase } = useUser();
  const { startNewGame, uploadPuzzle } = useFirebase();

  const [optionsEnabled, setOptionsEnabled] = useState<Record<string, (Record<string, boolean>)>>({
    customizations: {
      customLetters: false,
      requiredWords: false,
    },
    filters: {
      averageWordLength: false,
      commonWordAmount: false,
      totalWordLimits: false,
    }
  });
  const [dimensions, _setDimensions] = useState<PuzzleDimensions>({
    width: defaultValues.dimensions.width,
    height: defaultValues.dimensions.height,
  });
  const [generating, setGenerating] = useState<boolean>(false);
  const [filtersShowing, setFiltersShowing] = useState<boolean>(true);

  const [sizeSelected, setSizeSelected] = useState<number>(defaultValues.dimensions.width);
  const [userLetters, setUserLetters] = useState<string[]>([]);
  const [userWords, setUserWords] = useState<string[]>([]);
  // const [wordLengthPrefs, setWordLengthPrefs] = useState<WordLengthPreference[]>([]);
  // const newWordLengthInputRef = useRef<HTMLInputElement>(null);

  const requiredWordInputRef = useRef<HTMLInputElement>(null);

  const inputRefs: InputRefsData = {
    customizations: {
      customLetters: {
        letterList: userLetters,
        shuffle: useRef<HTMLInputElement>(null),
      },
      requiredWords: {
        wordList: userWords,
      },
    },
    filters: {
      averageWordLength: {
        comparison: useRef<HTMLSelectElement>(null),
        value: useRef<HTMLInputElement>(null),
      },
      commonWordAmount: useRef<HTMLInputElement>(null),
      totalWordLimits: {
        min: useRef<HTMLInputElement>(null),
        max: useRef<HTMLInputElement>(null),
      }
    },
    // letterDistribution: useRef<HTMLSelectElement>(null),
    maxAttempts: useRef<HTMLInputElement>(null),
    theme: useRef<HTMLInputElement>(null),
  }

  useEffect(() => {
    if (optionsEnabled.customizations.customLetters && userLetters.length > (dimensions.width * dimensions.height)) {
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
    const options: BoardRequestData = {
      ...defaultValues,
      dimensions: {
        width: sizeSelected,
        height: sizeSelected,
      },
      letterDistribution: ['boggle', 'bigBoggle', 'superBigBoggle'][sizeSelected - 4],
      maxAttempts: Number(inputRefs.maxAttempts.current?.value),
      returnBest: true,
      customizations: customOptions || {
        customLetters: {
          ...defaultValues.customizations?.customLetters,
          letterList: userLetters,
          shuffle: inputRefs.customizations.customLetters.shuffle.current?.checked,
        },
        requiredWords: {
          wordList: userWords,
        }
      },
      filters:
      {
        averageWordLength: {
          ...defaultValues.filters?.averageWordLength,
          comparison: inputRefs.filters.averageWordLength.comparison.current?.value || '',
          value: Number(inputRefs.filters.averageWordLength.value.current?.value),
        },
        commonWordAmount: Number(inputRefs.filters.commonWordAmount.current?.value),
        totalWordLimits: {
          ...defaultValues.filters?.totalWordLimits,
          min: Number(inputRefs.filters.totalWordLimits.min.current?.value) || 50,
          max: Number(inputRefs.filters.totalWordLimits.max.current?.value) || 99999
        },
      },
      theme: inputRefs.theme.current?.value,
    };

    for (const categoryName in optionsEnabled) {
      const category = optionsEnabled[categoryName];
      const allFalse = !Object.values(category).some(o => o);
      if (allFalse) {
        console.log('deleting', categoryName)
        delete options[categoryName as keyof BoardRequestData];
      }
    }

    if (!optionsEnabled.customizations.customLetters) delete options.customizations?.customLetters;
    if (!optionsEnabled.customizations.requiredWords) delete options.customizations?.requiredWords;
    if (!optionsEnabled.filters.averageWordLength) delete options.filters?.averageWordLength;
    if (!optionsEnabled.filters.commonWordAmount) delete options.filters?.commonWordAmount;
    if (!optionsEnabled.filters.totalWordLimits) delete options.filters?.totalWordLimits;

    setGenerating(true);
    const generatedBoardData = await createSolvedPuzzle(options);
    console.log('generatedBoardData', generatedBoardData);
    if (!generatedBoardData) {
      triggerShowMessage(`No puzzle found in ${options.maxAttempts} attempts :(`, 20000)
      setGenerating(false);
      return;
    }
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
    const key = (letterKeys as Record<string, Record<string, string>>)[options.letterDistribution || 'error'];
    const encodedLetterString = encodeMatrix(gameData.matrix, key).flat().join('');
    const puzzleData: StoredPuzzleData = {
      allWords: gameData.wordList,
      averageWordLength: gameData.metadata.averageWordLength,
      dateCreated: gameData.metadata.dateCreated,
      dimensions: gameData.dimensions,
      id: `${gameData.dimensions.width, gameData.dimensions.height}${encodedLetterString}`,
      letterString: encodedLetterString,
      commonWordAmount: gameData.metadata.commonWordAmount,
      totalWords: gameData.wordList.length
    }
    if (gameData.theme) {
      puzzleData.theme = gameData.theme;
      puzzleData.specialWords = gameData.specialWords
    }
    uploadPuzzle(puzzleData);
  }

  const handleChangeCommonWordsSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    console.log('new commonWordAmount value', newValue);
  }

  const handleClickCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    setOptionsEnabled((prevOptionsEnabled) => {
      const category = target.name.split('-')[0];
      const newOption = target.name.split('-')[1];
      const nextChangedOptionStatus = !prevOptionsEnabled[category][newOption];
      const nextOptions = { ...prevOptionsEnabled };
      nextOptions[category][newOption] = nextChangedOptionStatus;
      if (nextChangedOptionStatus === true) {
        if (newOption === 'requiredWords') {
          nextOptions.customizations.customLetters = false;
        }
        if (newOption === 'customLetters') {
          nextOptions.customizations.requiredWords = false;
        }
      }
      console.log('setting optionsEnabled', nextOptions)
      return nextOptions;
    });
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

  const handleChangeSize = (newSize: number) => {
    setSizeSelected(newSize);
  }

  const wordAmountChoices = ['', 'LOW', 'MED', 'HIGH'];

  const createScreenClass = `${styles.CreateScreen}${hidden ? ' hidden' : ''}`;
  return (
    <main className={createScreenClass}>
      <h1>Create a Puzzle</h1>
      <form className={styles.puzzleOptions} onSubmit={handleStartCreatedPuzzle}>

        <button type='submit' style={{ position: 'absolute', display: 'none' }}>submit</button>

        <div className={styles.mainSettings}>

          <SizeSelection sizeSelected={sizeSelected} handleChangeSize={handleChangeSize} iconSize={{
            width: `calc(var(--main-width) / 5)`,
            height: `calc(var(--main-width) / 5)`
          }} />

        </div>

        <div className={styles.optionalSettings}>

          <div className={`${styles.buttonHeader} ${filtersShowing ? styles.active : styles.inactive}`} onClick={() => setFiltersShowing(prevState => !prevState)}>
            <h2 className={styles.categoryHeader}><span>Customization</span></h2>
          </div>

          <div className={styles.optionalRow}>
            <input checked={optionsEnabled.customizations.requiredWords} onChange={handleClickCheckbox} type='checkbox' name={'customizations-requiredWords'} />
            <div className={`${styles.optionalInputRow} ${styles.textRow} ${optionsEnabled.customizations.requiredWords ? styles.active : styles.inactive}`}>
              <h4>Themed</h4>
              <label>
                <input ref={inputRefs.theme} placeholder={'Theme name'} disabled={!optionsEnabled.customizations.requiredWords} type='text' min='9' max='144' />
              </label>
              <div className={styles.wordCollection}>
                {userWords.sort((a, b) => b.length - a.length).map(word =>
                  <div key={word} className={styles.collectionMember}>
                    <span>{word}</span>
                    <button onClick={() => handleRemoveRequiredWord(word)} type='button' className='x-close'>X</button>
                  </div>
                )}
              </div>
              <label>
                <input autoCorrect='on' onKeyDown={handleKeyPress} ref={requiredWordInputRef} disabled={!optionsEnabled.customizations.requiredWords} type='text' min='3' max='15' />
                <button onClick={handleAddRequiredWord} type='button'>Add&nbsp;word</button>
              </label>
              <label style={{
                gridColumnStart: 2,
              }}>
              </label>
            </div>
          </div>
        </div>

        <div className={styles.optionalRow}>
          <input checked={optionsEnabled.customizations.customLetters} onChange={handleClickCheckbox} type='checkbox' id={'customLetters'} name={'customizations-customLetters'} />
          <div className={`${styles.optionalInputRow} ${styles.textRow} ${optionsEnabled.customizations.customLetters ? styles.active : styles.inactive}`}>
            <h4>Custom letters</h4>
            <div className={styles.textReminder}>{`${(dimensions.width * dimensions.height) - userLetters.length} remaining`}</div>
            <label>
              <input onChange={handleChangeCustomLetters} value={userLetters.join('')} disabled={!optionsEnabled.customizations.customLetters} type='text' min='9' max='144' />
            </label>
            <label style={{ gridColumnStart: 2 }}>
              <span>Shuffle</span>
              <input ref={inputRefs.customizations.customLetters.shuffle} disabled={!optionsEnabled.customizations.customLetters} type='checkbox' />
            </label>
          </div>
        </div>

        <div className={styles.optionalSettings}>
          <div className={`${styles.buttonHeader} ${filtersShowing ? styles.active : styles.inactive}`} onClick={() => setFiltersShowing(prevState => !prevState)}>
            <h2 className={styles.categoryHeader}>Filters</h2>
          </div>
          <div className={styles.optionalRow}>
            <input checked={optionsEnabled.filters.totalWordLimits} onChange={handleClickCheckbox} type='checkbox' id={'totalWordLimits'} name={'filters-totalWordLimits'} />
            <div className={`${styles.optionalInputRow} ${optionsEnabled.filters.totalWordLimits ? styles.active : styles.inactive}`}>
              <h4>Total words</h4>
              <div className={styles.doubleInputRow}>
                <label>
                  <span>Min</span>
                  <input ref={inputRefs.filters.totalWordLimits.min} disabled={!optionsEnabled.filters.totalWordLimits} type='number' min='50' max='9999' />
                </label>
                <label>
                  <span>Max</span>
                  <input ref={inputRefs.filters.totalWordLimits.max} disabled={!optionsEnabled.filters.totalWordLimits} type='number' min='51' max='9999' />
                </label>
              </div>
            </div>
          </div>

          <div className={styles.optionalRow}>
            <input checked={optionsEnabled.filters.commonWordAmount} onChange={handleClickCheckbox} type='checkbox' id={'commonWordAmount'} name={'filters-commonWordAmount'} />
            <div className={`${styles.optionalInputRow} ${optionsEnabled.filters.commonWordAmount ? styles.active : styles.inactive}`}>
              <h4>Common words</h4>
              <span className={styles.sliderValue}>{wordAmountChoices[Number(inputRefs.filters.commonWordAmount.current?.value)]}</span>
              <input ref={inputRefs.filters.commonWordAmount} disabled={!optionsEnabled.filters.commonWordAmount} type='range' defaultValue={defaultValues.filters?.commonWordAmount} onChange={handleChangeCommonWordsSlider} min={1} max={3} step='1' />
            </div>
          </div>

          <div className={styles.optionalRow}>
            <input checked={optionsEnabled.filters.averageWordLength} onChange={handleClickCheckbox} type='checkbox' name={'filters-averageWordLength'} />
            <div className={`${styles.optionalInputRow} ${optionsEnabled.filters.averageWordLength ? styles.active : styles.inactive}`}>
              <h4>Average Word Length</h4>
              <label>
                <select ref={inputRefs.filters.averageWordLength.comparison} disabled={!optionsEnabled.filters.averageWordLength} defaultValue={'moreThan'}>
                  <option value='lessThan'>Less than</option>
                  <option value='moreThan'>More than</option>
                </select>
              </label>
              <label>
                <input ref={inputRefs.filters.averageWordLength.value} disabled={!optionsEnabled.filters.averageWordLength} type='number' step={'0.1'} defaultValue={'5'} min='0' max={'9999'} />
              </label>
            </div>
          </div>

        </div>

        <div className={styles.submitArea}>
          <label htmlFor={'attempts'}>
            <span>Effort (more takes longer)</span>
            <input ref={inputRefs.maxAttempts} type='range' defaultValue={defaultValues.maxAttempts} min={1} max={50000} step='1' />

          </label>
          <button disabled={generating} type='submit' className={styles.start}>{generating ? `Generating...` : `Generate puzzle`}</button>
        </div>

      </form>
    </main>
  )
}

export default CreateScreen;