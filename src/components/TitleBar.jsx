import React, { useState, useEffect, useCallback } from 'react';
import AnimatedAppIcon from './AnimatedAppIcon';
import {
  TekAccountIcon,
  TekBreedingIcon,
  TekMapIcon,
  TekOverlayIcon,
  TekServerIcon,
  TekSettingsIcon,
  TekTimerIcon,
  TekTributeIcon,
  TekWidgetIcon,
} from './Icons';

// Tools that navigate within the main window
const NAV_TOOLS = [
  { key: 'extractor', Icon: TekBreedingIcon, label: 'Smart Breeding', shortcut: 'Alt+B' },
  { key: 'tribute',  Icon: TekTributeIcon, label: 'Tribut', shortcut: '' },
  { key: 'maps',     Icon: TekMapIcon, label: 'Cartes', shortcut: 'Alt+G' },
  { key: 'servers',  Icon: TekServerIcon, label: 'Serveurs', shortcut: '' },
];

// Tools that still open separate windows (overlays that need to float)
const WINDOW_TOOLS = [
  { key: 'timer',  Icon: TekTimerIcon, label: 'Timer Overlay', shortcut: 'Alt+M', action: () => window.api?.openTimerOverlay() },
  { key: 'widget', Icon: TekWidgetIcon, label: 'Widget Mini', shortcut: 'Alt+W', action: () => window.api?.openWidget() },
  { key: 'lookup', Icon: TekOverlayIcon, label: 'Quick Lookup', shortcut: 'Alt+L', action: () => window.api?.openQuickLookup() },
];

export default function TitleBar({ onGoHome, activePage, onNavigate }) {
  const minimize = () => window.api?.minimize();
  const maximize = () => window.api?.maximize();
  const close = () => window.api?.close();

  return (
    <>
      <div className="title-bar">
        {/* Left: Logo + Home */}
        <div className="title-bar-left">
          <button className={`tb-home ${activePage === null ? 'active' : ''}`} onClick={onGoHome} title="Accueil">
            <AnimatedAppIcon className="app-icon-animated-sm" imgProps={{ width: 18, height: 18, style: { borderRadius: '4px' } }} />
            <span className="title-bar-brand">OVERSEER</span>
            <span className="title-bar-subbrand">Terminal Tek</span>
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
              <span className="tb-tool-label">{t.label}</span>
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
              <span className="tb-tool-label">{t.label}</span>
            </button>
          ))}

          <div className="tb-sep" />

          <button
            className={`tb-tool ${activePage === 'account' ? 'active' : ''}`}
            onClick={() => onNavigate('account')}
            title="Account & Billing"
          >
            <TekAccountIcon size={13} />
            <span className="tb-tool-label">Compte</span>
          </button>

          <button
            className={`tb-tool ${activePage === 'settings' ? 'active' : ''}`}
            onClick={() => onNavigate('settings')}
            title="Paramètres"
          >
            <TekSettingsIcon size={13} />
            <span className="tb-tool-label">Paramètres</span>
          </button>
        </div>

        <button className="tb-profile-hub" onClick={() => onNavigate('account')} title="Profil survivant">
          <span className="tb-avatar">
            <AnimatedAppIcon className="app-icon-animated-avatar" src="./icon-128.png" alt="" />
          </span>
          <span className="tb-profile-copy">
            <span className="tb-profile-name">Survivor</span>
            <span className="tb-profile-meta">Local profile</span>
          </span>
          <span className="tb-profile-pulse" />
        </button>
      </div>

      <div className="window-title-strip">
        <div className="window-title-brand">
          <AnimatedAppIcon className="window-title-icon" imgProps={{ width: 16, height: 16 }} />
          <span>OVERSEER</span>
        </div>
        <div className="window-drag-strip" aria-hidden="true" />
        <div className="title-bar-controls">
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
    </>
  );
}
