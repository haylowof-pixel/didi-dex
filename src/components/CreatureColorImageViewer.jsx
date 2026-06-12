import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getColorByName, getSpeciesColorRegions, normalizeCreatureColors } from '../data/statExtractor';
import { getCreatureImageFallbacks, getCreatureIconUrl } from '../data/creatureIcons';

const IMAGE_PACK_BASE = 'https://raw.githubusercontent.com/arkutils/species-images/main/images/';
const MANIFEST_URL = `${IMAGE_PACK_BASE}_manifest.json`;

const manifestCache = { value: null };

function imageUrl(fileName) {
  return `${IMAGE_PACK_BASE}${encodeURIComponent(fileName).replace(/%2F/g, '/')}`;
}

function candidateNames(species) {
  const names = [
    `${species}_ASA`,
    species,
  ];

  if (species.startsWith('Aberrant ')) names.push(species.replace('Aberrant ', ''));
  if (species.includes('Brute ')) names.push(species.replace('Brute ', ''));
  if (species.includes('Polar ')) names.push(species.replace('Polar Bear', 'Dire Bear').replace('Polar ', ''));

  return Array.from(new Set(names));
}

async function loadManifest() {
  if (manifestCache.value) return manifestCache.value;
  const res = await fetch(MANIFEST_URL);
  if (!res.ok) throw new Error('ASB image manifest unavailable');
  const data = await res.json();
  manifestCache.value = new Set(Object.keys(data.files || {}));
  return manifestCache.value;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function colorNameToRgb(colorName) {
  const rgba = getColorByName(colorName)?.rgba || [0, 0, 0];
  return rgba.slice(0, 3).map(v => Math.max(0, Math.min(255, Math.round(v * 255))));
}

function regionOpacity(region, r, g, b) {
  switch (region) {
    case 0: return Math.max(0, r - g - b) / 255;
    case 1: return Math.max(0, g - r - b) / 255;
    case 2: return Math.max(0, b - r - g) / 255;
    case 3: return Math.min(g, b) / 255;
    case 4: return Math.min(r, g) / 255;
    case 5: return Math.min(r, b) / 255;
    default: return 0;
  }
}

function applyMask(baseImage, maskImage, species, colors) {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.clearRect(0, 0, size, size);
  ctx.drawImage(baseImage, 0, 0, size, size);

  if (!maskImage) return canvas.toDataURL('image/png');

  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = size;
  maskCanvas.height = size;
  const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true });
  maskCtx.drawImage(maskImage, 0, 0, size, size);

  const imageData = ctx.getImageData(0, 0, size, size);
  const maskData = maskCtx.getImageData(0, 0, size, size).data;
  const data = imageData.data;
  const normalized = normalizeCreatureColors(species, colors);
  const regions = getSpeciesColorRegions(species);
  const rgbByRegion = Array.from({ length: 6 }, (_, index) => {
    if (!regions[index]?.enabled || !normalized[index]) return null;
    return colorNameToRgb(normalized[index]);
  });

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;

    const mr = maskData[i];
    const mg = maskData[i + 1];
    const mb = maskData[i + 2];
    let finalR = data[i];
    let finalG = data[i + 1];
    let finalB = data[i + 2];

    for (let region = 0; region < 6; region += 1) {
      const rgb = rgbByRegion[region];
      if (!rgb) continue;
      const o = regionOpacity(region, mr, mg, mb);
      if (o <= 0) continue;

      const rMix = Math.max(0, Math.min(255, finalR + rgb[0] - 128));
      const gMix = Math.max(0, Math.min(255, finalG + rgb[1] - 128));
      const bMix = Math.max(0, Math.min(255, finalB + rgb[2] - 128));

      finalR = o * rMix + (1 - o) * finalR;
      finalG = o * gMix + (1 - o) * finalG;
      finalB = o * bMix + (1 - o) * finalB;
    }

    data[i] = finalR;
    data[i + 1] = finalG;
    data[i + 2] = finalB;
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

function pieChart(species, colors) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const regions = getSpeciesColorRegions(species).filter(r => r.enabled);
  const normalized = normalizeCreatureColors(species, colors);
  const center = 256;
  const radius = 118;
  const angle = (Math.PI * 2) / Math.max(regions.length, 1);

  ctx.clearRect(0, 0, 512, 512);
  regions.forEach((region, index) => {
    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.arc(center, center, radius, index * angle - Math.PI / 2, (index + 1) * angle - Math.PI / 2);
    ctx.closePath();
    ctx.fillStyle = getColorByName(normalized[region.index])?.hex || '#222';
    ctx.fill();
  });
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.stroke();
  return canvas.toDataURL('image/png');
}

async function fallbackCreaturePreview(species, colors) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const normalized = normalizeCreatureColors(species, colors);
  const regions = getSpeciesColorRegions(species).filter(r => r.enabled);
  const swatches = regions.map(region => getColorByName(normalized[region.index])?.hex).filter(Boolean);

  const bg = ctx.createRadialGradient(256, 220, 40, 256, 256, 280);
  bg.addColorStop(0, 'rgba(166,108,255,0.32)');
  bg.addColorStop(0.44, 'rgba(255,217,133,0.10)');
  bg.addColorStop(1, 'rgba(4,5,16,0)');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 512);

  swatches.forEach((hex, index) => {
    ctx.beginPath();
    ctx.arc(256, 256, 198 - index * 18, 0, Math.PI * 2);
    ctx.strokeStyle = `${hex}aa`;
    ctx.lineWidth = 10;
    ctx.setLineDash([44, 22]);
    ctx.lineDashOffset = index * -18;
    ctx.stroke();
  });
  ctx.setLineDash([]);

  const fallbacks = [...getCreatureImageFallbacks(species), getCreatureIconUrl(species)];
  let image = null;
  for (const url of fallbacks) {
    try {
      image = await loadImage(url);
      break;
    } catch {
      // Try the next official/local image candidate.
    }
  }

  if (image) {
    const ratio = Math.min(360 / image.width, 360 / image.height);
    const width = image.width * ratio;
    const height = image.height * ratio;
    ctx.shadowColor = 'rgba(166,108,255,0.55)';
    ctx.shadowBlur = 28;
    ctx.drawImage(image, 256 - width / 2, 232 - height / 2, width, height);
    ctx.shadowBlur = 0;
  }

  const startX = 106;
  swatches.slice(0, 6).forEach((hex, index) => {
    ctx.fillStyle = hex;
    ctx.beginPath();
    ctx.roundRect(startX + index * 52, 414, 34, 34, 9);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.32)';
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  ctx.fillStyle = 'rgba(255,247,223,0.88)';
  ctx.font = '800 22px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(species, 256, 474);
  return canvas.toDataURL('image/png');
}

export default function CreatureColorImageViewer({ species, colors }) {
  const [preview, setPreview] = useState('');
  const [status, setStatus] = useState('Loading ASB image pack...');
  const [source, setSource] = useState('');
  const requestId = useRef(0);

  const normalized = useMemo(() => normalizeCreatureColors(species, colors), [species, colors]);

  useEffect(() => {
    let active = true;
    const id = requestId.current + 1;
    requestId.current = id;
    setStatus('Loading ASB image pack...');

    async function render() {
      try {
        const manifest = await loadManifest();
        const baseName = candidateNames(species).find(name => manifest.has(`${name}.png`));
        if (!baseName) {
          if (!active || requestId.current !== id) return;
          setPreview(await fallbackCreaturePreview(species, normalized));
          setSource('');
          setStatus('Official fallback image + color regions');
          return;
        }

        const [baseImage, maskImage] = await Promise.all([
          loadImage(imageUrl(`${baseName}.png`)),
          manifest.has(`${baseName}_m.png`) ? loadImage(imageUrl(`${baseName}_m.png`)) : Promise.resolve(null),
        ]);

        if (!active || requestId.current !== id) return;
        setPreview(applyMask(baseImage, maskImage, species, normalized));
        setSource(`${baseName}.png`);
        setStatus(maskImage ? 'ASB color-region image loaded' : 'ASB image loaded without mask');
      } catch {
        if (!active || requestId.current !== id) return;
        setPreview(await fallbackCreaturePreview(species, normalized).catch(() => pieChart(species, normalized)));
        setSource('');
        setStatus('ASB image pack unavailable - official fallback preview');
      }
    }

    render();
    return () => { active = false; };
  }, [species, normalized]);

  return (
    <div className="ase-creature-image-viewer">
      <div className="ase-creature-image-stage">
        {preview ? <img src={preview} alt={`${species} color preview`} /> : <div className="ase-image-loading">Loading...</div>}
      </div>
      <div className="ase-creature-image-meta">
        <strong>{species}</strong>
        <span>{status}{source ? ` · ${source}` : ''}</span>
      </div>
    </div>
  );
}
