import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const REGION_MATERIALS = [
  'region-0-body',
  'region-1-belly',
  'region-2-back',
  'region-3-markings',
  'region-4-crest',
  'region-5-accent',
];

function colorToThree(hex, fallback) {
  try { return new THREE.Color(hex || fallback); }
  catch { return new THREE.Color(fallback); }
}

function buildFallbackCreature(regionColors) {
  const group = new THREE.Group();
  const mats = REGION_MATERIALS.map((name, index) => new THREE.MeshStandardMaterial({
    name,
    color: colorToThree(regionColors[index], ['#566070', '#9aa3ad', '#343945', '#243b53', '#87b5ff', '#2dd4a0'][index]),
    roughness: 0.7,
    metalness: 0.05,
  }));

  const body = new THREE.Mesh(new THREE.SphereGeometry(1.45, 48, 24), mats[0]);
  body.scale.set(1.75, 0.7, 0.85);
  body.name = 'Body region 0';
  group.add(body);

  const belly = new THREE.Mesh(new THREE.SphereGeometry(1.12, 40, 16, 0, Math.PI * 2, Math.PI * 0.48, Math.PI * 0.52), mats[1]);
  belly.scale.set(1.85, 0.58, 0.88);
  belly.position.y = -0.08;
  belly.rotation.x = Math.PI;
  belly.name = 'Belly region 1';
  group.add(belly);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.72, 32, 18), mats[2]);
  head.scale.set(1.1, 0.78, 0.86);
  head.position.set(1.85, 0.18, 0);
  head.name = 'Head region 2';
  group.add(head);

  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.42, 2.2, 28), mats[3]);
  tail.rotation.z = Math.PI / 2;
  tail.position.set(-2.28, 0.08, 0);
  tail.scale.set(1, 0.65, 0.65);
  tail.name = 'Tail region 3';
  group.add(tail);

  const crest = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.7, 4), mats[4]);
  crest.rotation.x = Math.PI / 4;
  crest.position.set(1.85, 0.86, 0);
  crest.name = 'Crest region 4';
  group.add(crest);

  for (const z of [-0.48, 0.48]) {
    for (const x of [-0.85, 0.75]) {
      const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.76, 8, 14), mats[5]);
      leg.position.set(x, -0.76, z);
      leg.name = 'Leg accents region 5';
      group.add(leg);
    }
  }

  const eyeMat = new THREE.MeshStandardMaterial({ color: '#d7f8ff', emissive: '#4aa3ff', emissiveIntensity: 0.65 });
  for (const z of [-0.26, 0.26]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 8), eyeMat);
    eye.position.set(2.46, 0.32, z);
    group.add(eye);
  }

  return { object: group, materials: mats };
}

function resolveRegionIndex(materialName, meshName, fallbackIndex, materialRegions = []) {
  const haystack = `${materialName || ''} ${meshName || ''}`.toLowerCase();
  const match = materialRegions.find(rule => {
    if (rule?.region == null || !rule?.match) return false;
    return haystack.includes(String(rule.match).toLowerCase());
  });
  const region = Number(match?.region);
  return Number.isInteger(region) && region >= 0 && region <= 5 ? region : fallbackIndex % 6;
}

function fitCamera(camera, object, controls) {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z) || 4;
  camera.position.set(center.x + maxDim * 1.2, center.y + maxDim * 0.65, center.z + maxDim * 1.45);
  camera.near = 0.01;
  camera.far = maxDim * 100;
  camera.lookAt(center);
  camera.updateProjectionMatrix();
  controls.target.copy(center);
  controls.update();
}

export default function CreatureModelViewer({ species, colorHexes, modelUrl, modelSource, materialRegions, onModelUrl }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const objectRef = useRef(null);
  const materialRef = useRef([]);
  const [status, setStatus] = useState('No game model installed');

  const regionColors = useMemo(() => Array.from({ length: 6 }, (_, index) => colorHexes?.[index] || ''), [colorHexes]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const camera = new THREE.PerspectiveCamera(34, mount.clientWidth / mount.clientHeight, 0.01, 200);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.8;
    controls.enablePan = false;

    scene.add(new THREE.HemisphereLight('#b8ccff', '#101018', 1.8));
    const key = new THREE.DirectionalLight('#ffffff', 2.1);
    key.position.set(3, 5, 4);
    scene.add(key);
    const rim = new THREE.DirectionalLight('#7b93f8', 1.1);
    rim.position.set(-4, 2, -3);
    scene.add(rim);

    const grid = new THREE.GridHelper(5, 12, '#2d375c', '#151a2d');
    grid.position.y = -1.16;
    grid.material.opacity = 0.22;
    grid.material.transparent = true;
    scene.add(grid);

    const loadObject = (url) => {
      if (objectRef.current) scene.remove(objectRef.current);
      if (!url) {
        const fallback = buildFallbackCreature(regionColors);
        objectRef.current = fallback.object;
        materialRef.current = fallback.materials;
        scene.add(fallback.object);
        fitCamera(camera, fallback.object, controls);
        setStatus('No game model installed - procedural preview');
        return;
      }

      setStatus(`Loading ${modelSource || 'GLB/GLTF model'}...`);
      new GLTFLoader().load(url, (gltf) => {
        const object = gltf.scene;
        const materials = [];
        let materialIndex = 0;
        object.traverse(child => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (Array.isArray(child.material)) {
              child.material = child.material.map((mat) => {
                const clone = mat.clone();
                const regionIndex = resolveRegionIndex(clone.name, child.name, materialIndex, materialRegions);
                clone.userData.regionIndex = regionIndex;
                clone.name = clone.name || REGION_MATERIALS[regionIndex];
                materials.push(clone);
                materialIndex += 1;
                return clone;
              });
            } else {
              const clone = child.material?.clone?.() || new THREE.MeshStandardMaterial();
              const regionIndex = resolveRegionIndex(clone.name, child.name, materialIndex, materialRegions);
              clone.userData.regionIndex = regionIndex;
              clone.name = clone.name || REGION_MATERIALS[regionIndex];
              materials.push(clone);
              materialIndex += 1;
              child.material = clone;
            }
          }
        });
        objectRef.current = object;
        materialRef.current = materials;
        scene.add(object);
        fitCamera(camera, object, controls);
        setStatus(`${modelSource || 'Creature model'} loaded`);
      }, undefined, () => {
        const fallback = buildFallbackCreature(regionColors);
        objectRef.current = fallback.object;
        materialRef.current = fallback.materials;
        scene.add(fallback.object);
        fitCamera(camera, fallback.object, controls);
        setStatus('Game model failed to load - procedural preview');
      });
    };

    loadObject(modelUrl);
    let frame = 0;
    const render = () => {
      frame = requestAnimationFrame(render);
      controls.update();
      renderer.render(scene, camera);
    };
    render();

    const resize = () => {
      if (!mount.clientWidth || !mount.clientHeight) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      controls.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
      if (modelUrl?.startsWith('blob:')) URL.revokeObjectURL(modelUrl);
    };
  }, [modelUrl, modelSource, materialRegions]);

  useEffect(() => {
    materialRef.current.forEach((mat, index) => {
      if (!mat?.color) return;
      const regionIndex = Number.isInteger(mat.userData?.regionIndex) ? mat.userData.regionIndex : index % 6;
      mat.color = colorToThree(regionColors[regionIndex], mat.color.getHexString ? `#${mat.color.getHexString()}` : '#687083');
      mat.needsUpdate = true;
    });
  }, [regionColors]);

  const handleModelFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    onModelUrl(URL.createObjectURL(file));
  };

  return (
    <div className="ase-model-viewer">
      <div ref={mountRef} className="ase-model-canvas" aria-label={`${species} 3D model preview`} />
      <div className="ase-model-toolbar">
        <div>
          <strong>{species}</strong>
          <span>{status}</span>
        </div>
        <label>
          Load GLB
          <input type="file" accept=".glb,.gltf,model/gltf-binary,model/gltf+json" onChange={handleModelFile} />
        </label>
      </div>
    </div>
  );
}
