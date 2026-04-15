import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { DnaIcon, TimerIcon, MapIcon, SettingsIcon, LayersIcon, ClipboardIcon, ServerIcon } from './Icons';

// Tools that navigate within the main window
const NAV_TOOLS = [
  { key: 'breeding', Icon: DnaIcon,       label: 'Breeding',    shortcut: 'Alt+B' },
  { key: 'tribe',    Icon: ClipboardIcon, label: 'Tribu Tasks', shortcut: '' },
  { key: 'maps',     Icon: MapIcon,       label: 'Cartes',      shortcut: 'Alt+G' },
  { key: 'servers',  Icon: ServerIcon,    label: 'Serveurs',    shortcut: '' },
];

export default function TitleBar({ isOverlay, onToggleOverlay, onGoHome, activePage, onNavigate }) {
  const [timerOpen, setTimerOpen] = useState(false);

  useEffect(() => {
    window.api?.isTimerOpen?.()?.then?.(setTimerOpen);
    // Keep local state in sync when timer is closed from within the timer window
    window.api?.onTimerPinChanged?.(() => {});
  }, []);

  // Sync timerOpen when the timer window closes itself
  useEffect(() => {
    const interval = setInterval(() => {
      window.api?.isTimerOpen?.()?.then?.(v => setTimerOpen(!!v));
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const toggleTimer = useCallback(() => {
    if (timerOpen) {
      window.api?.closeTimerOverlay?.();
      setTimerOpen(false);
    } else {
      window.api?.openTimerOverlay?.();
      setTimerOpen(true);
    }
  }, [timerOpen]);

  const minimize = () => window.api?.minimize();
  const maximize = () => window.api?.maximize();
  const close = () => window.api?.close();

  return (
    <div className="title-bar">
      {/* Left: Logo + Home */}
      <div className="title-bar-left">
        <button className="tb-home" onClick={onGoHome} title="Accueil">
          <img src="./icon.png" alt="OVERSEER" width="18" height="18" style={{ borderRadius: '4px' }} />
          <span className="title-bar-brand">OVERSEER</span>
        </button>
      </div>

      {/* Center: Tool buttons */}
      <div className="tb-tools">
        {NAV_TOOLS.map(t => (
          <button
            key={t.key}
            className={`tb-tool ${activePage === t.key ? 'active' : ''}`}
            onClick={() => onNavigate(t.key)}
            title={t.shortcut ? `${t.label} (${t.shortcut})` : t.label}
          >
            <t.Icon size={14} />
          </button>
        ))}

        <div className="tb-sep" />

        <button
          className={`tb-tool ${timerOpen ? 'active' : ''}`}
          onClick={toggleTimer}
          title="Timer Overlay (Alt+M)"
        >
          <TimerIcon size={14} />
        </button>

        <div className="tb-sep" />

        <button
          className={`tb-tool ${activePage === 'settings' ? 'active' : ''}`}
          onClick={() => onNavigate('settings')}
          title="Paramètres"
        >
          <SettingsIcon size={14} />
        </button>

        <button
          className={`tb-overlay-toggle ${isOverlay ? 'active' : ''}`}
          onClick={onToggleOverlay}
          title="Mode Overlay (Alt+O)"
        >
          <LayersIcon size={11} />
          <span>Overlay</span>
        </button>
      </div>

      {/* Right: Window controls */}
      <div className="title-bar-controls">
        {isOverlay && (
          <motion.div
            className="overlay-badge"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            OVERLAY
          </motion.div>
        )}
        <button className="title-btn" onClick={minimize} title="Minimiser">
          <svg width="10" height="1" viewBox="0 0 10 1"><rect fill="currentColor" width="10" height="1" rx="0.5"/></svg>
        </button>
        <button className="title-btn" onClick={maximize} title="Maximiser">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><rect x="0.5" y="0.5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1"/></svg>
        </button>
        <button className="title-btn close" onClick={close} title="Fermer">
          <svg width="10" height="10" viewBox="0 0 10 10"><path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
        </button>
      </div>
    </div>
  );
}
