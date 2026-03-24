import React from 'react';
import { DnaIcon, TimerIcon, MapIcon, ScanIcon, WidgetIcon, SettingsIcon, LayersIcon } from './Icons';

const TOOLS = [
  { key: 'breeding', Icon: DnaIcon,      label: 'Breeding', shortcut: 'Alt+B', action: () => window.api?.openBreeding() },
  { key: 'timer',    Icon: TimerIcon,    label: 'Timer',    shortcut: 'Alt+M', action: () => window.api?.openTimerOverlay() },
  { key: 'maps',     Icon: MapIcon,      label: 'Maps',     shortcut: 'Alt+G', action: () => window.api?.openMapsWindow('the-island', 'The Island') },
  { key: 'ocr',      Icon: ScanIcon,     label: 'OCR',      shortcut: 'Alt+S', action: () => window.api?.openOCR() },
  { key: 'widget',   Icon: WidgetIcon,   label: 'Widget',   shortcut: 'Alt+W', action: () => window.api?.openWidget() },
  { key: 'settings', Icon: SettingsIcon, label: 'Settings', shortcut: '',      action: () => window.api?.openSettings() },
];

export default function OverlayControls({ isOverlay, onToggleOverlay, opacity, onOpacityChange }) {
  return (
    <div className="overlay-controls">
      <div className="tool-buttons">
        {TOOLS.map(t => (
          <button
            key={t.key}
            className="tool-btn"
            onClick={t.action}
            title={t.shortcut ? `${t.label} (${t.shortcut})` : t.label}
          >
            <t.Icon size={14} />
            <span className="tool-btn-label">{t.label}</span>
          </button>
        ))}
      </div>

      <div className="overlay-controls-right">
        <button
          className={`overlay-btn ${isOverlay ? 'active' : ''}`}
          onClick={onToggleOverlay}
        >
          <LayersIcon size={12} />
          <span>Overlay</span>
        </button>

        {isOverlay && (
          <div className="opacity-control">
            <span className="opacity-label">Opacité</span>
            <input
              type="range"
              className="opacity-slider"
              min="0.3" max="1" step="0.05"
              value={opacity}
              onChange={e => onOpacityChange(parseFloat(e.target.value))}
            />
            <span className="opacity-label">{Math.round(opacity * 100)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
