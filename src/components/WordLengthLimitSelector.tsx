import { WordLengthPreference, WordLength } from '../App.tsx';


interface WordLengthLimitSelectorProps {
  prefs: WordLengthPreference;
  disabled: boolean;
  handleRemoveWordLength: (wordLength: WordLength) => void;
  handleChangeWordLengthAmount: (e: React.ChangeEvent, wordLength: WordLength) => void;
  handleChangeWordLengthComparison: (e: React.ChangeEvent, wordLength: WordLength) => void;
}


function WordLengthLimitSelector({ prefs, disabled, handleRemoveWordLength, handleChangeWordLengthAmount, handleChangeWordLengthComparison }: WordLengthLimitSelectorProps) {
  const { comparison, value, wordLength } = prefs;
  return (
    <>
      <label>
        <input readOnly disabled={disabled} type='number' step={'0.01'} defaultValue={wordLength} min='0' max={'9999'} id={`length${wordLength}Id`} name={`length${wordLength}Id`} />
      </label>
      <label>
        <select onChange={(e) => handleChangeWordLengthComparison(e, wordLength)} disabled={disabled} defaultValue={'moreThan'} id={`length${wordLength}${comparison}Id`} name={`length${wordLength}${comparison}Id`}>
          <option value='lessThan'>Less than</option>
          <option value='moreThan'>More than</option>
        </select>
      </label>
      <label>
        <input onChange={(e) => handleChangeWordLengthAmount(e, wordLength)} disabled={disabled} type='number' step={'0.01'} defaultValue={'1'} min='0' max={'9999'} id={`length${wordLength}${value}Id`} name={`length${wordLength}${value}Id`} />
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

export default WordLengthLimitSelector;