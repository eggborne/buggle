import { ConfirmData } from '../../types/types';
import styles from './SideMenu.module.css';

interface SideMenuProps {
  sideMenuShowing: boolean;
  showConfirmModal: (confirmData: ConfirmData) => void;
  setOptionsShowing: () => void;
}

const SideMenu = ({ sideMenuShowing, setOptionsShowing, showConfirmModal }: SideMenuProps) => {

  return (
    <div className={`${styles.SideMenu} ${sideMenuShowing ? styles.show : styles.hide}`}>
      <div className={styles.menuKnob}>
        <button className={'cancel'} onClick={setOptionsShowing}>Options</button>
      </div>
      <div className={styles.menuKnob}>
        <button className={'danger'} onClick={() => showConfirmModal({
          typeOpen: 'signOut',
          message: 'Are you sure you want to sign out?',
          targetPhase: 'title',
        })}>Sign out</button>
      </div>
    </div>
  );
}

export default SideMenu;