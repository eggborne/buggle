import styles from './OptionsScreen.module.css'
import { useState } from 'react'
import { OptionsData } from '../App'
import { debounce } from '../scripts/util'
import { userOptions } from '../config.json'
import PuzzleIcon from './PuzzleIcon'
import Modal from './Modal'

interface OptionsScreenProps {
  hidden: boolean;
  options: OptionsData;
  changeOption: (optionKey: string, newValue: string | number) => void;
}

interface OptionInputData {
  label: string;
  name: string;
  type: string;
  value?: string | number;
  defaultValue?: string | number;
  min?: number;
  max?: number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPointerUp?: (e: React.PointerEvent<HTMLInputElement>) => void;
}

interface OptionTypeData {
  label: string;
  inputDataList: OptionInputData[];
}

const OptionInput = ({ label, name, type, value, defaultValue, onChange, onPointerUp, min, max }: OptionInputData) => (
  <label className={`${styles.optionInput} ${styles[type + '-label']}`}>
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
  const [previewShowing, setPreviewShowing] = useState<boolean>(false);
  const debouncedChangeOption = debounce((name: string, value: string | number) => {
    changeOption(name, value);
  }, 200);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('changing e', e)
    const name = e.target.name as string;
    const value = e.target.type === 'range' ? parseFloat(e.target.value) : e.target.value;
    if (e.target.type === 'range') {
      changeOption(name, value);
    } else {
      debouncedChangeOption(name, value);
    }
  }

  const colorOptions: OptionTypeData = userOptions.style.colors;
  const sizeOptions: OptionTypeData = userOptions.style.sizes;
  const gameplayOptions: OptionTypeData = userOptions.gameplay.touch;

  const sampleLetterList = ['I', 'T', 'X', 'S', 'H', 'W', 'L', 'A', 'X', 'L', 'Z', 'N', 'B', 'U', 'Y', 'S', 'W', 'N', 'C', 'Q', 'E', 'V', 'J', 'R', 'U'];

  const optionsScreenClass = `${styles.OptionsScreen}${hidden ? ' hidden' : ''}`;
  return (
    <>
      <main className={optionsScreenClass}>
        <h1>Options</h1>
        <h2>Appearance</h2>
        <div className={styles.appearancePreview}>
          <PuzzleIcon
            contents={sampleLetterList}
            iconSize={{
              width: `var(--game-board-size)`,
            }}
            puzzleDimensions={{ width: 5, height: 5 }}
          />
        </div>
        <div className={`${styles.optionCategorySection} ${styles.color}`}>
          {/* <h2>{colorOptions.label}</h2> */}
          <div className={`${styles.optionsList} ${styles.color}`}>
            {colorOptions.inputDataList.map(({ name, label, type, defaultValue, min, max }) => {
              // <OptionInput key={name} label={label} name={name} type={type} value={options[name as keyof OptionsData]} defaultValue={defaultValue} onChange={handleChange} onPointerUp={undefined} min={min} max={max} />
              return (<label className={`${styles.optionInput} ${styles[type + '-label']}`}>
                <span>{label}</span>
                <input
                  id={name}
                  name={name}
                  type={type}
                  value={options[name as keyof OptionsData]}
                  defaultValue={defaultValue}
                  onChange={handleChange}
                  min={min}
                  max={max}
                />
              </label>)
            })}
          </div>
        </div>

        <div className={`${styles.optionCategorySection} ${styles.range}`}>
          {/* <h2>{sizeOptions.label}</h2> */}
          <div className={`${styles.optionsList} ${styles.range}`}>
            {sizeOptions.inputDataList.map((input) => (
              <OptionInput key={input.name} label={input.label} name={input.name} type={input.type} value={options[input.name as keyof OptionsData]} defaultValue={input.defaultValue} onChange={handleChange} onPointerUp={undefined} min={input.min} max={input.max} />
            ))}
          </div>
        </div>
        <div className={`${styles.optionCategorySection} ${styles.range}`}>
          {/* <h2>{gameplayOptions.label}</h2> */}
          <div className={`${styles.optionsList} ${styles.range}`}>
            {gameplayOptions.inputDataList.map((input) => (
              <OptionInput key={input.name} label={input.label} name={input.name} type={input.type} value={options[input.name as keyof OptionsData]} defaultValue={input.defaultValue} onChange={handleChange} onPointerUp={undefined} min={input.min} max={input.max} />
            ))}
          </div>
        </div>

      </main>
      <Modal style={{
        padding: 0,
        width: '100%',
        background: 'transparent',
      }} isOpen={previewShowing} noCloseButton={true} onClose={() => setPreviewShowing(false)}>
        {/* <div className={styles.puzzlePreview}>
          <PuzzleIcon
            puzzleDimensions={{ width: 5, height: 5 }}
            contents={sampleLetterList}
            iconSize={{
              width: `var(--game-board-size)`,
              height: `var(--game-board-size)`
            }}
          />
        </div> */}
        
      </Modal>
    </>
  )
}

export default OptionsScreen;