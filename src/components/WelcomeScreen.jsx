import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { LogoIcon, CalculatorIcon, DnaIcon, TimerIcon, MapIcon, ScanIcon, WidgetIcon, ClipboardIcon, FarmingIcon, TamingLassoIcon, BuildingIcon, RaidIcon, TaskClipboardIcon, CheckIcon } from './Icons';

/* ─── Background handled by global app-video-bg ─── */
function AnimatedCanvasBg() {
  return null;
}

/* ─── ARK Logo with animated effects ─── */
function ArkLogo() {
  return (
    <motion.div
      className="ark-logo-hero"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
    >
      <div className="ark-logo-glow-ring" />
      <div className="ark-logo-img-wrap">
        <img src="./icon.png" alt="ARK" className="ark-logo-img" />
        <div className="ark-logo-scan-line" />
      </div>
      <div className="ark-logo-label">
        <span className="ark-logo-text">OVERSEER</span>
        <span className="ark-logo-sub">Survival Companion</span>
      </div>
    </motion.div>
  );
}

const getFeatures = (onNavigate) => [
  { Icon: CalculatorIcon, title: 'Taming Calculator', desc: 'Sélectionnez une créature dans la sidebar' },
  { Icon: DnaIcon,        title: 'ASB Breeding',      desc: 'Stat extractor, library, breeding planner', shortcut: 'Alt+B', action: () => onNavigate?.('breeding') },
  { Icon: TimerIcon,      title: 'Timer Overlay',     desc: 'Timers flottants pendant le jeu',          shortcut: 'Alt+M', action: () => window.api?.openTimerOverlay() },
  { Icon: MapIcon,        title: 'Cartes Interactives', desc: 'Cartes interactives des maps ARK',         shortcut: 'Alt+G', action: () => onNavigate?.('maps') },
  { Icon: ScanIcon,       title: 'OCR Scanner',        desc: 'Capture & extraction automatique des stats', shortcut: 'Alt+S', action: () => onNavigate?.('ocr') },
  { Icon: WidgetIcon,     title: 'Widget Mini',        desc: 'Widget compact toujours visible',          shortcut: 'Alt+W', action: () => window.api?.openWidget() },
];

const CATEGORY_ICONS = {
  farming: FarmingIcon,
  taming: TamingLassoIcon,
  building: BuildingIcon,
  raid: RaidIcon,
  breeding: DnaIcon,
  autre: TaskClipboardIcon,
};

const CATEGORY_COLORS = {
  farming: '#2dd4a0',
  taming: '#60a5fa',
  building: '#f59e0b',
  raid: '#ef4444',
  breeding: '#d946ef',
  autre: '#97ADFF',
};

const CATEGORY_LABELS = {
  farming: 'Récolte',
  taming: 'Taming',
  building: 'Construction',
  raid: 'Raid',
  breeding: 'Élevage',
  autre: 'Autre',
};

const PRIORITY_COLORS = { haute: '#ef4444', moyenne: '#f59e0b', basse: '#2dd4a0' };
const PRIORITY_LABELS = { haute: 'Haute', moyenne: 'Moyenne', basse: 'Basse' };

function TaskItemRow({ item, taskId, itemIdx, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState('');
  const collected = item.collected || 0;
  const pct = Math.round((collected / item.qty) * 100);
  const isDone = collected >= item.qty;

  const increment = (amount) => {
    const newVal = Math.max(0, Math.min(collected + amount, item.qty));
    onUpdate(taskId, itemIdx, newVal);
  };

  const startEdit = () => {
    setEditVal(String(collected));
    setEditing(true);
  };

  const commitEdit = () => {
    let num = parseInt(editVal);
    if (isNaN(num) || num < 0) num = collected;
    if (num > item.qty) num = item.qty;
    onUpdate(taskId, itemIdx, num);
    setEditing(false);
  };

  return (
    <div className={`home-task-item ${isDone ? 'done' : ''}`}>
      <img
        className="home-task-item-icon"
        src={`https://ark.wiki.gg/images/thumb/${item.name.replace(/ /g, '_')}.png/20px-${item.name.replace(/ /g, '_')}.png`}
        alt=""
        onError={(e) => { e.target.style.display = 'none'; }}
        loading="lazy"
      />
      <span className="home-task-item-name" title={item.name}>
        {item.name}
      </span>
      <div className="home-task-item-controls">
        <button className="home-item-btn minus" onClick={(e) => { e.stopPropagation(); increment(-1); }}>−</button>
        {editing ? (
          <input
            className="home-item-inline-edit"
            type="number"
            value={editVal}
            onChange={(e) => setEditVal(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') setEditing(false); }}
            autoFocus
            min={0}
            max={item.qty}
          />
        ) : (
          <span className="home-item-progress" onClick={(e) => { e.stopPropagation(); startEdit(); }} title="Cliquer pour modifier">
            <span className={isDone ? 'val done' : 'val'}>{collected}</span>/{item.qty}
          </span>
        )}
        <button className="home-item-btn plus" onClick={(e) => { e.stopPropagation(); increment(1); }}>+</button>
        <button className="home-item-btn plus10" onClick={(e) => { e.stopPropagation(); increment(10); }}>+10</button>
      </div>
      <div className="home-task-item-bar">
        <div
          className="home-task-item-bar-fill"
          style={{
            width: `${pct}%`,
            background: isDone ? '#2dd4a0' : 'linear-gradient(90deg, #7B93F8, #60a5fa)'
          }}
        />
      </div>
    </div>
  );
}

function TribeTasks() {
  const [tribeData, setTribeData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (window.api?.loadTribeData) {
      window.api.loadTribeData().then(data => {
        setTribeData(data);
        setLoading(false);
      }).catch(() => setLoading(false));
    } else {
      setLoading(false);
    }

    // Refresh every 5s
    const interval = setInterval(() => {
      if (window.api?.loadTribeData) {
        window.api.loadTribeData().then(setTribeData).catch(() => {});
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const toggleTask = async (taskId) => {
    if (!tribeData?.tasks) return;
    const updated = {
      ...tribeData,
      tasks: tribeData.tasks.map(t => t.id === taskId ? { ...t, done: !t.done } : t),
    };
    setTribeData(updated);
    if (window.api?.saveTribeData) {
      await window.api.saveTribeData(updated);
    }
  };

  const updateItemCollected = async (taskId, itemIdx, newVal) => {
    if (!tribeData?.tasks) return;
    const updated = {
      ...tribeData,
      tasks: tribeData.tasks.map(t => {
        if (t.id !== taskId || !t.items) return t;
        const newItems = t.items.map((it, i) =>
          i === itemIdx ? { ...it, collected: newVal } : it
        );
        return { ...t, items: newItems };
      }),
    };
    setTribeData(updated);
    if (window.api?.saveTribeData) {
      await window.api.saveTribeData(updated);
    }
  };

  if (loading) return null;

  if (!tribeData?.tribeCode) {
    return (
      <motion.div
        className="tribe-home-section"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="tribe-home-header">
          <ClipboardIcon size={16} />
          <span>Tâches de Tribu</span>
        </div>
        <div className="tribe-home-empty" onClick={() => window.__navigate?.('tribe')}>
          <TaskClipboardIcon size={24} />
          <span>Rejoins ou crée une tribu pour voir les tâches ici</span>
          <span className="tribe-home-cta">Ouvrir le planificateur →</span>
        </div>
      </motion.div>
    );
  }

  const pendingTasks = (tribeData.tasks || []).filter(t => !t.done);
  const doneTasks = (tribeData.tasks || []).filter(t => t.done);

  // Sort by priority
  const priorityOrder = { haute: 0, moyenne: 1, basse: 2 };
  pendingTasks.sort((a, b) => (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2));

  return (
    <motion.div
      className="tribe-home-section"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <div className="tribe-home-header">
        <ClipboardIcon size={16} />
        <span>{tribeData.tribeName ? `⚔️ ${tribeData.tribeName}` : 'Tâches de Tribu'}</span>
        <span className="tribe-home-count">{pendingTasks.length} en attente</span>
        {doneTasks.length > 0 && (
          <span className="tribe-home-done">{doneTasks.length} terminée{doneTasks.length > 1 ? 's' : ''}</span>
        )}
        <button className="tribe-home-open" onClick={() => window.__navigate?.('tribe')}>
          Ouvrir ↗
        </button>
      </div>

      {pendingTasks.length === 0 ? (
        <div className="tribe-home-empty-done">
          <CheckIcon size={20} />
          <span>Toutes les tâches sont terminées !</span>
        </div>
      ) : (
        <div className="tribe-tasks-grid">
          {pendingTasks.slice(0, 6).map((task, i) => {
            const CatIcon = CATEGORY_ICONS[task.category] || TaskClipboardIcon;
            const catColor = CATEGORY_COLORS[task.category] || '#97ADFF';
            const prioColor = PRIORITY_COLORS[task.priority] || '#888';

            const hasItems = task.items && task.items.length > 0;
            const totalReq = hasItems ? task.items.reduce((s, it) => s + it.qty, 0) : 0;
            const totalCol = hasItems ? task.items.reduce((s, it) => s + Math.min(it.collected || 0, it.qty), 0) : 0;
            const taskPct = totalReq > 0 ? Math.round((totalCol / totalReq) * 100) : 0;

            return (
              <motion.div
                key={task.id}
                className="tribe-task-card"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 + i * 0.05 }}
                style={{ borderLeft: `3px solid ${catColor}` }}
              >
                <div className="tribe-task-card-header" onClick={() => toggleTask(task.id)} title="Cliquer pour marquer comme terminée">
                  <div className="tribe-task-icon" style={{ color: catColor, background: catColor + '15' }}>
                    <CatIcon size={16} />
                  </div>
                  <div className="tribe-task-content">
                    <div className="tribe-task-title-row">
                      <div className="tribe-task-title">{task.title}</div>
                      {hasItems && (
                        <span className="tribe-task-pct" style={{ color: taskPct >= 100 ? '#2dd4a0' : '#97ADFF' }}>
                          {taskPct}%
                        </span>
                      )}
                    </div>
                    <div className="tribe-task-meta">
                      <span className="tribe-task-cat" style={{ color: catColor }}>
                        {CATEGORY_LABELS[task.category] || task.category}
                      </span>
                      <span className="tribe-task-prio" style={{ background: prioColor + '20', color: prioColor }}>
                        {PRIORITY_LABELS[task.priority] || task.priority}
                      </span>
                      {task.author && <span className="tribe-task-author">par {task.author}</span>}
                    </div>
                  </div>
                  <div className="tribe-task-check">
                    <CheckIcon size={14} />
                  </div>
                </div>
                {hasItems && (
                  <div className="tribe-task-items">
                    {task.items.slice(0, 4).map((item, idx) => (
                      <TaskItemRow
                        key={idx}
                        item={item}
                        taskId={task.id}
                        itemIdx={idx}
                        onUpdate={updateItemCollected}
                      />
                    ))}
                    {task.items.length > 4 && (
                      <div className="tribe-task-items-more" onClick={() => window.__navigate?.('tribe')}>
                        +{task.items.length - 4} items →
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
          {pendingTasks.length > 6 && (
            <div className="tribe-tasks-more" onClick={() => window.__navigate?.('tribe')}>
              +{pendingTasks.length - 6} autres tâches →
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

function QuickStats() {
  const [stats, setStats] = useState({ creatures: 0, timers: 0 });

  useEffect(() => {
    // Load breeding data count
    if (window.api?.loadBreedingData) {
      window.api.loadBreedingData().then(data => {
        if (data?.creatures) setStats(s => ({ ...s, creatures: data.creatures.length }));
      }).catch(() => {});
    }
  }, []);

  return (
    <motion.div
      className="quick-stats"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
    >
      <div className="quick-stat" onClick={() => window.__navigate?.('breeding')}>
        <div className="quick-stat-icon" style={{ background: 'rgba(217,70,239,0.1)', color: '#d946ef' }}>
          <DnaIcon size={16} />
        </div>
        <div className="quick-stat-val">{stats.creatures}</div>
        <div className="quick-stat-label">Créatures</div>
      </div>
      <div className="quick-stat" onClick={() => window.api?.openTimerOverlay()}>
        <div className="quick-stat-icon" style={{ background: 'rgba(96,165,250,0.1)', color: '#60a5fa' }}>
          <TimerIcon size={16} />
        </div>
        <div className="quick-stat-val">—</div>
        <div className="quick-stat-label">Timers</div>
      </div>
      <div className="quick-stat" onClick={() => window.__navigate?.('maps')}>
        <div className="quick-stat-icon" style={{ background: 'rgba(45,212,160,0.1)', color: '#2dd4a0' }}>
          <MapIcon size={16} />
        </div>
        <div className="quick-stat-val">🗺️</div>
        <div className="quick-stat-label">Cartes</div>
      </div>
      <div className="quick-stat" onClick={() => window.__navigate?.('ocr')}>
        <div className="quick-stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
          <ScanIcon size={16} />
        </div>
        <div className="quick-stat-val">F8</div>
        <div className="quick-stat-label">Scanner</div>
      </div>
    </motion.div>
  );
}

export default function WelcomeScreen({ onNavigate }) {
  const FEATURES = getFeatures(onNavigate);
  // Expose navigate for TribeTasks
  window.__navigate = onNavigate;
  return (
    <motion.div
      className="welcome-state"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4 }}
    >
      {/* Animated canvas background */}
      <AnimatedCanvasBg />

      {/* ARK Logo — no banner, just the logo */}
      <ArkLogo />

      {/* Quick Stats */}
      <QuickStats />

      {/* Tribe Tasks */}
      <TribeTasks />

      {/* Feature Grid */}
      <motion.div
        className="feature-section-title"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        Outils
      </motion.div>
      <div className="feature-grid">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            className={`feature-card ${f.action ? 'clickable' : 'highlight'}`}
            onClick={f.action || undefined}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 + i * 0.05, duration: 0.25 }}
            whileHover={f.action ? { scale: 1.02, y: -2 } : {}}
            whileTap={f.action ? { scale: 0.98 } : {}}
          >
            <div className="feature-icon-wrap">
              <f.Icon size={18} />
            </div>
            <div className="feature-info">
              <div className="feature-title">{f.title}</div>
              <div className="feature-desc">{f.desc}</div>
            </div>
            {f.shortcut && <span className="kbd">{f.shortcut}</span>}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
