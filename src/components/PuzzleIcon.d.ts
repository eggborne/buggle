interface PuzzleIconProps {
    puzzleDimensions: {
        width: number;
        height: number;
    };
    iconSize: {
        width: string;
        height?: string;
    };
    contents: string[];
}
declare function PuzzleIcon({ puzzleDimensions, contents, iconSize }: PuzzleIconProps): import("react/jsx-runtime").JSX.Element;
export default PuzzleIcon;
