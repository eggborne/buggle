import { encodeMatrix } from "../scripts/util";
import { CurrentGameData, StoredPuzzleData } from "../types/types";
import { useFirebase } from "../context/FirebaseContext";

interface DevWindowProps {
  currentMatch: CurrentGameData | null;
  showWordList: () => void;
}

const DevWindow = ({ currentMatch, showWordList }: DevWindowProps) => {
  return (
    <div className={`dev-window`}>
      <button onClick={showWordList}>Word List</button>
    </div>
  );
}

export default DevWindow;