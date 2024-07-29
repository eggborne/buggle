// import styles from './OptionsScreen.module.css'
// import OptionsModal from '../OptionsModal';
// import { useState } from 'react';
// import { OptionsData } from '../../types/types';

// interface OptionsScreenProps {
//   hidden: boolean;
//   changeOption: (optionKey: keyof OptionsData['style'] | keyof OptionsData['gameplay'], newValue: string | number) => void;
// }

// function OptionsScreen({ hidden, changeOption }: OptionsScreenProps) {
//   const [previewShowing, setPreviewShowing] = useState<boolean>(false);
//   // console.log('options screen user is', user)
//   const optionsScreenClass = `${styles.OptionsScreen}${hidden ? ' hidden' : ''}`;
//   return (
//     <>
//       <main className={optionsScreenClass}>
//         <h1>Options</h1>


//         <OptionsModal showing={true} changeOption={changeOption} />
//       </main>
//     </>
//   )
// }

// export default OptionsScreen;