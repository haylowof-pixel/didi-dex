import React from 'react';
import { motion } from 'framer-motion';

export default function TamingResults({ result, foodOverride, level }) {
  if (!result) return null;

  // If the user manually overrides food count, recalculate time
  const foodCount = foodOverride != null ? foodOverride : result.foodNeeded;
  const adjustedTime = foodOverride != null
    ? foodCount * result.secondsPerFood
    : result.totalTimeSeconds;
  const adjustedTimeFmt = foodOverride != null ? formatTimeSec(adjustedTime) : result.totalTimeFmt;

  const cards = [
    {
      icon: result.foodIcon,
      label: 'Nourriture',
      value: `${foodCount}x`,
      sub: result.foodName,
      cls: 'food',
    },
    {
      icon: '⏱️',
      label: 'Temps de taming',
      value: adjustedTimeFmt,
      sub: `${Math.round(adjustedTime).toLocaleString()}s total`,
      cls: 'time',
    },
    {
      icon: '💜',
      label: 'Torpeur max',
      value: result.maxTorpor.toLocaleString(),
      sub: `-${result.torporDrainPerMin}/min`,
      cls: 'torpor',
    },
    {
      icon: '💊',
      label: 'Narcotiques',
      value: result.narcoticsNeeded.toLocaleString(),
      sub: `ou ${result.narcoberriesNeeded.toLocaleString()} narcobaies`,
      cls: 'narco',
    },
    {
      icon: '⚡',
      label: 'Efficacité',
      value: `${result.effectiveness}%`,
      sub: `+${result.bonusLevels} niveaux bonus`,
      cls: 'time',
    },
    {
      icon: '☠️',
      label: 'Bio Toxine',
      value: result.bioToxinNeeded.toLocaleString(),
      sub: 'alternative',
      cls: 'narco',
    },
  ];

  // Use a key that changes when values change so React fully re-renders
  const resultKey = `${level}-${result.foodKey}-${foodCount}`;

  return (
    <div className="calc-section" key={resultKey}>
      <div className="calc-section-title">
        <span className="icon">📊</span> Résultats
        <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-muted)' }}>
          Niveau {level} — Torpeur drain: {result.totalTorporDrain.toLocaleString()} total
        </span>
      </div>
      <div className="results-grid">
        {cards.map((card, i) => (
          <motion.div
            key={`${card.label}-${resultKey}`}
            className={`result-card ${card.cls}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04, duration: 0.25 }}
            whileHover={{ y: -4, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
          >
            <div className="result-icon">{card.icon}</div>
            <div className="result-label">{card.label}</div>
            <div className="result-value">{card.value}</div>
            <div className="result-sub">{card.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Narcotics details table */}
      <table className="narco-table" style={{ marginTop: '16px' }}>
        <thead>
          <tr>
            <th>Type</th>
            <th>Quantité nécessaire</th>
            <th>Torpeur/unité</th>
            <th>Torpeur totale ajoutée</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>💊 Narcotique</td>
            <td style={{ fontWeight: 700, color: 'var(--success)', fontSize: '15px' }}>
              {result.narcoticsNeeded.toLocaleString()}
            </td>
            <td>+40</td>
            <td>{(result.narcoticsNeeded * 40).toLocaleString()}</td>
          </tr>
          <tr>
            <td>🫐 Narcobaie</td>
            <td style={{ fontWeight: 700, color: 'var(--torpor-color)', fontSize: '15px' }}>
              {result.narcoberriesNeeded.toLocaleString()}
            </td>
            <td>+7.5</td>
            <td>{(result.narcoberriesNeeded * 7.5).toLocaleString()}</td>
          </tr>
          <tr>
            <td>☠️ Bio Toxine</td>
            <td style={{ fontWeight: 700, color: 'var(--warning)', fontSize: '15px' }}>
              {result.bioToxinNeeded.toLocaleString()}
            </td>
            <td>+80</td>
            <td>{(result.bioToxinNeeded * 80).toLocaleString()}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function formatTimeSec(totalSeconds) {
  if (totalSeconds <= 0) return '0s';
  const s = Math.ceil(totalSeconds);
  const hours = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0) parts.push(`${mins}m`);
  if (secs > 0) parts.push(`${secs}s`);
  return parts.join(' ');
}
