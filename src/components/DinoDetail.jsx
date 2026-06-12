import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FOOD_TYPES } from '../data/dinosaurs';
import { calculateTaming } from '../data/tamingCalculator';
import TamingPanel from './TamingPanel';
import { getCreatureImageFallbacks } from '../data/creatureIcons';
import { ClockIcon, ZapIcon, SparklesIcon, ShieldIcon } from './Icons';

/* Background handled by global app-video-bg */
function DetailCanvasBg() {
  return null;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

const MULTIPLIER_PRESETS = [
  { label: '1x', value: 1 },
  { label: '2x', value: 2 },
  { label: '3x', value: 3 },
  { label: '5x', value: 5 },
  { label: '10x', value: 10 },
];

function DossierImage({ name }) {
  const urls = useMemo(() => getCreatureImageFallbacks(name), [name]);
  const localSrc = name === 'Rex' ? './creatures/wiki/rex-dossier.png' : '';
  const [src, setSrc] = useState(localSrc || '');
  const [isIcon, setIsIcon] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  React.useEffect(() => {
    if (localSrc) {
      setSrc(localSrc);
      setIsIcon(false);
      setUnavailable(false);
      return;
    }
    setSrc('');
    setIsIcon(false);
    setUnavailable(false);
    const candidates = urls.filter(Boolean);
    function tryLoad(i) {
      if (i >= candidates.length) {
        setSrc('');
        setIsIcon(false);
        setUnavailable(true);
        return;
      }
      const img = new Image();
      img.onload = () => { setSrc(candidates[i]); setIsIcon(i >= candidates.length - 1); };
      img.onerror = () => tryLoad(i + 1);
      img.src = candidates[i];
    }
    tryLoad(0);
  }, [name, localSrc, urls]);

  return (
    <div className="detail-hero-dossier">
      {unavailable ? (
        <div className="dossier-missing">
          <strong>{name}</strong>
          <span>Dossier image unavailable</span>
        </div>
      ) : !src ? (
        <div className="dossier-missing dossier-loading">
          <strong>{name}</strong>
          <span>Loading dossier</span>
        </div>
      ) : (
        <img
          src={src}
          alt={name}
          className={`dossier-img${isIcon ? ' dossier-fallback' : ''}`}
        />
      )}
    </div>
  );
}

function formatTime(seconds) {
  if (!seconds || seconds <= 0) return '0s';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function SanguineElixirIcon() {
  return (
    <svg className="sanguine-elixir-svg" viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id="sanguineGlass" x1="9" y1="4" x2="24" y2="29" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff0d8" />
          <stop offset="0.38" stopColor="#ff5b5b" />
          <stop offset="1" stopColor="#5b0710" />
        </linearGradient>
        <linearGradient id="sanguineCore" x1="12" y1="12" x2="21" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffb09a" />
          <stop offset="0.55" stopColor="#ff2424" />
          <stop offset="1" stopColor="#8a0018" />
        </linearGradient>
      </defs>
      <path d="M13 3h6v4l-1.4 1.8v2.6l6.6 12.1c1.2 2.2-.4 4.9-2.9 4.9H10.7c-2.5 0-4.1-2.7-2.9-4.9l6.6-12.1V8.8L13 7V3Z" fill="rgba(255,255,255,0.08)" stroke="#ffd985" strokeWidth="1.2" />
      <path d="M11 24.5 16 13l5 11.5c.5 1.2-.3 2.5-1.6 2.5h-6.8c-1.3 0-2.1-1.3-1.6-2.5Z" fill="url(#sanguineCore)" />
      <path d="M13.3 3.4h5.4v2.8h-5.4z" fill="#2b2238" stroke="#ffd985" strokeWidth="0.9" />
      <path d="M12.4 21.8c3.2.9 5.9.7 8.2-.4" fill="none" stroke="#ff7a4a" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M13.2 10.2c1.4.5 3.8.5 5.2 0" fill="none" stroke="#fff1cc" strokeWidth="1" strokeLinecap="round" opacity=".65" />
      <path d="M18.3 13.8 20.7 19" stroke="#ffefcf" strokeWidth="1.3" strokeLinecap="round" opacity=".55" />
    </svg>
  );
}

function FoodIcon({ src, name }) {
  const [failed, setFailed] = useState(false);
  const fallback = name?.trim()?.charAt(0)?.toUpperCase() || '?';

  if (!src || failed) {
    return (
      <span className="food-table-img food-table-img-fallback" aria-hidden="true">
        {fallback}
      </span>
    );
  }

  return (
    <img
      className="food-table-img"
      src={src}
      alt=""
      width="28"
      height="28"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

export default function DinoDetail({ dino }) {
  const [level, setLevel] = useState(30);
  const [levelInput, setLevelInput] = useState('30');
  const [selectedFood, setSelectedFood] = useState(dino.tamingFoods[0]?.food || null);
  const [tamingMultiplier, setTamingMultiplier] = useState(1);
  const [sanguineElixir, setSanguineElixir] = useState(false);

  const result = useMemo(() => {
    return calculateTaming(dino, level, selectedFood, tamingMultiplier, sanguineElixir);
  }, [dino, level, selectedFood, tamingMultiplier, sanguineElixir]);

  // Calculate all food results for the comparison table
  const allFoodResults = useMemo(() => {
    return dino.tamingFoods.map(tf => {
      const foodInfo = FOOD_TYPES[tf.food];
      if (!foodInfo) return null;
      const res = calculateTaming(dino, level, tf.food, tamingMultiplier, sanguineElixir);
      if (!res) return null;
      return { ...res, foodKey: tf.food, foodInfo };
    }).filter(Boolean).sort((a, b) =>
      b.effectiveness - a.effectiveness
      || a.totalTimeSeconds - b.totalTimeSeconds
      || a.foodNeeded - b.foodNeeded
    );
  }, [dino, level, tamingMultiplier, sanguineElixir]);

  React.useEffect(() => {
    const bestFood = allFoodResults[0]?.foodKey || dino.tamingFoods[0]?.food || null;
    if (bestFood) setSelectedFood(bestFood);
  }, [dino.name]);

  const levelProgress = `${((level - 1) / (450 - 1)) * 100}%`;

  const handleLevelSlider = useCallback((e) => {
    const v = parseInt(e.target.value);
    setLevel(v);
    setLevelInput(String(v));
  }, []);

  const handleLevelInput = useCallback((e) => {
    const raw = e.target.value;
    setLevelInput(raw);
    const v = parseInt(raw);
    if (!isNaN(v) && v >= 1 && v <= 450) setLevel(v);
  }, []);

  const handleLevelBlur = useCallback(() => {
    let v = parseInt(levelInput);
    if (isNaN(v) || v < 1) v = 1;
    if (v > 450) v = 450;
    setLevel(v);
    setLevelInput(String(v));
  }, [levelInput]);

  const categoryClass = dino.category?.toLowerCase() || '';
  const displayTips = useMemo(() => {
    if (!dino.tips) return '';
    return dino.tips
      .split(/(?<=[.!?])\s+/)
      .filter(sentence => !/\b(trap|gates?|gateway|pi[eè]ge)\b/i.test(sentence))
      .join(' ')
      .trim();
  }, [dino.tips]);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="detail-page"
    >
      <DetailCanvasBg />

      {/* ── HERO ── */}
      <motion.div className="detail-hero" variants={itemVariants}>
        <div className="detail-hero-bg" />
        <div className="detail-hero-content">
          <DossierImage key={dino.name} name={dino.name} />
          <div className="detail-hero-info">
            <h1 className="detail-hero-name">{dino.name}</h1>
            {dino.aka && <div className="detail-hero-aka">{dino.aka}</div>}
            <div className="detail-hero-tags">
              <span className={`dtag ${categoryClass}`}>{dino.category}</span>
              <span className="dtag method">{dino.tamingMethod}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── KEY STATS CARDS ── */}
      {result && (
        <motion.div className="key-stats-row" variants={itemVariants}>
          <div className="key-stat-card">
            <div className="key-stat-icon" style={{ color: 'var(--blue)' }}><ClockIcon size={18} /></div>
            <div className="key-stat-value" style={{ color: 'var(--blue)' }}>{result.totalTimeFmt}</div>
            <div className="key-stat-label">Durée de taming</div>
          </div>
          <div className="key-stat-card">
            <div className="key-stat-icon" style={{ color: 'var(--green)' }}><SparklesIcon size={18} /></div>
            <div className="key-stat-value" style={{ color: 'var(--green)' }}>{result.effectiveness}%</div>
            <div className="key-stat-label">Efficacité</div>
          </div>
          <div className="key-stat-card">
            <div className="key-stat-icon" style={{ color: 'var(--accent-l)' }}><ShieldIcon size={18} /></div>
            <div className="key-stat-value">
              <span style={{ color: 'var(--text-2)', fontSize: '14px' }}>Lvl {level}</span>
              <span style={{ color: 'var(--text-3)', margin: '0 4px' }}>→</span>
              <span style={{ color: 'var(--accent-l)' }}>Lvl {result.maxLevel}</span>
            </div>
            <div className="key-stat-label">Niveau après taming</div>
          </div>
          <div className="key-stat-card">
            <div className="key-stat-icon" style={{ color: 'var(--torpor)' }}><ZapIcon size={18} /></div>
            <div className="key-stat-value" style={{ color: 'var(--torpor)' }}>{result.narcoticsNeeded}</div>
            <div className="key-stat-label">Narcotiques</div>
          </div>
        </motion.div>
      )}

      {/* ── CONTROLS ── */}
      <motion.div className="controls-row" variants={itemVariants}>
        <div className="control-group level-group">
          <label className="control-label">Niveau</label>
          <div className="level-control">
            <div className="level-slider-shell" style={{ '--level-progress': levelProgress }}>
              <span className="level-slider-fill" aria-hidden="true" />
              <input type="range" className="level-slider" min={1} max={450} value={level} onChange={handleLevelSlider} />
            </div>
            <input
              type="number" className="level-input"
              value={levelInput} min={1} max={450}
              onChange={handleLevelInput} onBlur={handleLevelBlur}
            />
          </div>
        </div>
        <div className="control-group mult-group">
          <label className="control-label">Taming Speed</label>
          <div className="mult-control">
            <input type="number" className="mult-input" value={tamingMultiplier}
              min={0.1} max={100} step={0.5}
              onChange={e => setTamingMultiplier(Math.max(0.1, parseFloat(e.target.value) || 1))}
            />
            <div className="mult-presets">
              {MULTIPLIER_PRESETS.map(p => (
                <button key={p.value}
                  className={`mult-chip ${tamingMultiplier === p.value ? 'active' : ''}`}
                  onClick={() => setTamingMultiplier(p.value)}
                >{p.label}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="control-group elixir-group">
          <label className="control-label">Bonus</label>
          <button
            type="button"
            className={`elixir-toggle ${sanguineElixir ? 'active' : ''}`}
            onClick={() => setSanguineElixir(v => !v)}
            title="Applique le bonus de Sanguine Elixir au calcul de nourriture"
          >
            <span className="elixir-icon-wrap">
              <SanguineElixirIcon />
            </span>
            <span>Sanguine Elixir</span>
            <strong>{sanguineElixir ? '+30%' : 'Off'}</strong>
          </button>
        </div>
      </motion.div>

      {/* ── FOOD COMPARISON TABLE ── */}
      <motion.div className="food-table-section" variants={itemVariants}>
        <div className="food-table-header">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          <span>Nourriture</span>
        </div>
        <div className="food-table-wrap">
          <div className="food-grid" role="table" aria-label="Comparaison des nourritures">
            <div className="food-grid-head" role="row">
              <span role="columnheader">Nourriture</span>
              <span role="columnheader">Quantité</span>
              <span role="columnheader">Food</span>
              <span role="columnheader">Durée</span>
              <span role="columnheader">Niveau</span>
              <span role="columnheader">Efficacité</span>
            </div>
            <div className="food-grid-body" role="rowgroup">
              {allFoodResults.map((fr, i) => {
                const isSelected = fr.foodKey === selectedFood;
                return (
                  <button
                    type="button"
                    key={fr.foodKey}
                    className={`food-grid-row ${isSelected ? 'food-grid-row-selected' : ''} ${i === 0 ? 'food-grid-row-best' : ''}`}
                    onClick={() => setSelectedFood(fr.foodKey)}
                    role="row"
                  >
                    <span className="food-grid-cell food-table-name" role="cell">
                      <span className="food-table-name-inner">
                        <FoodIcon src={fr.foodInfo.img || fr.foodInfo.icon} name={fr.foodInfo.name} />
                        <span className="food-table-label">{fr.foodInfo.name}</span>
                        {i === 0 && <span className="food-table-best-badge">Meilleur</span>}
                      </span>
                    </span>
                    <span className="food-grid-cell food-table-qty" role="cell">{fr.foodNeeded}</span>
                    <span className="food-grid-cell food-table-time" role="cell">{fr.foodPointsConsumed > 0 ? Math.round(fr.foodPointsConsumed) : '-'}</span>
                    <span className="food-grid-cell food-table-time" role="cell">{fr.totalTimeFmt}</span>
                    <span className="food-grid-cell food-table-level" role="cell">Lvl {fr.maxLevel}</span>
                    <span className="food-grid-cell food-table-eff" role="cell">
                      <span className={`food-table-eff-val ${fr.effectiveness >= 99 ? 'eff-perfect' : fr.effectiveness >= 80 ? 'eff-good' : 'eff-low'}`}>
                        {fr.effectiveness}%
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── TIMERS & NARCOTIC PANEL ── */}
      {result && (
        <motion.div variants={itemVariants}>
              <TamingPanel result={result} dino={{ ...dino, tips: displayTips }} level={level} />
        </motion.div>
      )}
    </motion.div>
  );
}
