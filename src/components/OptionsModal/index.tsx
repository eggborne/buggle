import styles from './OptionsModal.module.css';
import { useState } from 'react';
import { userOptions } from '../../config.json';
import GameBoard from '../GameBoard';
import { GameplayPreferencesData, OptionInputData, OptionsData, OptionTypeData, StylePreferencesData } from '../../types/types';
import { useUser } from '../../context/UserContext';

interface OptionsModalProps {
  hidden: boolean;
}

const sampleLetterMatrices = [
  [
    ['B', 'U', 'G', 'G'],
    ['L', 'E', 'T', 'I'],
    ['M', 'E', 'F', 'U'],
    ['N', 'O', 'W', 'T']
  ],
  [
    ['B', 'U', 'G', 'G', 'L'],
    ['L', 'E', 'T', 'I', 'M'],
    ['M', 'E', 'F', 'U', 'N'],
    ['N', 'O', 'W', 'L', 'O'],
    ['O', 'O', 'K', 'F', 'W']
  ],
  [
    ['B', 'U', 'G', 'G', 'L', 'E'],
    ['L', 'E', 'T', 'I', 'M', 'E'],
    ['M', 'E', 'F', 'U', 'N', 'F'],
    ['N', 'O', 'W', 'L', 'O', 'O'],
    ['O', 'O', 'K', 'F', 'O', 'R'],
    ['W', 'O', 'R', 'D', 'S', 'F']
  ]
];

const OptionInput = ({ label, name, type, value, onChange, onPointerUp, min, max }: OptionInputData) => (
  <label className={`${styles.optionInput} ${styles[type + '-label']}`}>
    <span>{label}</span>
    <input
      id={name}
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      onPointerUp={onPointerUp}
      min={min}
      max={max}
    />
  </label>
);

const colorOptions: OptionTypeData = userOptions.style.colors;
const sizeOptions: OptionTypeData = userOptions.style.sizes;
const gameplayOptions: OptionTypeData = userOptions.gameplay.touch;

const OptionsModal = ({ hidden }: OptionsModalProps) => {
  const [sizeSelected, setSizeSelected] = useState<number>(5);
  const [editMode, setEditMode] = useState<string>('colors');
  const { user, isLoggedIn, changeOption, saveOptions } = useUser();
  const preferences = user?.preferences as OptionsData;
  const optionsList = editMode === 'colors' ? colorOptions : editMode === 'range' ? sizeOptions : gameplayOptions;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.name as keyof OptionsData['style'] | keyof OptionsData['gameplay'];
    const value = e.target.type === 'range' ? Number(e.target.value) : e.target.value;
    changeOption(name, value);
  }
  const categoryList = editMode === 'gameplay' ? 'gameplay' : 'style';
  const boardDimensions = { width: sizeSelected, height: sizeSelected };
  return (
    <div className={`${styles.OptionsModal} ${hidden ? styles.hidden : ''}`}>

      <div className={styles.puzzlePreview}>
        {!hidden && <GameBoard
          currentEffects={null}
          noAnimation={true}
          fillerData={{
            allWords: new Set(),
            dimensions: boardDimensions,
            letterMatrix: sampleLetterMatrices[sizeSelected - 4],
            metadata: {
              percentUncommon: 1,
              averageWordLength: 5,
              dateCreated: 0,
            },
            playerProgress: {
              'fakeId': {
                attackPoints: 0,
                foundOpponentWords: {},
                score: 0,
                touchedCells: [],
                uid: 'fakeId'
              }
            },
            gameOver: false,
            timeLimit: 300,
            wordBonus: 5
          }}
          opponentData={null}
        />}
        <div className={styles.viewSelect}>
          <button className={`${styles.editModeButton} ${(sizeSelected === 4) ? styles.selected : ''}`} onClick={() => setSizeSelected(4)}>4 x 4</button>
          <button className={`${styles.editModeButton} ${(sizeSelected === 5) ? styles.selected : ''}`} onClick={() => setSizeSelected(5)}>5 x 5</button>
          <button className={`${styles.editModeButton} ${sizeSelected === 6 ? styles.selected : ''}`} onClick={() => setSizeSelected(6)}>6 x 6</button>
        </div>
      </div>

      <div className={styles.controlArea}>
        <div className={styles.modeSelectBar}>
          <div className={styles.categorySelect} >
            <button className={`${styles.editModeButton} ${editMode === 'colors' ? styles.selected : ''}`} onClick={() => setEditMode('colors')}>Colors</button>
            <button className={`${styles.editModeButton} ${editMode === 'range' ? styles.selected : ''}`} onClick={() => setEditMode('range')}>Sizes</button>
            <button className={`${styles.editModeButton} ${editMode === 'gameplay' ? styles.selected : ''}`} onClick={() => setEditMode('gameplay')}>Control</button>
          </div>
        </div>
        <div className={`${styles.optionArea} ${styles[editMode]}`}>
          <div className={`${styles.optionsList} ${styles[editMode]}`}>
            {optionsList['inputDataList'].map(({ name, label, type, min, max }) =>
              <OptionInput
                key={name}
                label={label}
                name={name}
                type={type}
                value={preferences[categoryList][name as keyof (StylePreferencesData | GameplayPreferencesData)]}
                onChange={handleChange}
                min={min}
                max={max}
              />
            )}
          </div>
        </div>
      </div>

      <div className={`button-group row ${styles.saveArea}`}>
        {isLoggedIn && <button onClick={async () => {
          saveOptions(preferences);
        }} className={'start'}>Save</button>}
      </div>

    </div>
  )
}

export default OptionsModal;