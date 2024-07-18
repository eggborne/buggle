import styles from './OptionsScreen.module.css'
import { OptionsData } from '../App'
import { debounce } from '../scripts/util'
import { userOptionInputs } from '../config.json';

interface OptionsScreenProps {
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
  <label>
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

function OptionsScreen({ options, changeOption }: OptionsScreenProps) {
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
  console.log('opt', options)
  return (
    <main className={styles.OptionsScreen}>
      <h1>Options</h1>
      <div className={styles.optionsList}>
        {userOptionInputs.map((input) => (
          <OptionInput
            key={input.name}
            label={input.label}
            name={input.name}
            type={input.type}
            value={options[input.name as keyof OptionsData]}
            defaultValue={input.defaultValue}
            onChange={handleChange}
            onPointerUp={undefined}
            min={input.min}
            max={input.max}
          />
        ))}
      </div>
    </main>
  )
}

export default OptionsScreen;