import { encodeMatrix } from "../scripts/util";
import { CurrentGameData, StoredPuzzleData } from "../types/types";
import { useFirebase } from "../context/FirebaseContext";

interface DevWindowProps {
  currentMatch: CurrentGameData | null;
  showWordList: () => void;
}

const DevWindow = ({ currentMatch, showWordList }: DevWindowProps) => {
  const { uploadPuzzle } = useFirebase();

  const onlickUploadPuzzle = async () => {
    if (!currentMatch) return;

    const nextPuzzleData: StoredPuzzleData = {
      allWords: Array.from(currentMatch.allWords),
      dimensions: currentMatch.dimensions,
      letterString: encodeMatrix(currentMatch.letterMatrix, currentMatch.metadata.key).map(row => row.join('')).join(''),
      metadata: currentMatch.metadata,
      wordCount: Array.from(currentMatch.allWords).length
    };

    if (currentMatch.theme) {
      nextPuzzleData.theme = currentMatch.theme;
      nextPuzzleData.specialWords = currentMatch.specialWords;
    }

    await uploadPuzzle(nextPuzzleData);

    console.warn('Puzzle uploaded!');
  };

  return (
    <div className={`dev-window`}>
      {<button onClick={onlickUploadPuzzle}>Upload</button>}
      <button onClick={showWordList}>Word List</button>
    </div>
  );
}

export default DevWindow;