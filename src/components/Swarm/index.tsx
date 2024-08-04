import styles from './Swarm.module.css';
import { ReactNode, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import Bee from './Bee';
import { randomInt } from '../../scripts/util';

interface SwarmProps {
  gameWidth: number;
  parent: Element | DocumentFragment;
  swarmSize: number;
}

const Swarm = ({ gameWidth, parent, swarmSize }: SwarmProps) => {

  const swarmRef = useRef<HTMLDivElement>(null);
  const [swarmArray, setSwarmArray] = useState<ReactNode[]>([]);

  useEffect(() => {
    if (swarmRef.current) {
      const handleInteraction = (e: MouseEvent | TouchEvent) => {
        e.stopPropagation();
        console.warn('clicked swarm');
      };
      swarmRef.current.addEventListener('touchstart', handleInteraction);
      swarmRef.current.addEventListener('mousedown', handleInteraction);

      let initialSwarmArray: ReactNode[] = [];

      for (let i = 0; i < swarmSize; i++) {
        initialSwarmArray.push(
          <Bee
            gameWidth={gameWidth}
            position={{
              top: (randomInt(-2, ((gameWidth - 1) * 4)) / 4),
              left: (randomInt(-2, ((gameWidth - 1) * 4)) / 4),
            }}
            range={randomInt(15, 25)}
            size={`calc(var(--game-board-size)/${gameWidth}/1.5)`}
            speed={randomInt(3, 12)}
          />
        )
      }
      setSwarmArray(initialSwarmArray);
    }
  }, []);



  return ReactDOM.createPortal(
    <div
      ref={swarmRef}
      className={styles.Swarm}
    >
      {swarmArray.map(bee => bee)}
    </div>,
    parent
  );
};

export default Swarm;