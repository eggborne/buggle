interface OptionsScreenProps {
    hidden: boolean;
    changeOption: (optionKey: string, newValue: string | number) => void;
}
declare function OptionsScreen({ hidden, changeOption }: OptionsScreenProps): import("react/jsx-runtime").JSX.Element;
export default OptionsScreen;
