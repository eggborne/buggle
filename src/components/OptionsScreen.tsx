import styles from './OptionsScreen.module.css'
import { OptionsData } from '../App'

interface OptionsScreenProps {
  options: OptionsData | null;
  changeOption: (optionKey: string, newValue: string | number) => void;
}

function OptionsScreen({ options, changeOption }: OptionsScreenProps) {

  const onChangeOption = (e: React.ChangeEvent) => {
    const target = e.currentTarget as any;
    changeOption(target.name, target.value);
  }

  return (
    <main className={styles.OptionsScreen}>
      <h1>Options</h1>
      <div className={styles.optionsList}>
        <label>
          <span>Game Background Color</span>
          <input name={'gameBackgroundColor'} onChange={onChangeOption} type='color' defaultValue={options?.gameBackgroundColor} />
        </label>
        <label>
          <span>Cube Roundness</span>
          <input name={'cubeRoundness'} onChange={onChangeOption} type='number' defaultValue={options?.cubeRoundness} min='0' max='100' />
        </label>
      </div>
    </main>
  )
}

export default OptionsScreen;