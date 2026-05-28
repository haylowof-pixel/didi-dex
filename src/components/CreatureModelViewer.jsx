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

function buildVisibleModelMaterial(sourceMaterial, regionIndex, regionColors) {
  const hasTexture = Boolean(sourceMaterial?.map);
  const material = hasTexture
    ? new THREE.MeshBasicMaterial({
      name: sourceMaterial?.name || REGION_MATERIALS[regionIndex],
      color: new THREE.Color('#ffffff'),
      map: sourceMaterial.map,
      side: THREE.DoubleSide,
    })
    : new THREE.MeshStandardMaterial({
      name: sourceMaterial?.name || REGION_MATERIALS[regionIndex],
      color: colorToThree(regionColors[regionIndex], sourceMaterial?.color ? `#${sourceMaterial.color.getHexString()}` : '#687083'),
      roughness: 0.68,
      metalness: 0.02,
      side: THREE.DoubleSide,
    });
  material.userData.regionIndex = regionIndex;
  material.wireframe = false;
  material.vertexColors = false;
  material.transparent = false;
  material.opacity = 1;
  if (material.map) {
    material.map.colorSpace = THREE.SRGBColorSpace;
    material.map.needsUpdate = true;
  }
  return material;
}

function fitCamera(camera, object, controls) {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z) || 4;
  camera.position.set(center.x + maxDim * 0.5, center.y + maxDim * 0.24, center.z + maxDim * 0.66);
  camera.near = 0.01;
  camera.far = maxDim * 100;
  camera.lookAt(center);
  camera.updateProjectionMatrix();
  controls.target.copy(center);
  controls.update();
}

function buildRegionUniforms(regionColors) {
  return Array.from({ length: 6 }, (_, index) => {
    const color = colorToThree(regionColors[index], ['#4d5144', '#3f4b36', '#5b5140', '#3f4638', '#556052', '#4c453a'][index]);
    if (color.r + color.g + color.b < 0.18) color.set('#736d5d');
    return color;
  });
}

function buildArkColorizeMaterial(diffuse, colorize, regionColors) {
  const regions = buildRegionUniforms(regionColors);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      diffuseMap: { value: diffuse },
      colorizeMap: { value: colorize },
      region0: { value: regions[0] },
      region1: { value: regions[1] },
      region2: { value: regions[2] },
      region3: { value: regions[3] },
      region4: { value: regions[4] },
      region5: { value: regions[5] },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D diffuseMap;
      uniform sampler2D colorizeMap;
      uniform vec3 region0;
      uniform vec3 region1;
      uniform vec3 region2;
      uniform vec3 region3;
      uniform vec3 region4;
      uniform vec3 region5;
      varying vec2 vUv;
      varying vec3 vNormal;

      vec3 pickRegion(vec3 mask) {
        if (mask.r > 0.8 && mask.g > 0.8) return region3;
        if (mask.g > 0.8 && mask.b > 0.8) return region4;
        if (mask.r > 0.8 && mask.b > 0.8) return region5;
        if (mask.r >= mask.g && mask.r >= mask.b) return region0;
        if (mask.g >= mask.r && mask.g >= mask.b) return region1;
        return region2;
      }

      void main() {
        vec3 detail = texture2D(diffuseMap, vUv).rgb;
        vec3 mask = texture2D(colorizeMap, vUv).rgb;
        vec3 base = pickRegion(mask);
        float detailLuma = dot(detail, vec3(0.2126, 0.7152, 0.0722));
        float detailMix = clamp(detailLuma * 0.16 + 0.86, 0.78, 1.02);
        vec3 lightDir = normalize(vec3(0.45, 0.75, 0.55));
        float ndl = max(dot(normalize(vNormal), lightDir), 0.0);
        float light = 0.62 + ndl * 0.62;
        vec3 color = base * detailMix * light;
        gl_FragColor = vec4(color, 1.0);
      }
    `,
    side: THREE.DoubleSide,
  });
  material.name = 'ARK_Rex_colorized_shader';
  material.userData.regionIndex = 0;
  return material;
}

async function loadOverseerStaticMesh(url, regionColors) {
  const metaResponse = await fetch(url, { cache: 'no-store' });
  if (!metaResponse.ok) throw new Error(`Model metadata failed: ${metaResponse.status}`);
  const meta = await metaResponse.json();
  if (meta?.format !== 'overseer-static-mesh-v1') throw new Error('Unsupported OVERSEER mesh format');

  const baseUrl = new URL(url, window.location.href);
  const binUrl = new URL(meta.bin, baseUrl);
  const diffuseUrl = new URL(meta.diffuse, baseUrl);
  const colorizeUrl = new URL(meta.colorize || meta.diffuse, baseUrl);
  const binResponse = await fetch(binUrl, { cache: 'no-store' });
  if (!binResponse.ok) throw new Error(`Model buffer failed: ${binResponse.status}`);
  const buffer = await binResponse.arrayBuffer();

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(buffer, meta.positions.byteOffset, meta.vertexCount * 3), 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(buffer, meta.normals.byteOffset, meta.vertexCount * 3), 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(buffer, meta.uvs.byteOffset, meta.vertexCount * 2), 2));
  const IndexArray = meta.indices.componentType === 5125 ? Uint32Array : Uint16Array;
  geometry.setIndex(new THREE.BufferAttribute(new IndexArray(buffer, meta.indices.byteOffset, meta.indexCount), 1));
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();

  const texture = await new THREE.TextureLoader().loadAsync(diffuseUrl.href);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = false;
  texture.anisotropy = 8;
  const colorize = await new THREE.TextureLoader().loadAsync(colorizeUrl.href);
  colorize.colorSpace = THREE.SRGBColorSpace;
  colorize.flipY = false;
  colorize.anisotropy = 8;

  const material = buildArkColorizeMaterial(texture, colorize, regionColors);

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = meta.name || 'ARK creature direct mesh';
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.frustumCulled = false;
  const group = new THREE.Group();
  group.name = mesh.name;
  group.add(mesh);
  return { object: group, materials: [material], sourceName: meta.name || 'Installed direct mesh' };
}

export default function CreatureModelViewer({ species, colorHexes, modelUrl, modelSource, materialRegions }) {
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
    const camera = new THREE.PerspectiveCamera(28, mount.clientWidth / mount.clientHeight, 0.01, 200);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.8;
    controls.enablePan = false;

    scene.add(new THREE.HemisphereLight('#dce6ff', '#15171a', 2.35));
    const key = new THREE.DirectionalLight('#ffffff', 2.8);
    key.position.set(3, 5, 4);
    scene.add(key);
    const rim = new THREE.DirectionalLight('#8fa5ff', 1.45);
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

      setStatus(`Loading ${modelSource || 'installed model'}...`);
      if (url.includes('.overseer.json')) {
        loadOverseerStaticMesh(url, regionColors).then(({ object, materials, sourceName }) => {
          objectRef.current = object;
          materialRef.current = materials;
          scene.add(object);
          fitCamera(camera, object, controls);
          setStatus(`${sourceName} loaded`);
        }).catch(() => {
          const fallback = buildFallbackCreature(regionColors);
          objectRef.current = fallback.object;
          materialRef.current = fallback.materials;
          scene.add(fallback.object);
          fitCamera(camera, fallback.object, controls);
          setStatus('Direct model failed to load - procedural preview');
        });
        return;
      }
      new GLTFLoader().load(url, (gltf) => {
        const object = gltf.scene;
        const materials = [];
        let materialIndex = 0;
        object.traverse(child => {
          if (child.isBone) {
            child.visible = false;
          }
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.frustumCulled = false;
            if (Array.isArray(child.material)) {
              child.material = child.material.map((mat) => {
                const regionIndex = resolveRegionIndex(mat?.name, child.name, materialIndex, materialRegions);
                const clone = buildVisibleModelMaterial(mat, regionIndex, regionColors);
                materials.push(clone);
                materialIndex += 1;
                return clone;
              });
            } else {
              const regionIndex = resolveRegionIndex(child.material?.name, child.name, materialIndex, materialRegions);
              const clone = buildVisibleModelMaterial(child.material, regionIndex, regionColors);
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
    const shaderRegions = buildRegionUniforms(regionColors);
    materialRef.current.forEach((mat, index) => {
      if (mat?.uniforms?.region0) {
        shaderRegions.forEach((color, regionIndex) => {
          mat.uniforms[`region${regionIndex}`].value.copy(color);
        });
        mat.needsUpdate = true;
        return;
      }
      if (!mat?.color) return;
      if (mat.map) {
        mat.color.set('#ffffff');
        mat.needsUpdate = true;
        return;
      }
      const regionIndex = Number.isInteger(mat.userData?.regionIndex) ? mat.userData.regionIndex : index % 6;
      mat.color = colorToThree(regionColors[regionIndex], mat.color.getHexString ? `#${mat.color.getHexString()}` : '#687083');
      mat.needsUpdate = true;
    });
  }, [regionColors]);

  return (
    <div className="ase-model-viewer">
      <div ref={mountRef} className="ase-model-canvas" aria-label={`${species} 3D model preview`} />
      <div className="ase-model-toolbar">
        <div>
          <strong>{species}</strong>
          <span>{status}</span>
        </div>
        <span>{modelUrl ? 'Installed surface model' : 'Procedural preview'}</span>
      </div>
    </div>
  );
}
