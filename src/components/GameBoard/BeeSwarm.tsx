import styles from './GameBoard.module.css';
import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { randomInt } from '../../scripts/util';

interface BeeSwarmProps {
  gameBoardElement: HTMLDivElement;
  gameWidth: number;
  width: number;
  height: number;
  swarmSize: number;
}

interface Coords {
  x: number,
  y: number,
  z: number,
}

interface BeeObject {
  animationStartTime: number;
  group: THREE.Group;
  leftWing: THREE.Object3D;
  homePoint: Coords
  range: Coords;
  rightWing: THREE.Object3D;
  speed: Coords;
}

const BeeSwarm: React.FC<BeeSwarmProps> = ({ gameBoardElement, gameWidth, width, height, swarmSize }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [renderer, setRenderer] = useState<THREE.WebGLRenderer | null>(null);
  const [scene, setScene] = useState<THREE.Scene | null>(null);
  const [camera, setCamera] = useState<THREE.OrthographicCamera | null>(null);

  if (false) console.log(renderer, scene, camera); // for linter

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const newScene = new THREE.Scene();

    // Orthographic camera setup
    const newCamera = new THREE.OrthographicCamera(
      -width / 2, width / 2, height / 2, -height / 2, 0.1, 1000
    );
    newCamera.position.set(0, 0, 100); // Position above the scene
    newCamera.lookAt(new THREE.Vector3(0, 0, 100)); // Look towards the origin



    const newRenderer = new THREE.WebGLRenderer({
      alpha: true,
      // antialias: true,
      // preserveDrawingBuffer: true,
      powerPreference: 'high-performance',

    });
    newRenderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    console.log(newRenderer.info)


    newRenderer.setSize(width, height);
    mountRef.current.appendChild(newRenderer.domElement);

    setRenderer(newRenderer);
    setScene(newScene);
    setCamera(newCamera);

    // Load textures
    const textureLoader = new THREE.TextureLoader();
    const bodyTexture = textureLoader.load('/assets/beebody.webp');
    const wingTexture = textureLoader.load('/assets/beewing.webp');

    // Create bee materials
    const bodyMaterial = new THREE.MeshBasicMaterial({
      map: bodyTexture,
      blending: THREE.NormalBlending,

      transparent: true,
    });
    const wingMaterial = new THREE.MeshBasicMaterial({
      map: wingTexture,
      transparent: true,
      opacity: 0.75
    });

    const gameBoardSize = gameBoardElement.clientWidth;
    const beeSize = (gameBoardSize / gameWidth);

    // Create bee geometries
    const bodyGeometry = new THREE.PlaneGeometry(beeSize, beeSize);
    const wingGeometry = new THREE.PlaneGeometry(beeSize / 1.5, beeSize / 2);

    // Create bees


    // Calculate the boundaries of the GameBoard in the scene's 3D space
    const boardLeft = (-width / 2) + (width - gameBoardSize) / 2;
    const boardRight = boardLeft + gameBoardElement.clientWidth;
    const boardTop = gameBoardElement.getBoundingClientRect().top;
    const boardBottom = boardTop + gameBoardSize;
    console.log('gameBoardLeft', boardLeft, 'gameBoardRight', boardRight, 'gameBoardBottom', boardBottom, 'gameBoardTop', boardTop)

    const center = {
      x: (boardLeft + boardRight) / 2,
      y: (height / 2) - (boardTop + (gameBoardSize / 2)),
      z: 50
    }
    const bees: BeeObject[] = [];
    for (let i = 0; i < swarmSize; i++) {

      const homePoint = {
        x: center.x + randomInt(gameBoardSize / -2, gameBoardSize / 2),
        y: center.y + randomInt(gameBoardSize / -2, gameBoardSize / 2),
        z: center.z
      }
      // const homePoint = center;

      const randomSpeed = {
        x: randomInt(4, 12),
        y: randomInt(4, 15),
      };

      // randomSpeed.y += randomSpeed.y % 2;


      const beeObj: BeeObject = {
        group: new THREE.Group(),
        homePoint: new THREE.Vector3(
          homePoint.x,
          homePoint.y,
          homePoint.z
        ),
        range: {
          x: beeSize / (randomInt(35, 60) / 10),
          y: beeSize / (randomInt(35, 65) / 10),
          z: randomInt(5, 20)
        },
        speed: {
          ...randomSpeed,
          z: ((randomSpeed.x + randomSpeed.y) / 2)
        },
        animationStartTime: randomInt(0, 5000),
        leftWing: new THREE.Object3D(),
        rightWing: new THREE.Object3D()
      };
      const { group, leftWing, rightWing } = beeObj;
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);

      const leftWingMesh = new THREE.Mesh(wingGeometry, wingMaterial);
      leftWing.add(leftWingMesh);
      leftWing.position.set(beeSize * -0.175, beeSize * 0.1, 0);
      leftWingMesh.position.set(-beeSize * (0.75 / 2), 0, 0);

      const rightWingMesh = new THREE.Mesh(wingGeometry, wingMaterial);
      rightWing.add(rightWingMesh);
      rightWing.position.set(beeSize * 0.1, beeSize * 0.1, 0);
      rightWingMesh.position.set(beeSize * (0.75 / 2), 0, 0);
      rightWingMesh.scale.x = -1; // Flip the right wing

      group.add(
        body,
        leftWing,
        rightWing
      );

      group.position.set(
        homePoint.x,
        homePoint.y,
        homePoint.z
      )

      newScene.add(beeObj.group);
      bees.push(beeObj);
    }

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      if (!newScene || !newCamera || !newRenderer) return;

      // Update bee positions and wing rotations
      bees.forEach((beeObj) => {
        const { animationStartTime, leftWing, rightWing, homePoint, group, speed, range } = beeObj;
        const time = (Date.now() + animationStartTime) * 0.001;

        group.position.x = homePoint.x + (Math.sin(time * speed.x) * range.x);
        group.position.y = homePoint.y + (Math.cos(time * speed.y) * range.y);
        group.position.z = homePoint.z + (Math.sin(time * speed.y) * range.z);
        const newScale = 1 + ((Math.sin(time * speed.z) * (range.z / 10)) / 10);
        group.scale.set(newScale, newScale, newScale);

        // Wing flapping
        const wingSpeed = 20;
        const wingAmplitude = 1.25;
        leftWing.rotation.y = Math.sin(time * wingSpeed) * wingAmplitude;
        rightWing.rotation.y = -Math.sin(time * wingSpeed) * wingAmplitude;

        // leftWing.rotation.z = Math.sin(time * wingSpeed * 4) * wingAmplitude * 0.25;
        // rightWing.rotation.z = -Math.sin(time * wingSpeed * 4) * wingAmplitude * 0.25;

      });

      newRenderer.render(newScene, newCamera);
    };
    requestAnimationFrame(animate);

    // Cleanup
    return () => {
      if (mountRef.current && newRenderer.domElement) {
        mountRef.current.removeChild(newRenderer.domElement);
      }
      const beeGroups = bees.map(bee => bee.group);
      newScene.remove(...beeGroups);
      bodyGeometry.dispose();
      wingGeometry.dispose();
      bodyMaterial.dispose();
      wingMaterial.dispose();
      bodyTexture.dispose();
      wingTexture.dispose();
      newRenderer.dispose();
    };
  }, [width, height, gameBoardElement.clientWidth, swarmSize]);

  return <div className={styles.BeeSwarm} ref={mountRef} style={{ width: `${width}px`, height: `${height}px` }} />;
};

export default BeeSwarm;