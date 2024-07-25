import styles from './UserMenu.module.css';

interface UserMenuProps {
  userMenuShowing: boolean;
  showSignOutConfirm: () => void;
}

const UserMenu = ({ userMenuShowing, showSignOutConfirm }: UserMenuProps) => {

  return (
    <div className={`${styles.UserMenu} ${userMenuShowing ? styles.show : styles.hide}`}>
      <div className={styles.menuKnob}>
        <button className={'danger'} onClick={showSignOutConfirm}>Sign out</button>
      </div>
    </div>
  );
}

export default UserMenu;