import './Header.css'
import Logo from './Logo';

interface HeaderProps {
  phase: string;
  changePhase: (phase: string) => void;
}

function Header({ phase, changePhase }: HeaderProps) {

  return (
    <header>
      {phase !== 'title' && <button onClick={() => changePhase('title')}>{'<'}</button>}
      <Logo />
    </header>
  )
}

export default Header;