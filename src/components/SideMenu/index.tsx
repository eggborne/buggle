import styles from './SideMenu.module.css';

interface SideMenuProps {
  sideMenuShowing: boolean;
  showSignOutConfirm: () => void;
  setOptionsShowing: () => void;
}

const SideMenu = ({ sideMenuShowing, setOptionsShowing, showSignOutConfirm }: SideMenuProps) => {

  return (
    <div className={`${styles.SideMenu} ${sideMenuShowing ? styles.show : styles.hide}`}>
      <div className={styles.menuKnob}>
        <button className={'cancel'} onClick={setOptionsShowing}>Options</button>
      </div>
      <div className={styles.menuKnob}>
        <button className={'danger'} onClick={showSignOutConfirm}>Sign out</button>
      </div>
    </div>
  );
}

export default SideMenu;