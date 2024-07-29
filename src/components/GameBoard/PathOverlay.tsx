import { useRef, useEffect, useState } from 'react';
import styles from './GameBoard.module.css';
import { CellObj } from '../../types/types';

interface PathOverlayProps {
  cells: CellObj[];
  dimensions: { width: number; height: number };
  wordStatus: string;
  isSelecting: boolean;
}

const PathOverlay: React.FC<PathOverlayProps> = ({ cells, dimensions, wordStatus, isSelecting }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [paths, setPaths] = useState<string[]>([]);

  useEffect(() => {
    if (!svgRef.current || cells.length === 0) return;

    const cellSize = 100 / dimensions.width;

    const newPaths = cells.slice(1).map((cell, index) => {
      const prevCell = cells[index];
      const x1 = (prevCell.col + 0.5) * cellSize;
      const y1 = (prevCell.row + 0.5) * cellSize;
      const x2 = (cell.col + 0.5) * cellSize;
      const y2 = (cell.row + 0.5) * cellSize;
      return `M ${x1} ${y1} L ${x2} ${y2}`;
    });

    setPaths(newPaths);
  }, [cells, dimensions.width]);

  return (
    <svg
      ref={svgRef}
      className={`${styles.pathOverlay} ${styles[wordStatus]} ${isSelecting ? styles.visible : ''}`}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{
        strokeWidth: `${0.15 + ((6 - dimensions.width) * 0.1)}rem`
      }}
    >
      {paths.map((path, index) => (
        <path
          key={index}
          className={`${styles.pathSegment} ${index === paths.length - 1 ? styles.animatedSegment : ''}`}
          d={path}
        />
      ))}
    </svg>
  );
};

export default PathOverlay;