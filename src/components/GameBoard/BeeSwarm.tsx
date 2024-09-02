import styles from './GameBoard.module.css';
import { FC, useRef, useEffect } from 'react';
import {
  Group,
  Object3D,
  Vector3,
  PlaneGeometry,
  MeshBasicMaterial,
  Mesh,
  NormalBlending,
  TextureLoader,
} from 'three';
import { randomInt } from '../../scripts/util';
import { getScene, getRenderer, getCamera } from '../../scripts/three';
interface BeeSwarmProps {
  active: boolean;
  gameBoardElement: HTMLDivElement;
  gameWidth: number;
  swarmSize: number;
}

interface Coords {
  x: number,
  y: number,
  z: number,
}

interface BeeObject {
  animationStartTime: number;
  group: Group;
  leftWing: Object3D;
  homePoint: Coords
  range: Coords;
  rightWing: Object3D;
  speed: Coords;
  startPoint: Coords;
  flyOutDuration: number;
  flyOutStartTime: number
}

const BeeSwarm: FC<BeeSwarmProps> = ({ active, gameBoardElement, gameWidth, swarmSize }) => {

  const mountRef = useRef<HTMLDivElement>(null);
  const beesRef = useRef<BeeObject[]>([]); // Keep track of bees separately

  const width = window.innerWidth;
  const height = window.innerHeight;

  useEffect(() => {
    if (!mountRef.current) return;

    const renderer = getRenderer(width, height);
    const scene = getScene();
    const camera = getCamera(width, height);

    // Append the renderer's DOM element if not already appended
    if (!renderer.domElement.parentElement) {
      mountRef.current.appendChild(renderer.domElement);
    }

    // Load textures and create materials
    const textureLoader = new TextureLoader();
    const bodyTexture = textureLoader.load('/assets/beebody.webp');
    const wingTexture = textureLoader.load('/assets/beewing.webp');
    const bodyMaterial = new MeshBasicMaterial({
      map: bodyTexture,
      blending: NormalBlending,
      transparent: true,
    });
    const wingMaterial = new MeshBasicMaterial({
      map: wingTexture,
      transparent: true,
      opacity: 0.75,
    });

    const gameBoardSize = gameBoardElement.clientWidth;
    const beeSize = (gameBoardSize / (gameWidth * 0.9));

    // Create bee geometries
    const bodyGeometry = new PlaneGeometry(beeSize, beeSize);
    const wingGeometry = new PlaneGeometry(beeSize / 1.5, beeSize / 2);

    // Calculate the boundaries of the GameBoard in the scene's 3D space
    const boardLeft = (-width / 2) + (width - gameBoardSize) / 2;
    const boardRight = boardLeft + gameBoardElement.clientWidth;
    const boardTop = gameBoardElement.getBoundingClientRect().top;

    const center = {
      x: (boardLeft + boardRight) / 2,
      y: (height / 2) - (boardTop + (gameBoardSize / 2)),
      z: 50
    }

    const startPoint = { // upper right (opponent's avatar)
      x: width / 2,
      y: height / 2,
      z: 50
    };

    const TIME_BETWEEN_BEES = 50;

    for (let i = 0; i < swarmSize; i++) {

      const homePoint = {
        x: center.x + randomInt(gameBoardSize / -2, gameBoardSize / 2),
        y: center.y + randomInt(gameBoardSize / -2, gameBoardSize / 2),
        z: center.z
      }

      const randomSpeed = {
        x: randomInt(4, 14),
        y: randomInt(4, 12),
      };

      const beeObj: BeeObject = {
        animationStartTime: randomInt(0, 5000),
        flyOutStartTime: Date.now() + i * TIME_BETWEEN_BEES,
        group: new Group(),
        homePoint: new Vector3(
          homePoint.x,
          homePoint.y,
          homePoint.z
        ),
        leftWing: new Object3D(),
        range: {
          x: beeSize / (randomInt(35, 60) / 10),
          y: beeSize / (randomInt(35, 65) / 10),
          z: randomInt(3, 20)
        },
        speed: {
          ...randomSpeed,
          z: ((randomSpeed.x + randomSpeed.y) / 2) // higher range with faster movement
        },
        rightWing: new Object3D(),
        startPoint: new Vector3(startPoint.x, startPoint.y, startPoint.z),
        flyOutDuration: randomInt(200, 800),
      };
      const { group, leftWing, rightWing } = beeObj;
      const body = new Mesh(bodyGeometry, bodyMaterial);

      const leftWingMesh = new Mesh(wingGeometry, wingMaterial);
      leftWing.add(leftWingMesh);
      leftWing.position.set(beeSize * -0.175, beeSize * 0.1, 0);
      leftWingMesh.position.set(-beeSize * (0.75 / 2), 0, 0);

      const rightWingMesh = new Mesh(wingGeometry, wingMaterial);
      rightWing.add(rightWingMesh);
      rightWing.position.set(beeSize * 0.1, beeSize * 0.1, 0);
      rightWingMesh.position.set(beeSize * (0.75 / 2), 0, 0);
      rightWingMesh.scale.x = -1; // Flip the right wing

      group.add(body, leftWing, rightWing);

      group.position.set(startPoint.x, startPoint.y, startPoint.z);

      scene.add(beeObj.group);
      beesRef.current.push(beeObj);
    }

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      if (!scene || !camera || !renderer) return;

      const currentTime = Date.now();

      // Update bee positions and wing rotations
      beesRef.current.forEach((beeObj) => {
        const { animationStartTime, leftWing, rightWing, homePoint, group, speed, range, startPoint, flyOutDuration, flyOutStartTime } = beeObj;
        const time = (Date.now() + animationStartTime) * 0.001;

        if (currentTime < flyOutStartTime + flyOutDuration) {
          const progress = Math.min((currentTime - flyOutStartTime) / flyOutDuration, 1);
          group.position.x = startPoint.x + (homePoint.x - startPoint.x) * progress;
          group.position.y = startPoint.y + (homePoint.y - startPoint.y) * progress;
          group.position.z = startPoint.z + (homePoint.z - startPoint.z) * progress;

          const scaleProgress = Math.sin(progress * Math.PI / 2);
          group.scale.set(scaleProgress, scaleProgress, scaleProgress);
        } else {
          group.position.x = homePoint.x + (Math.sin(time * speed.x) * range.x);
          group.position.y = homePoint.y + (Math.cos(time * speed.y) * range.y);
          group.position.z = homePoint.z + (Math.sin(time * speed.y) * range.z);

          const newScale = 1 + ((Math.sin(time * speed.z) * (range.z / 10)) / 10);
          group.scale.set(newScale, newScale, newScale);
        }

        const wingSpeed = 20;
        const wingAmplitude = 1.25;
        leftWing.rotation.y = Math.sin(time * wingSpeed) * wingAmplitude;
        rightWing.rotation.y = -Math.sin(time * wingSpeed) * wingAmplitude;
      });

      renderer.render(scene, camera);
    };
    requestAnimationFrame(animate);

    // Cleanup function
    return () => {
      beesRef.current.forEach(bee => scene.remove(bee.group)); // Remove bees from scene
      beesRef.current = []; // Reset bees array
      bodyMaterial.dispose();
      wingMaterial.dispose();
      bodyTexture.dispose();
      wingTexture.dispose();
      // Note: We don't dispose of the renderer, scene, or camera as they're reused
    };
  }, [active]);

  return <div className={styles.beeSwarm} ref={mountRef} style={{ width: `${width}px`, height: `${height}px` }} />;
};

export default BeeSwarm;