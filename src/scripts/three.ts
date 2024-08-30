import {
  WebGLRenderer,
  Scene,
  OrthographicCamera,
  LinearSRGBColorSpace,
  Vector3,
} from 'three';

let renderer: WebGLRenderer | null = null;
let scene: Scene | null = null;
let camera: OrthographicCamera | null = null;

export const getRenderer = (width: number, height: number): WebGLRenderer => {
  if (!renderer) {
    console.warn('----------> Creating three.js Renderer')
    renderer = new WebGLRenderer({
      alpha: true,
      antialias: false,
      powerPreference: 'high-performance',
      precision: 'lowp',
      depth: false,
    });
    renderer.outputColorSpace = LinearSRGBColorSpace;
    renderer.setSize(width, height);
  }
  return renderer;
};

export const getScene = (): Scene => {
  if (!scene) {
    console.warn('----------> Creating three.js Scene')
    scene = new Scene();
  }
  return scene;
};

export const getCamera = (width: number, height: number): OrthographicCamera => {
  if (!camera) {
    console.warn('----------> Creating three.js Camera')
    camera = new OrthographicCamera(
      -width / 2,
      width / 2,
      height / 2,
      -height / 2,
      0.1,
      1000
    );
    camera.position.set(0, 0, 100);
    camera.lookAt(new Vector3(0, 0, 0));
  }
  return camera;
};

export const disposeThreeObjects = (): void => {
  console.warn('<-------------------- DISPOSING of three.js objects')
  if (renderer) {
    renderer.dispose();
    renderer = null;
  }
  if (scene) {
    scene = null;
  }
  if (camera) {
    camera = null;
  }
};
