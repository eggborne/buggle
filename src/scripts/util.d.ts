export declare const randomInt: (min: number, max: number) => number;
export declare const pause: (ms: number) => Promise<void>;
export declare const stringTo2DArray: (input: string, width: number, height: number) => string[][];
export declare const saveToLocalStorage: <T>(key: string, value: T) => void;
export declare const getFromLocalStorage: <T>(key: string) => T | null;
export declare const debounce: <Args extends unknown[], R>(func: (...args: Args) => R, delay: number) => (...args: Args) => void;
export declare const decodeMatrix: (matrix: string[][], key: Record<string, string> | undefined) => string[][];
export declare const encodeMatrix: (matrix: string[][], key: Record<string, string> | undefined) => string[][];
export declare const formatDateAndTime: (dateCreated: number) => {
    date: string;
    time: string;
};
