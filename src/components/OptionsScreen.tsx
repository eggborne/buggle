import styles from './OptionsScreen.module.css'
import { OptionsData } from '../App'
import { debounce } from '../scripts/util'
import { userOptionInputs } from '../config.json';
import PuzzleIcon from './PuzzleIcon';

interface OptionsScreenProps {
  hidden: boolean;
  options: OptionsData;
  changeOption: (optionKey: string, newValue: string | number) => void;
}

interface OptionInputProps {
  label: string;
  name: string;
  type: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPointerUp?: (e: React.PointerEvent<HTMLInputElement>) => void;
  defaultValue?: string | number;
  min?: number;
  max?: number;
}

const OptionInput = ({ label, name, type, value, defaultValue, onChange, onPointerUp, min, max }: OptionInputProps) => (
  <label className={`${styles.optionInput} ${styles[type]}`}>
    <span>{label}</span>
    <input
      id={name}
      name={name}
      type={type}
      value={value}
      defaultValue={defaultValue}
      onChange={onChange}
      onPointerUp={onPointerUp}
      min={min}
      max={max}
    />
  </label>
);

function OptionsScreen({ options, hidden, changeOption }: OptionsScreenProps) {
  const debouncedChangeOption = debounce((name: string, value: string | number) => {
    changeOption(name, value);
  }, 500);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.name as string;
    const value = e.target.type === 'range' ? parseFloat(e.target.value) : e.target.value;
    if (e.target.type === 'range') {
      changeOption(name, value);
    } else {
      debouncedChangeOption(name, value);
    }
  }
  const optionsScreenClass = `${styles.OptionsScreen}${hidden ? ' hidden' : ''}`;

  const colorInputs = userOptionInputs.filter(input => input.type === 'color');
  const rangeInputs = userOptionInputs.filter(input => input.type === 'range');

  return (
    <main className={optionsScreenClass}>
      <h1>Options</h1>
      <div className={styles.optionsList}>
        {colorInputs.map((input) => (
          <OptionInput key={input.name} label={input.label} name={input.name} type={input.type} value={options[input.name as keyof OptionsData]} defaultValue={input.defaultValue} onChange={handleChange} onPointerUp={undefined} min={input.min} max={input.max}
          />
        ))}
      </div>
      
      <div className={styles.optionsList}>
        {rangeInputs.map((input) => (
          <OptionInput key={input.name} label={input.label} name={input.name} type={input.type} value={options[input.name as keyof OptionsData]} defaultValue={input.defaultValue} onChange={handleChange} onPointerUp={undefined} min={input.min} max={input.max}
          />
        ))}
      </div>
      <div className={styles.puzzlePreview}>
        <PuzzleIcon
          size={{ width: 5, height: 5 }}
          contents={['I', 'T', 'X', 'S', 'H', 'W', 'L', 'A', 'X', 'L', 'Z', 'N', 'B', 'U', 'Y', 'S', 'W', 'N', 'C', 'Q', 'E', 'V', 'J', 'R', 'U']}
          iconSize={`var(--game-board-size)`}
        />
      </div>
    </main>
  )
}

export default OptionsScreen;