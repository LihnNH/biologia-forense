import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import modelUrl from '../../assets/dna.glb?url';
import { hotspotPositions, type Position, type SavedPoint } from '../data/dna';

interface Options {
  canvas: HTMLCanvasElement;
  container: HTMLElement;
  debug?: boolean;
  onReady: () => void;
  onError: (error: unknown) => void;
  onDragging: (dragging: boolean) => void;
  onFrame?: () => void;
  onPoint?: (point: SavedPoint | null) => void;
}

export interface DnaScene {
  setActive: (active: boolean) => void;
  project: (position: Position) => { x: number; y: number };
  dispose: () => void;
}

function disposeObjects(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  root.traverse(object => {
    if (!(object instanceof THREE.Mesh || object instanceof THREE.Sprite)) return;
    if (object instanceof THREE.Mesh) geometries.add(object.geometry);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      materials.add(material);
      for (const value of Object.values(material)) {
        if (value instanceof THREE.Texture) textures.add(value);
      }
    }
  });
  geometries.forEach(geometry => geometry.dispose());
  textures.forEach(texture => texture.dispose());
  materials.forEach(material => material.dispose());
}

export function createDnaScene(options: Options): DnaScene {
  const { canvas, container, debug = false } = options;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, .01, 1000);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  const modelGroup = new THREE.Group();
  const markerGroup = new THREE.Group();
  const raycaster = new THREE.Raycaster();
  const projected = new THREE.Vector3();
  const meshes: THREE.Mesh[] = [];
  const listeners = new AbortController();
  let disposed = false;
  let active = false;
  let modelReady = false;
  let modelRadius = 1;
  let animationFrame = 0;
  let lastTime = performance.now();
  let targetRotationX = .08;
  let targetRotationY = -.28;
  let targetZoom = window.innerWidth > window.innerHeight ? 1.75 : 1;
  let wasDragged = false;
  let pointCount = 0;
  let pointer: { id: number; startX: number; startY: number; x: number; y: number; dragged: boolean } | null = null;

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  modelGroup.add(markerGroup);
  scene.add(modelGroup);
  // The original r128 scene used linear light colors and legacy intensities.
  // Modern Three.js requires explicit linear colors and a PI intensity conversion.
  const lightColor = (hex: number) => new THREE.Color().setHex(hex, THREE.LinearSRGBColorSpace);
  const legacyIntensity = (value: number) => value * Math.PI;
  scene.add(new THREE.HemisphereLight(lightColor(0xdde8ff), lightColor(0x201218), legacyIntensity(1.65)));
  const keyLight = new THREE.DirectionalLight(lightColor(0xffffff), legacyIntensity(2.2));
  keyLight.position.set(4, 7, 8);
  scene.add(keyLight);
  const rimLight = new THREE.DirectionalLight(lightColor(0xb51d25), legacyIntensity(2.8));
  rimLight.position.set(-7, 1, -5);
  scene.add(rimLight);
  const fillLight = new THREE.PointLight(lightColor(0x547dff), legacyIntensity(1.5), 80);
  fillLight.position.set(6, -5, 7);
  scene.add(fillLight);

  function resize() {
    if (disposed) return;
    const width = Math.max(container.clientWidth, 1);
    const height = Math.max(container.clientHeight, 1);
    const aspect = width / height;
    const halfView = modelRadius * 1.16 / Math.min(aspect, 1);
    camera.left = -halfView * aspect;
    camera.right = halfView * aspect;
    camera.top = halfView;
    camera.bottom = -halfView;
    camera.near = .01;
    camera.far = Math.max(modelRadius * 12, 100);
    camera.position.set(0, 0, modelRadius * 3.2);
    camera.zoom = targetZoom;
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }

  function marker(number: number) {
    const bitmap = document.createElement('canvas');
    bitmap.width = bitmap.height = debug ? 128 : 96;
    const context = bitmap.getContext('2d');
    if (!context) throw new Error('Canvas 2D indisponível para os marcadores.');
    const center = debug ? 64 : 48;
    context.beginPath();
    context.arc(center, center, debug ? 51 : 29, 0, Math.PI * 2);
    context.shadowColor = 'rgba(0,0,0,.78)';
    context.shadowBlur = debug ? 0 : 9;
    context.fillStyle = debug ? '#d93440' : 'rgba(0,0,0,.95)';
    context.fill();
    context.shadowBlur = 0;
    context.lineWidth = debug ? 8 : 2;
    context.strokeStyle = debug ? '#ffffff' : 'rgba(255,255,255,.42)';
    context.stroke();
    context.fillStyle = 'rgba(255,255,255,.9)';
    context.font = `700 ${debug ? 58 : 29}px Arial, sans-serif`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(String(number), center, center + (debug ? 3 : 2));
    const texture = new THREE.CanvasTexture(bitmap);
    texture.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: texture, depthTest: false, depthWrite: false, transparent: true, opacity: debug ? 1 : .9,
    }));
    const size = modelRadius * (debug ? .085 : .0415);
    sprite.scale.set(size, size, size);
    sprite.renderOrder = debug ? 100 : 50;
    sprite.name = `dna-hotspot-${number}`;
    return sprite;
  }

  function selectPoint(clientX: number, clientY: number) {
    if (!modelReady || !options.onPoint) return;
    const rect = canvas.getBoundingClientRect();
    const mouse = new THREE.Vector2(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    camera.updateMatrixWorld(true);
    modelGroup.updateMatrixWorld(true);
    raycaster.setFromCamera(mouse, camera);
    const hit = raycaster.intersectObjects(meshes, false)[0];
    if (!hit) { options.onPoint(null); return; }
    const position = modelGroup.worldToLocal(hit.point.clone());
    const id = ++pointCount;
    const sprite = marker(id);
    sprite.position.copy(position);
    markerGroup.add(sprite);
    options.onPoint({ id, position: {
      x: Number(position.x.toFixed(6)), y: Number(position.y.toFixed(6)), z: Number(position.z.toFixed(6)),
    } });
  }

  canvas.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    pointer = { id: event.pointerId, startX: event.clientX, startY: event.clientY, x: event.clientX, y: event.clientY, dragged: false };
    wasDragged = false;
    options.onDragging(true);
    canvas.focus({ preventScroll: true });
    canvas.setPointerCapture(event.pointerId);
  }, { signal: listeners.signal });
  canvas.addEventListener('pointermove', event => {
    if (!pointer || pointer.id !== event.pointerId) return;
    const deltaX = event.clientX - pointer.x;
    const deltaY = event.clientY - pointer.y;
    if (Math.hypot(event.clientX - pointer.startX, event.clientY - pointer.startY) > (debug ? 6 : 1)) pointer.dragged = true;
    if (!debug || pointer.dragged) {
      targetRotationY += deltaX * .009;
      targetRotationX += deltaY * .009;
    }
    wasDragged = pointer.dragged;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
  }, { signal: listeners.signal });
  function releasePointer(event: PointerEvent) {
    if (!pointer || pointer.id !== event.pointerId) return;
    const shouldSave = debug && !pointer.dragged && event.type === 'pointerup';
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    pointer = null;
    options.onDragging(false);
    if (shouldSave) selectPoint(event.clientX, event.clientY);
  }
  canvas.addEventListener('pointerup', releasePointer, { signal: listeners.signal });
  canvas.addEventListener('pointercancel', releasePointer, { signal: listeners.signal });
  canvas.addEventListener('wheel', event => {
    event.preventDefault();
    targetZoom = THREE.MathUtils.clamp(targetZoom * Math.exp(-event.deltaY * .001), .72, debug ? 2.5 : 2.25);
  }, { passive: false, signal: listeners.signal });
  canvas.addEventListener('keydown', event => {
    const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '=', '-', '_'];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'ArrowLeft') targetRotationY -= .1;
    if (event.key === 'ArrowRight') targetRotationY += .1;
    if (event.key === 'ArrowUp') targetRotationX -= .1;
    if (event.key === 'ArrowDown') targetRotationX += .1;
    if (event.key === '+' || event.key === '=') targetZoom = Math.min(targetZoom * 1.1, debug ? 2.5 : 2.25);
    if (event.key === '-' || event.key === '_') targetZoom = Math.max(targetZoom / 1.1, .72);
  }, { signal: listeners.signal });

  const observer = new ResizeObserver(resize);
  observer.observe(container);
  window.addEventListener('resize', resize, { signal: listeners.signal });
  new GLTFLoader().loadAsync(modelUrl).then(gltf => {
    if (disposed) { disposeObjects(gltf.scene); return; }
    const model = gltf.scene;
    model.rotation.x = -Math.PI / 2;
    model.updateMatrixWorld(true);
    const center = new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3());
    model.position.sub(center);
    model.updateMatrixWorld(true);
    modelRadius = Math.max(new THREE.Box3().setFromObject(model).getBoundingSphere(new THREE.Sphere()).radius, .01);
    model.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      object.frustumCulled = false;
      meshes.push(object);
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        material.side = THREE.DoubleSide;
        material.needsUpdate = true;
      }
    });
    modelGroup.add(model);
    if (!debug) hotspotPositions.forEach((position, index) => {
      const sprite = marker(index + 1);
      sprite.position.set(position.x, position.y, position.z);
      markerGroup.add(sprite);
    });
    modelGroup.rotation.set(targetRotationX, targetRotationY, 0);
    modelReady = true;
    resize();
    options.onReady();
  }).catch(error => { if (!disposed) { setActive(false); options.onError(error); } });

  function animate(time: number) {
    if (!active || disposed) return;
    const delta = Math.min((time - lastTime) / 1000, .05);
    lastTime = time;
    const smoothing = 1 - Math.pow(.0005, delta);
    if (!debug && pointer === null && !wasDragged && modelReady) targetRotationY += delta * .08;
    modelGroup.rotation.x = THREE.MathUtils.lerp(modelGroup.rotation.x, targetRotationX, smoothing);
    modelGroup.rotation.y = THREE.MathUtils.lerp(modelGroup.rotation.y, targetRotationY, smoothing);
    camera.zoom = THREE.MathUtils.lerp(camera.zoom, targetZoom, smoothing);
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
    options.onFrame?.();
    animationFrame = requestAnimationFrame(animate);
  }
  function setActive(value: boolean) {
    if (disposed || active === value) return;
    active = value;
    if (active) {
      resize();
      lastTime = performance.now();
      animationFrame = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(animationFrame);
      if (pointer && canvas.hasPointerCapture(pointer.id)) canvas.releasePointerCapture(pointer.id);
      pointer = null;
      options.onDragging(false);
    }
  }

  resize();
  return {
    setActive,
    project(position) {
      modelGroup.updateMatrixWorld(true);
      projected.set(position.x, position.y, position.z);
      modelGroup.localToWorld(projected).project(camera);
      return { x: (projected.x * .5 + .5) * container.clientWidth, y: (-projected.y * .5 + .5) * container.clientHeight };
    },
    dispose() {
      setActive(false);
      disposed = true;
      listeners.abort();
      observer.disconnect();
      disposeObjects(scene);
      renderer.dispose();
    },
  };
}
