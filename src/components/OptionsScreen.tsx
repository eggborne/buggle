import styles from './OptionsScreen.module.css'
import { OptionsData } from '../App'
import { debounce } from '../scripts/util'

interface OptionsScreenProps {
  options: OptionsData;
  changeOption: (optionKey: string, newValue: string | number) => void;
}

function OptionsScreen({ options, changeOption }: OptionsScreenProps) {
  const debouncedChangeOption = debounce((name, value) => {
    changeOption(name, value);
  }, 300); // Adjust delay (ms) as needed 

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedChangeOption(e.target.name, e.target.value);
  }
  return (
    <main className={styles.OptionsScreen}>
      <h1>Options</h1>
      <div className={styles.optionsList}>
        <label>
          <span>Game Background Color</span>
          <input name={'gameBackgroundColor'} onChange={handleChange} type='color' defaultValue={options.gameBackgroundColor} />
        </label>
        <label>
          <span>Cube Roundness</span>
          <input name={'cubeRoundness'} onPointerUp={(e) => changeOption(e.currentTarget.name, e.currentTarget.value)} type='range' defaultValue={options.cubeRoundness} min='0' max='100' />
        </label>
        <label>
          <span>Swipe buffer</span>
          <input name={'swipeBuffer'} onPointerUp={(e) => changeOption(e.currentTarget.name, e.currentTarget.value)} type='range' defaultValue={options.swipeBuffer} min='0' max='100' />
        </label>
      </div>
    </main>
  )
}

export default OptionsScreen;