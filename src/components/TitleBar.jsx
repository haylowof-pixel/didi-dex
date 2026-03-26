import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { LogoIcon, DnaIcon, TimerIcon, MapIcon, ScanIcon, WidgetIcon, SettingsIcon, LayersIcon, ClipboardIcon } from './Icons';

/* ── Sun / Moon SVG icons for theme toggle ── */
const SunIcon = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1"  x2="12" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22"  x2="5.64" y2="5.64"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1"  y1="12" x2="3"  y2="12"/>
    <line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22"  y1="19.78" x2="5.64"  y2="18.36"/>
    <line x1="18.36" y1="5.64"  x2="19.78" y2="4.22"/>
  </svg>
);

const MoonIcon = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
  </svg>
);

// Tools that navigate within the main window
const NAV_TOOLS = [
  { key: 'breeding', Icon: DnaIcon,       label: 'Breeding',    shortcut: 'Alt+B' },
  { key: 'tribe',    Icon: ClipboardIcon, label: 'Tribu Tasks', shortcut: '' },
  { key: 'maps',     Icon: MapIcon,       label: 'Cartes',      shortcut: 'Alt+G' },
  { key: 'ocr',      Icon: ScanIcon,      label: 'OCR Scanner', shortcut: 'Alt+S' },
];

// Tools that still open separate windows (overlays that need to float)
const WINDOW_TOOLS = [
  { key: 'timer',  Icon: TimerIcon,  label: 'Timer Overlay', shortcut: 'Alt+M', action: () => window.api?.openTimerOverlay() },
  { key: 'widget', Icon: WidgetIcon, label: 'Widget Mini',   shortcut: 'Alt+W', action: () => window.api?.openWidget() },
];

export default function TitleBar({ isOverlay, onToggleOverlay, onGoHome, activePage, onNavigate, lightTheme, onToggleTheme }) {
  const minimize = () => window.api?.minimize();
  const maximize = () => window.api?.maximize();
  const close = () => window.api?.close();

  return (
    <div className="title-bar">
      {/* Left: Logo + Home */}
      <div className="title-bar-left">
        <button className="tb-home" onClick={onGoHome} title="Accueil">
          <img src="./new-icon.png" alt="OVERSEER" width="18" height="18" style={{ borderRadius: '4px' }} />
          <span className="title-bar-brand">OVERSEER</span>
        </button>
      </div>

      {/* Center: Tool buttons */}
      <div className="tb-tools">
        {/* Nav tools — navigate within the app */}
        {NAV_TOOLS.map(t => (
          <button
            key={t.key}
            className={`tb-tool ${activePage === t.key ? 'active' : ''}`}
            onClick={() => onNavigate(t.key)}
            title={t.shortcut ? `${t.label} (${t.shortcut})` : t.label}
          >
            <t.Icon size={13} />
          </button>
        ))}

        <div className="tb-sep" />

        {/* Window tools — open separate windows */}
        {WINDOW_TOOLS.map(t => (
          <button
            key={t.key}
            className="tb-tool"
            onClick={t.action}
            title={t.shortcut ? `${t.label} (${t.shortcut})` : t.label}
          >
            <t.Icon size={13} />
          </button>
        ))}

        <div className="tb-sep" />

        <button
          className={`tb-tool ${activePage === 'settings' ? 'active' : ''}`}
          onClick={() => onNavigate('settings')}
          title="Paramètres"
        >
          <SettingsIcon size={13} />
        </button>

        <button
          className="tb-theme-toggle"
          onClick={onToggleTheme}
          title={lightTheme ? 'Mode sombre' : 'Mode clair'}
        >
          {lightTheme ? <MoonIcon size={12} /> : <SunIcon size={12} />}
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
