interface FooterProps {
    optionsShowing: boolean;
    userMenuShowing: boolean;
    toggleOptionsShowing: () => void;
    toggleUserMenuShowing: () => void;
    showExitGameConfirm: () => void;
    showSignOutConfirm: () => void;
}
declare function Footer({ optionsShowing, userMenuShowing, showExitGameConfirm, toggleOptionsShowing, toggleUserMenuShowing }: FooterProps): import("react/jsx-runtime").JSX.Element;
export default Footer;
