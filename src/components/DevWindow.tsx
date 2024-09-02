import { CurrentGameData } from "../types/types";

interface DevWindowProps {
  currentMatch: CurrentGameData | null;
  showWordList: () => void;
}

const DevWindow = ({ showWordList }: DevWindowProps) => {
  return (
    <div className={`dev-window`}>
      <button onClick={showWordList}>Word List</button>
    </div>
  );
}

export default DevWindow;