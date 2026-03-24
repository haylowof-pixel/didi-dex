import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LogoIcon, CalculatorIcon, DnaIcon, TimerIcon, MapIcon, ScanIcon, WidgetIcon, ClipboardIcon, FarmingIcon, TamingLassoIcon, BuildingIcon, RaidIcon, TaskClipboardIcon, CheckIcon } from './Icons';

const FEATURES = [
  { Icon: CalculatorIcon, title: 'Taming Calculator', desc: 'Sélectionnez une créature dans la sidebar' },
  { Icon: DnaIcon,        title: 'ASB Breeding',      desc: 'Stat extractor, library, breeding planner', shortcut: 'Alt+B', action: () => window.api?.openBreeding() },
  { Icon: TimerIcon,      title: 'Timer Overlay',     desc: 'Timers flottants pendant le jeu',          shortcut: 'Alt+M', action: () => window.api?.openTimerOverlay() },
  { Icon: MapIcon,        title: 'Interactive Maps',   desc: 'Cartes interactives des maps ARK',         shortcut: 'Alt+G', action: () => window.api?.openMapsWindow('the-island', 'The Island') },
  { Icon: ScanIcon,       title: 'OCR Scanner',        desc: 'Capture & extraction automatique des stats', shortcut: 'Alt+S', action: () => window.api?.openOCR() },
  { Icon: WidgetIcon,     title: 'Widget Mini',        desc: 'Widget compact toujours visible',          shortcut: 'Alt+W', action: () => window.api?.openWidget() },
];

const CATEGORY_ICONS = {
  farming: FarmingIcon,
  taming: TamingLassoIcon,
  building: BuildingIcon,
  raid: RaidIcon,
  autre: TaskClipboardIcon,
};

const CATEGORY_COLORS = {
  farming: '#2dd4a0',
  taming: '#60a5fa',
  building: '#f59e0b',
  raid: '#ef4444',
  autre: '#9d8ff5',
};

const CATEGORY_LABELS = {
  farming: 'Récolte',
  taming: 'Taming',
  building: 'Construction',
  raid: 'Raid',
  autre: 'Autre',
};

const PRIORITY_COLORS = { haute: '#ef4444', moyenne: '#f59e0b', basse: '#2dd4a0' };
const PRIORITY_LABELS = { haute: 'Haute', moyenne: 'Moyenne', basse: 'Basse' };

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
        <div className="tribe-home-empty" onClick={() => window.api?.openTribe()}>
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
        <span>Tâches de Tribu</span>
        <span className="tribe-home-count">{pendingTasks.length} en attente</span>
        {doneTasks.length > 0 && (
          <span className="tribe-home-done">{doneTasks.length} terminée{doneTasks.length > 1 ? 's' : ''}</span>
        )}
        <button className="tribe-home-open" onClick={() => window.api?.openTribe()}>
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
            const catColor = CATEGORY_COLORS[task.category] || '#9d8ff5';
            const prioColor = PRIORITY_COLORS[task.priority] || '#888';

            return (
              <motion.div
                key={task.id}
                className="tribe-task-card"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 + i * 0.05 }}
                onClick={() => toggleTask(task.id)}
                title="Cliquer pour marquer comme terminée"
              >
                <div className="tribe-task-icon" style={{ color: catColor, background: catColor + '15' }}>
                  <CatIcon size={16} />
                </div>
                <div className="tribe-task-content">
                  <div className="tribe-task-title">{task.title}</div>
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
              </motion.div>
            );
          })}
          {pendingTasks.length > 6 && (
            <div className="tribe-tasks-more" onClick={() => window.api?.openTribe()}>
              +{pendingTasks.length - 6} autres tâches →
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default function WelcomeScreen() {
  return (
    <motion.div
      className="welcome-state"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3 }}
    >
      <div className="welcome-header">
        <div className="welcome-logo">
          <img src="./new-icon.png" alt="DIDI DEX" width="64" height="64" style={{ borderRadius: '12px' }} />
        </div>
        <h1 className="welcome-title">DIDI DEX</h1>
        <p className="welcome-sub">
          Votre outil tout-en-un pour ARK: Survival Ascended
        </p>
      </div>

      <TribeTasks />

      <div className="feature-grid">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            className={`feature-card ${f.action ? 'clickable' : 'highlight'}`}
            onClick={f.action || undefined}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.06, duration: 0.25 }}
            whileHover={f.action ? { scale: 1.02 } : {}}
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

      <div className="welcome-footer">
        <span className="kbd">Alt+O</span>
        <span>Mode Overlay</span>
        <span className="welcome-sep">·</span>
        <span className="kbd">Alt+T</span>
        <span>Afficher/Masquer</span>
      </div>
    </motion.div>
  );
}
