import './style.css';
import * as dat from 'lil-gui';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

// Import fireflies
import firefliesVertexShader from './shaders/fireflies/vertex.glsl';
import firefliesFragmentShader from './shaders/fireflies/fragment.glsl';

// Import portal
import portalVertexShader from './shaders/portal/vertex.glsl';
import portalFragmentShader from './shaders/portal/fragment.glsl';

// url Vercel

//https://2022-01-portal-scene-threejs.vercel.app/

/**
 * Base
 */

// Canvas
const canvas = document.querySelector('canvas.webgl');

// Scene
const scene = new THREE.Scene();

/**
 * Loaders
 */
// Texture loader
const textureLoader = new THREE.TextureLoader();

// Draco loader
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('draco/');

// GLTF loader
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

/**
 * Textures
 */

const bakedTexture = textureLoader.load('baked.jpg');
bakedTexture.flipY = false;
bakedTexture.encoding = THREE.sRGBEncoding;

/**
 * Material
 */

// Baked material
const bakedMaterial = new THREE.MeshBasicMaterial({ map: bakedTexture });

// Pole light material
const poleLightMaterial = new THREE.MeshBasicMaterial({ color: 0xffffe5 });

// Portal light material

const portalLightMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uColorStart: { value: new THREE.Color('#0b0c1e') },
    uColorEnd: { value: new THREE.Color('#ffffff') },
  },
  vertexShader: portalVertexShader,
  fragmentShader: portalFragmentShader,
});

(portalLightMaterial.side = THREE.DoubleSide),
  /**
   * Model
   */

  gltfLoader.load('portal.glb', (gltf) => {
    gltf.scene.traverse((child) => {
      child.material = bakedMaterial;
    });

    scene.add(gltf.scene);

    gltf.scene.traverse((child) => {
      child.material = bakedMaterial;
    });
    scene.add(gltf.scene);

    // Get each object
    const portalLightMesh = gltf.scene.children.find(
      (child) => child.name === 'portalLight'
    );
    const poleLightAMesh = gltf.scene.children.find(
      (child) => child.name === 'poleLightA'
    );
    const poleLightBMesh = gltf.scene.children.find(
      (child) => child.name === 'poleLightB'
    );

    // Apply materials
    portalLightMesh.material = portalLightMaterial;
    poleLightAMesh.material = poleLightMaterial;
    poleLightBMesh.material = poleLightMaterial;
  });

/**
 * Fireflies
 */

// Geometry
const firefliesGeometry = new THREE.BufferGeometry();
const firefliesCount = 30;
const positionArray = new Float32Array(firefliesCount * 3);
const scaleArray = new Float32Array(firefliesCount);

for (let i = 0; i < firefliesCount; i++) {
  positionArray[i * 3 + 0] = (Math.random() - 0.5) * 4;
  positionArray[i * 3 + 1] = Math.random() * 1.5;
  positionArray[i * 3 + 2] = (Math.random() - 0.5) * 4;

  scaleArray[i] = Math.random();
}

firefliesGeometry.setAttribute(
  'position',
  new THREE.BufferAttribute(positionArray, 3)
);

firefliesGeometry.setAttribute(
  'aScale',
  new THREE.BufferAttribute(scaleArray, 1)
);

// Material
const firefliesMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    uSize: { value: 100 },
  },
  vertexShader: firefliesVertexShader,
  fragmentShader: firefliesFragmentShader,
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});

// Points
const fireflies = new THREE.Points(firefliesGeometry, firefliesMaterial);
scene.add(fireflies);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener('resize', () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Update firflies
  firefliesMaterial.uniforms.uPixelRatio.value = Math.min(
    window.devicePixelRatio,
    2
  );
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  45,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.x = 4;
camera.position.y = 2;
camera.position.z = 4;
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputEncoding = THREE.sRGBEncoding;

renderer.setClearColor('#0b0c1e');

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Update materials
  portalLightMaterial.uniforms.uTime.value = elapsedTime;
  firefliesMaterial.uniforms.uTime.value = elapsedTime;

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
