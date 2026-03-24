import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FOOD_TYPES } from '../data/dinosaurs';
import { calculateTaming } from '../data/tamingCalculator';
import TamingPanel from './TamingPanel';
import { getCreatureIconUrl, getCreatureImageFallbacks } from '../data/creatureIcons';
import { ClockIcon, ZapIcon, SparklesIcon, ShieldIcon } from './Icons';

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
  const urls = getCreatureImageFallbacks(name);
  const [src, setSrc] = useState(urls[0]);
  const [isIcon, setIsIcon] = useState(false);
  const triedRef = React.useRef(0);

  React.useEffect(() => {
    triedRef.current = 0;
    setIsIcon(false);
    function tryLoad(i) {
      if (i >= urls.length) { setSrc(urls[urls.length - 1]); setIsIcon(true); return; }
      const img = new Image();
      img.onload = () => { setSrc(urls[i]); setIsIcon(i >= urls.length - 1); };
      img.onerror = () => tryLoad(i + 1);
      img.src = urls[i];
    }
    tryLoad(0);
  }, [name]);

  return (
    <div className="detail-hero-dossier">
      <img src={src} alt={name} className={`dossier-img${isIcon ? ' dossier-fallback' : ''}`} />
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

export default function DinoDetail({ dino }) {
  const [level, setLevel] = useState(30);
  const [levelInput, setLevelInput] = useState('30');
  const [selectedFood, setSelectedFood] = useState(dino.tamingFoods[0]?.food || null);
  const [tamingMultiplier, setTamingMultiplier] = useState(1);

  const result = useMemo(() => {
    return calculateTaming(dino, level, selectedFood, tamingMultiplier);
  }, [dino, level, selectedFood, tamingMultiplier]);

  // Calculate all food results for the comparison table
  const allFoodResults = useMemo(() => {
    return dino.tamingFoods.map(tf => {
      const foodInfo = FOOD_TYPES[tf.food];
      if (!foodInfo) return null;
      const res = calculateTaming(dino, level, tf.food, tamingMultiplier);
      return { ...res, foodKey: tf.food, foodInfo };
    }).filter(Boolean);
  }, [dino, level, tamingMultiplier]);

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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="detail-page"
    >
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
            <input type="range" className="level-slider" min={1} max={450} value={level} onChange={handleLevelSlider} />
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
      </motion.div>

      {/* ── FOOD COMPARISON TABLE ── */}
      <motion.div className="food-table-section" variants={itemVariants}>
        <div className="food-table-header">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          <span>Nourriture</span>
        </div>
        <div className="food-table-wrap">
          <table className="food-table">
            <thead>
              <tr>
                <th>Nourriture</th>
                <th>Quantité</th>
                <th>Durée</th>
                <th>Niveau</th>
                <th>Efficacité</th>
              </tr>
            </thead>
            <tbody>
              {allFoodResults.map((fr, i) => {
                const isSelected = fr.foodKey === selectedFood;
                return (
                  <tr
                    key={fr.foodKey}
                    className={`food-table-row ${isSelected ? 'food-table-row-selected' : ''} ${i === 0 ? 'food-table-row-best' : ''}`}
                    onClick={() => setSelectedFood(fr.foodKey)}
                  >
                    <td className="food-table-name">
                      <img className="food-table-img" src={fr.foodInfo.img || fr.foodInfo.icon} alt="" width="24" height="24" onError={e => { e.target.style.display='none'; }} />
                      <span>{fr.foodInfo.name}</span>
                      {i === 0 && <span className="food-table-best-badge">Meilleur</span>}
                    </td>
                    <td className="food-table-qty">{fr.foodNeeded}</td>
                    <td className="food-table-time">{fr.totalTimeFmt}</td>
                    <td className="food-table-level">Lvl {fr.maxLevel}</td>
                    <td className="food-table-eff">
                      <span className={`food-table-eff-val ${fr.effectiveness >= 99 ? 'eff-perfect' : fr.effectiveness >= 80 ? 'eff-good' : 'eff-low'}`}>
                        {fr.effectiveness}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ── TIMERS & NARCOTIC PANEL ── */}
      {result && (
        <motion.div variants={itemVariants}>
          <TamingPanel result={result} dino={dino} level={level} />
        </motion.div>
      )}
    </motion.div>
  );
}
