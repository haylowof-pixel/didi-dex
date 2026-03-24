import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CATEGORIES } from '../data/dinosaurs';
import { getCreatureIconUrl } from '../data/creatureIcons';

const ALL_CATEGORIES = ['All', ...Object.values(CATEGORIES)];

export default function Sidebar({ dinosaurs, selectedDino, onSelectDino }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const filtered = useMemo(() => {
    let list = dinosaurs;
    if (category !== 'All') {
      list = list.filter(d => d.category === category);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(d =>
        d.name.toLowerCase().includes(q) ||
        (d.aka && d.aka.toLowerCase().includes(q))
      );
    }
    return list;
  }, [dinosaurs, search, category]);

  return (
    <div className="sidebar">
      {/* Search */}
      <div className="sidebar-header">
        <div className="search-container">
          <svg className="search-svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            type="text"
            className="search-input"
            placeholder="Rechercher..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="search-clear" onClick={() => setSearch('')}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          )}
        </div>
      </div>

      {/* Category chips */}
      <div className="category-filters">
        {ALL_CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`cat-chip ${category === cat ? 'active' : ''}`}
            onClick={() => setCategory(cat)}
          >
            {cat === 'All' ? 'Tous' : cat}
          </button>
        ))}
      </div>

      {/* Count */}
      <div className="sidebar-count">
        {filtered.length} cr&eacute;ature{filtered.length !== 1 ? 's' : ''}
      </div>

      {/* List */}
      <div className="dino-list">
        <AnimatePresence>
          {filtered.map((dino, i) => (
            <motion.div
              key={dino.id}
              className={`dino-list-item ${selectedDino?.id === dino.id ? 'active' : ''}`}
              onClick={() => onSelectDino(dino)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: Math.min(i * 0.015, 0.3), duration: 0.15 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="dino-icon">
                <img
                  src={getCreatureIconUrl(dino.name)}
                  alt={dino.name}
                  width={28}
                  height={28}
                  style={{ objectFit: 'contain' }}
                  onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'inline'; }}
                />
                <span style={{ display: 'none' }}>{dino.icon}</span>
              </div>
              <div className="dino-info">
                <div className="dino-name">{dino.name}</div>
                <div className="dino-meta">
                  <span className={`dino-badge badge-${dino.category.toLowerCase()}`}>{dino.category}</span>
                  <span className={`dino-badge badge-${dino.tamingMethod === 'Knockout' ? 'knockout' : dino.tamingMethod === 'Passive' ? 'passive' : 'notame'}`}>{dino.tamingMethod}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="sidebar-empty">
            Aucun dinosaure trouv&eacute;
          </div>
        )}
      </div>
    </div>
  );
}
