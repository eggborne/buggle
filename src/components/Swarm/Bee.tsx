
import styles from './Swarm.module.css';
import { useEffect, useRef } from 'react';
import { randomInt } from '../../scripts/util';


interface BeeProps {
  gameWidth: number,
  position: {
    top: number;
    left: number;
  };
  range?: number;
  speed?: number;
  size?: string;
}

const Bee = ({ gameWidth, position, range = 15, speed = 15, size = '2rem' }: BeeProps) => {
  const beeRef = useRef<HTMLDivElement>(null);

  const randomStart = randomInt(-5000, 5000);

  const hover = () => {
    if (!beeRef.current) return;

    const animate = () => {
      const time = (Date.now() + randomStart) * speed * 0.001;
      const translateX = Math.sin(time * 1.25) * range;
      const translateY = Math.cos(time * 1.5) * range;
      const scale = 1 + Math.sin(time * 0.1) * 0.25;
      const rotate = 1 + Math.sin(time * 0.5) * 8;

      beeRef.current!.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
      beeRef.current!.style.rotate = `${rotate}deg`;
      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  };

  useEffect(() => {
    hover();
  }, [speed, range]);

  return (
    <div
      onClick={() => {
        console.log('clicked bee');
      }}
      className={styles.Bee}
      ref={beeRef}
      style={{
        width: size,
        height: size,
        top: `calc((var(--game-board-size)/${gameWidth}) * (${position.top} + 0.5))`,
        left: `calc((var(--game-board-size)/${gameWidth}) * (${position.left} + 0.5))`,
      }}
    >
      <div className={`${styles.beeWing} ${styles.left}`}></div>
      <div className={`${styles.beeWing} ${styles.right}`}></div>
    </div>
  );
};

export default Bee;