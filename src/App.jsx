import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import PublicWebsite from './components/PublicWebsite';
import { dinosaurs } from './data/dinosaurs';

// Lazy-loaded components for faster startup
const DinoDetail = lazy(() => import('./components/DinoDetail'));
const WelcomeScreen = lazy(() => import('./components/WelcomeScreen'));
const StatsExtractor = lazy(() => import('./components/StatsExtractor'));
const AccountBilling = lazy(() => import('./components/AccountBilling'));
const TributePlanner = lazy(() => import('./components/TributePlanner'));
const AppSettings = lazy(() => import('./components/AppSettings'));

const SHELL_BASE = window.location.protocol === 'file:' ? '../shell' : './shell';

// Pages that embed shell HTML files
const EMBEDDED_PAGES = {
  maps:     { src: `${SHELL_BASE}/maps-window.html`,     label: 'Cartes' },
  servers:  { src: `${SHELL_BASE}/server-status.html`,     label: 'Serveurs' },
  comparator: { src: `${SHELL_BASE}/comparator-window.html`, label: 'Comparateur' },
};

const LOCAL_PAGES = new Set(['extractor', 'account', 'tribute', 'settings']);
const PAGE_ALIASES = {
  breeding: 'extractor',
  ocr: 'extractor',
  tribe: 'tribute',
};

function parseStoredArray(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getInitialPage() {
  const rawPage = window.location.hash.replace(/^#/, '').split(':')[0];
  const page = PAGE_ALIASES[rawPage] || rawPage;
  return EMBEDDED_PAGES[page] || LOCAL_PAGES.has(page) ? page : null;
}

function canonicalizeLegacyHash() {
  if (window.location.hash === '#breeding') {
    window.location.hash = 'extractor:planner';
    return true;
  }
  if (window.location.hash === '#ocr') {
    window.location.hash = 'extractor';
    return true;
  }
  if (window.location.hash === '#tribe') {
    window.location.hash = 'tribute:tasks';
    return true;
  }
  return false;
}

const THEME_KEY = 'overseer-ui-theme';
const DEFAULT_UI_THEME = 'blackglass';
const THEME_DEFAULT_MIGRATION_KEY = 'overseer-ui-theme-default-blackglass-v2';

function loadUiTheme() {
  try {
    const storedTheme = localStorage.getItem(THEME_KEY);
    const migratedDefault = localStorage.getItem(THEME_DEFAULT_MIGRATION_KEY);
    if (!storedTheme) return DEFAULT_UI_THEME;
    if ((storedTheme === 'overseer' || storedTheme === 'mutagen') && !migratedDefault) {
      localStorage.setItem(THEME_KEY, DEFAULT_UI_THEME);
      localStorage.setItem(THEME_DEFAULT_MIGRATION_KEY, '1');
      return DEFAULT_UI_THEME;
    }
    return storedTheme;
  } catch {
    return DEFAULT_UI_THEME;
  }
}

function saveUiTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
    localStorage.setItem(THEME_DEFAULT_MIGRATION_KEY, '1');
  } catch {}
}

// CSS injected into each webview to hide its title bar
const EMBED_CSS = `
  :root {
    --accent: #5fe4ff !important;
    --accent-l: #c7f6ff !important;
    --accent-d: #2fb7d4 !important;
    --accent-bg: rgba(95,228,255,0.10) !important;
    --accent-border: rgba(95,228,255,0.25) !important;
    --accent-glow: rgba(95,228,255,0.18) !important;
    --blue: #5fe4ff !important;
    --pink: #5fe4ff !important;
    --purple: #5fe4ff !important;
  }
  #breed-bar, #maps-bar, #ocr-bar, #cmp-bar, #srv-bar, #titlebar, #mini-bar, #appbar,
  .bar, .title-bar {
    display: none !important;
  }
  html, body {
    overflow: auto !important;
    height: 100% !important;
    background: #02070c !important;
    color: #eefaff !important;
  }
  #app {
    height: 100% !important;
  }
  body::before {
    content: "" !important;
    position: fixed !important;
    inset: 0 !important;
    pointer-events: none !important;
    z-index: 0 !important;
    background:
      radial-gradient(circle at 74% 8%, rgba(95,228,255,0.16), transparent 30rem),
      radial-gradient(circle at 18% 28%, rgba(95,228,255,0.12), transparent 28rem),
      linear-gradient(rgba(95,228,255,0.028) 1px, transparent 1px),
      linear-gradient(90deg, rgba(95,228,255,0.018) 1px, transparent 1px) !important;
    background-size: auto, auto, 58px 58px, 58px 58px !important;
    opacity: 0.58 !important;
  }
  a, .accent, [class*="accent"] {
    color: #c7f6ff !important;
  }
  ::selection {
    background: rgba(95,228,255,0.28) !important;
    color: #ffffff !important;
  }
  ::-webkit-scrollbar-thumb {
    background: rgba(95,228,255,0.18) !important;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: rgba(95,228,255,0.34) !important;
  }
  #app, .main, #main-wrap, #content, .content, .srv-content, .maps-content {
    position: relative !important;
    z-index: 1 !important;
  }
  .video-bg, #bgVideo, video, .video-overlay, .bg-bubbles {
    position: fixed !important;
    z-index: 0 !important;
    pointer-events: none !important;
  }
  button, input, select, textarea {
    font-family: inherit !important;
  }
  input, select, textarea {
    background: rgba(0,0,0,0.46) !important;
    color: #eefaff !important;
    border: 1px solid rgba(95,228,255,0.18) !important;
    border-radius: 9px !important;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.05) !important;
  }
  button {
    border-radius: 9px !important;
    border: 1px solid rgba(95,228,255,0.16) !important;
    background:
      linear-gradient(145deg, rgba(255,255,255,0.055), rgba(255,255,255,0.018)),
      rgba(2,10,16,0.58) !important;
    color: #e9fbff !important;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.055), 0 10px 24px rgba(0,0,0,0.24) !important;
  }
  button:hover {
    border-color: rgba(95,228,255,0.32) !important;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), 0 0 22px rgba(95,228,255,0.12), 0 14px 30px rgba(0,0,0,0.34) !important;
  }
  .srv-tab.active, .srv-filter-btn.active, .sb-tab.active, .scale-preset.active,
  .sound-preset.active, .size-btn.active, .tts-toggle.active,
  .sex-btn.active-male, .sex-btn.active-female {
    background:
      linear-gradient(135deg, rgba(95,228,255,0.12), rgba(95,228,255,0.08)),
      rgba(2,10,16,0.64) !important;
    border-color: rgba(95,228,255,0.32) !important;
    color: #c7f6ff !important;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.06), 0 0 20px rgba(95,228,255,0.10) !important;
  }
  .srv-players-bar-fill, .update-progress-fill, .task-item-bar-fill, .progress-fill,
  [class*="progress"][class*="fill"], [class*="bar-fill"] {
    background: linear-gradient(90deg, #5fe4ff, #5fe4ff) !important;
    box-shadow: 0 0 14px rgba(95,228,255,0.18) !important;
  }
  .srv-card, .srv-fav-card, .map-item, .kb-row, .about-row {
    background:
      linear-gradient(90deg, rgba(95,228,255,0.055), rgba(0,0,0,0.18) 34%, rgba(0,0,0,0.28)),
      rgba(1,8,13,0.56) !important;
  }
  .srv-card:hover, .srv-fav-card:hover, .map-item:hover, .kb-row:hover, .about-row:hover {
    background:
      linear-gradient(90deg, rgba(95,228,255,0.085), rgba(0,0,0,0.18) 42%, rgba(0,0,0,0.26)),
      rgba(2,12,18,0.66) !important;
  }
  .card, .panel, .section, .content, .map-card, .server-card, .settings-card,
  .srv-card, .srv-fav-card, .kb-row, .about-row, .setting-row, .species-header,
  .stat-row, .paste-zone, .scan-placeholder, .shared-marker-card,
  [class*="card"], [class*="panel"], [class*="section"], [class*="row"] {
    border-color: rgba(95,228,255,0.16) !important;
    background:
      linear-gradient(145deg, rgba(255,255,255,0.052), rgba(255,255,255,0.018) 38%, rgba(0,0,0,0.22)),
      radial-gradient(circle at 8% 0%, rgba(95,228,255,0.12), transparent 28rem),
      rgba(2,8,14,0.62) !important;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.055), 0 18px 48px rgba(0,0,0,0.32) !important;
    backdrop-filter: blur(16px) saturate(1.12) !important;
  }
  @property --tek-flow-angle {
    syntax: "<angle>";
    inherits: false;
    initial-value: 0deg;
  }
  @keyframes tekFlowBorder {
    to { --tek-flow-angle: 360deg; }
  }
  @keyframes tekSurfaceSweep {
    0% { transform: translateX(-130%); opacity: 0; }
    18% { opacity: 0.48; }
    56% { opacity: 0.18; }
    100% { transform: translateX(130%); opacity: 0; }
  }
  :root {
    --accent: #9d70ff !important;
    --accent-l: #fff0b8 !important;
    --accent-d: #6f54ff !important;
    --accent-bg: rgba(157,112,255,0.13) !important;
    --accent-border: rgba(232,190,92,0.22) !important;
    --accent-glow: rgba(157,112,255,0.20) !important;
    --blue: #68b8ff !important;
    --pink: #9d70ff !important;
    --purple: #9d70ff !important;
    --gold: #e8be5c !important;
    --text-0: #f4f7ff !important;
    --text-1: #d9def0 !important;
    --text-2: #9ea7c0 !important;
    --border-0: rgba(157,112,255,0.15) !important;
    --border-1: rgba(232,190,92,0.16) !important;
  }
  html, body {
    background:
      radial-gradient(circle at 18% 8%, rgba(157,112,255,0.20), transparent 34rem),
      radial-gradient(circle at 82% 12%, rgba(232,190,92,0.10), transparent 28rem),
      radial-gradient(circle at 72% 78%, rgba(104,184,255,0.12), transparent 30rem),
      #02030a !important;
    color: #f4f7ff !important;
  }
  body::before {
    background:
      radial-gradient(circle at 74% 8%, rgba(232,190,92,0.12), transparent 28rem),
      radial-gradient(circle at 18% 28%, rgba(157,112,255,0.15), transparent 30rem),
      linear-gradient(rgba(104,184,255,0.030) 1px, transparent 1px),
      linear-gradient(90deg, rgba(232,190,92,0.018) 1px, transparent 1px) !important;
    background-size: auto, auto, 64px 64px, 64px 64px !important;
    opacity: 0.72 !important;
  }
  #app::after, .main::after, #content::after, .content::after {
    content: "" !important;
    position: fixed !important;
    inset: 0 !important;
    pointer-events: none !important;
    z-index: 0 !important;
    background:
      linear-gradient(110deg, transparent 0 42%, rgba(232,190,92,0.035) 48%, transparent 55%),
      radial-gradient(circle at 50% 0%, rgba(157,112,255,0.06), transparent 26rem) !important;
    mix-blend-mode: screen !important;
    animation: none !important;
    opacity: 0.28 !important;
  }
  button,
  .srv-tab, .srv-filter-btn, .sb-tab, .scale-preset, .sound-preset, .size-btn, .tts-toggle,
  .filter-btn, .tab-btn, .task-opt-btn, .scan-btn, .bar-btn {
    border: 1px solid rgba(157,112,255,0.18) !important;
    background:
      linear-gradient(145deg, rgba(255,255,255,0.060), rgba(255,255,255,0.016)),
      radial-gradient(circle at 20% 0%, rgba(157,112,255,0.11), transparent 14rem),
      rgba(5,6,18,0.62) !important;
    color: #eef2ff !important;
  }
  button:hover,
  .srv-tab:hover, .srv-filter-btn:hover, .sb-tab:hover, .scale-preset:hover, .sound-preset:hover, .size-btn:hover,
  .filter-btn:hover, .tab-btn:hover, .task-opt-btn:hover, .scan-btn:hover, .bar-btn:hover {
    border-color: rgba(232,190,92,0.28) !important;
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,0.08),
      0 0 24px rgba(157,112,255,0.15),
      0 12px 30px rgba(0,0,0,0.34) !important;
  }
  .srv-tab.active, .srv-filter-btn.active, .sb-tab.active, .scale-preset.active,
  .sound-preset.active, .size-btn.active, .tts-toggle.active,
  .filter-btn.active, .tab-btn.active, .task-opt-btn.active,
  .bar-btn.active, .cat-chip.active, .dino-list-item.active, .ase-tabs button.active,
  .ase-mode-switch button.active, .ase-swatch-grid button.active,
  .sex-btn.active-male, .sex-btn.active-female {
    --tek-flow-angle: 0deg;
    border: 1px solid transparent !important;
    background:
      linear-gradient(180deg, rgba(8,9,24,0.96), rgba(4,5,15,0.96)) padding-box,
      conic-gradient(from var(--tek-flow-angle), rgba(232,190,92,0.96), rgba(157,112,255,0.88), rgba(104,184,255,0.38), rgba(157,112,255,0.88), rgba(232,190,92,0.96)) border-box !important;
    color: #fff4c8 !important;
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,0.08),
      0 0 22px rgba(157,112,255,0.18),
      0 0 12px rgba(232,190,92,0.10) !important;
    animation: tekFlowBorder 3.4s linear infinite !important;
  }
  .srv-players-bar-fill, .update-progress-fill, .task-item-bar-fill, .progress-fill,
  [class*="progress"][class*="fill"], [class*="bar-fill"] {
    background: linear-gradient(90deg, #9d70ff, #e8be5c 52%, #68b8ff) !important;
    box-shadow: 0 0 18px rgba(157,112,255,0.20), 0 0 12px rgba(232,190,92,0.12) !important;
  }
  .card, .panel, .section, .content, .map-card, .server-card, .settings-card,
  .srv-card, .srv-fav-card, .kb-row, .about-row, .setting-row, .species-header,
  .stat-row, .paste-zone, .scan-placeholder, .shared-marker-card,
  .timer-card, .food-card, .task-card, .template-card, .marker-modal,
  [class*="card"], [class*="panel"], [class*="section"], [class*="row"] {
    border-color: rgba(157,112,255,0.16) !important;
    background:
      linear-gradient(145deg, rgba(255,255,255,0.058), rgba(255,255,255,0.016) 42%, rgba(0,0,0,0.26)),
      radial-gradient(circle at 8% 0%, rgba(157,112,255,0.12), transparent 24rem),
      radial-gradient(circle at 96% 2%, rgba(232,190,92,0.055), transparent 18rem),
      rgba(5,6,17,0.66) !important;
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,0.055),
      0 18px 48px rgba(0,0,0,0.32) !important;
  }
  a, .accent, [class*="accent"] {
    color: #fff0b8 !important;
  }
  @keyframes overseerEmbedAmbient {
    0% { background-position: 0% 0%, 100% 0%, 0 0, 0 0; }
    50% { background-position: 8% 5%, 92% 8%, 30px 24px, -22px 34px; }
    100% { background-position: 0% 0%, 100% 0%, 0 0, 0 0; }
  }
  @keyframes overseerEmbedProgress {
    from { background-position: 0% 50%; }
    to { background-position: 200% 50%; }
  }
  @keyframes overseerEmbedGlow {
    0%, 100% { filter: brightness(1); box-shadow: inset 0 1px 0 rgba(255,255,255,0.060), 0 16px 42px rgba(0,0,0,0.30) !important; }
    50% { filter: brightness(1.06); box-shadow: inset 0 1px 0 rgba(255,255,255,0.080), 0 0 24px rgba(157,112,255,0.10), 0 18px 46px rgba(0,0,0,0.34) !important; }
  }
  body::before {
    animation: overseerEmbedAmbient 30s ease-in-out infinite !important;
  }
  .card, .panel, .section, .content, .map-card, .server-card, .settings-card,
  .srv-card, .srv-fav-card, .kb-row, .about-row, .setting-row, .species-header,
  .stat-row, .paste-zone, .scan-placeholder, .shared-marker-card,
  .timer-card, .food-card, .task-card, .template-card, .marker-modal,
  [class*="card"], [class*="panel"], [class*="section"] {
    backdrop-filter: blur(19px) saturate(1.24) !important;
    -webkit-backdrop-filter: blur(19px) saturate(1.24) !important;
    transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease, background 180ms ease !important;
  }
  .card:hover, .panel:hover, .map-card:hover, .server-card:hover, .settings-card:hover,
  .srv-card:hover, .srv-fav-card:hover, .kb-row:hover, .about-row:hover, .setting-row:hover,
  .timer-card:hover, .food-card:hover, .task-card:hover, .template-card:hover {
    transform: translateY(-2px) !important;
    border-color: rgba(232,190,92,0.25) !important;
    animation: overseerEmbedGlow 3.8s ease-in-out infinite !important;
  }
  .srv-tab.active, .srv-filter-btn.active, .sb-tab.active, .scale-preset.active,
  .sound-preset.active, .size-btn.active, .tts-toggle.active,
  .filter-btn.active, .tab-btn.active, .task-opt-btn.active,
  .bar-btn.active, .cat-chip.active, .dino-list-item.active, .ase-tabs button.active,
  .ase-mode-switch button.active, .ase-swatch-grid button.active,
  .sex-btn.active-male, .sex-btn.active-female {
    animation: none !important;
    border-color: rgba(232,190,92,0.34) !important;
    background:
      linear-gradient(145deg, rgba(157,112,255,0.20), rgba(232,190,92,0.070)),
      rgba(5,6,18,0.72) !important;
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,0.08),
      0 0 20px rgba(157,112,255,0.16),
      0 0 12px rgba(232,190,92,0.10) !important;
  }
  .srv-players-bar-fill, .update-progress-fill, .task-item-bar-fill, .progress-fill,
  [class*="progress"][class*="fill"], [class*="bar-fill"] {
    background: linear-gradient(90deg, #7e3dff, #a66cff, #ffd985, #ff9b45, #68b8ff, #7e3dff) !important;
    background-size: 220% 100% !important;
    animation: overseerEmbedProgress 5s linear infinite !important;
  }
  * { -webkit-app-region: no-drag !important; }
`;

const EMBED_THEME_CSS = {
  overseer: '',
  mutagen: `
    :root {
      --accent: #b06cff !important;
      --accent-l: #f0c76b !important;
      --accent-d: #5d39db !important;
      --accent-bg: rgba(176,108,255,0.14) !important;
      --accent-border: rgba(176,108,255,0.24) !important;
      --accent-glow: rgba(176,108,255,0.18) !important;
    }
  `,
  blackglass: `
    :root {
      --accent: #d6b66b !important;
      --accent-l: #f1dda6 !important;
      --accent-d: #7967ff !important;
      --accent-bg: rgba(246,219,151,0.060) !important;
      --accent-border: rgba(246,219,151,0.145) !important;
      --accent-glow: rgba(246,219,151,0.095) !important;
      --blue: #79d7ff !important;
      --pink: #7967ff !important;
      --purple: #7967ff !important;
      --gold: #d6b66b !important;
      --text-0: #faf8f0 !important;
      --text-1: #e5e0d3 !important;
      --text-2: #a49d8e !important;
      --border-0: rgba(246,219,151,0.050) !important;
      --border-1: rgba(246,219,151,0.090) !important;
    }
    html, body {
      background:
        radial-gradient(circle at 18% 8%, rgba(214,182,107,0.050), transparent 30rem),
        radial-gradient(circle at 82% 12%, rgba(121,103,255,0.045), transparent 28rem),
        radial-gradient(circle at 70% 78%, rgba(121,215,255,0.032), transparent 24rem),
        #010104 !important;
    }
    body::before {
      background:
        radial-gradient(circle at 74% 8%, rgba(214,182,107,0.045), transparent 26rem),
        radial-gradient(circle at 18% 28%, rgba(121,103,255,0.038), transparent 28rem),
        radial-gradient(circle at 72% 70%, rgba(121,215,255,0.030), transparent 24rem),
        linear-gradient(rgba(246,219,151,0.010) 1px, transparent 1px),
        linear-gradient(90deg, rgba(246,219,151,0.008) 1px, transparent 1px) !important;
      opacity: 0.36 !important;
    }
    button,
    .srv-tab, .srv-filter-btn, .sb-tab, .scale-preset, .sound-preset, .size-btn, .tts-toggle,
    .filter-btn, .tab-btn, .task-opt-btn, .scan-btn, .bar-btn {
      border-color: rgba(246,219,151,0.10) !important;
      background:
        linear-gradient(145deg, rgba(255,255,255,0.040), rgba(255,255,255,0.008)),
        rgba(3,3,7,0.22) !important;
      color: #faf8f0 !important;
    }
    button:hover,
    .srv-tab:hover, .srv-filter-btn:hover, .sb-tab:hover, .scale-preset:hover, .sound-preset:hover, .size-btn:hover,
    .filter-btn:hover, .tab-btn:hover, .task-opt-btn:hover, .scan-btn:hover, .bar-btn:hover {
      border-color: rgba(246,219,151,0.20) !important;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.052), 0 0 20px rgba(214,182,107,0.070), 0 14px 30px rgba(0,0,0,0.32) !important;
    }
    .card, .panel, .section, .content, .map-card, .server-card, .settings-card,
    .srv-card, .srv-fav-card, .kb-row, .about-row, .setting-row, .species-header,
    .stat-row, .paste-zone, .scan-placeholder, .shared-marker-card,
    .timer-card, .food-card, .task-card, .template-card, .marker-modal,
    [class*="card"], [class*="panel"], [class*="section"] {
      border-color: rgba(246,219,151,0.082) !important;
      background:
        linear-gradient(145deg, rgba(255,255,255,0.038), rgba(255,255,255,0.006) 42%, rgba(0,0,0,0.22)),
        rgba(3,3,7,0.18) !important;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.044), 0 18px 48px rgba(0,0,0,0.30) !important;
    }
    .srv-tab.active, .srv-filter-btn.active, .sb-tab.active, .scale-preset.active,
    .sound-preset.active, .size-btn.active, .tts-toggle.active,
    .filter-btn.active, .tab-btn.active, .task-opt-btn.active,
    .bar-btn.active, .cat-chip.active, .dino-list-item.active, .ase-tabs button.active,
    .ase-mode-switch button.active, .ase-swatch-grid button.active,
    .sex-btn.active-male, .sex-btn.active-female {
      border-color: rgba(246,219,151,0.22) !important;
      background:
        linear-gradient(145deg, rgba(214,182,107,0.10), rgba(121,103,255,0.060)),
        rgba(5,5,10,0.32) !important;
      color: #f1dda6 !important;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.054), 0 0 18px rgba(214,182,107,0.075) !important;
    }
    .srv-players-bar-fill, .update-progress-fill, .task-item-bar-fill, .progress-fill,
    [class*="progress"][class*="fill"], [class*="bar-fill"] {
      background: linear-gradient(90deg, #1a1820, #d6b66b, #7967ff, #79d7ff, #b97848, #1a1820) !important;
      background-size: 220% 100% !important;
    }
  `,
};

function getEmbedCss(theme) {
  return `${EMBED_CSS}\n${EMBED_THEME_CSS[theme] || ''}`;
}

function withEmbedTheme(src, theme) {
  const sep = src.includes('?') ? '&' : '?';
  return `${src}${sep}theme=${encodeURIComponent(theme || DEFAULT_UI_THEME)}`;
}

function EmbeddedPage({ pageKey, preloadPath, theme }) {
  const page = EMBEDDED_PAGES[pageKey];
  const embedRef = React.useRef(null);
  const useWebview = Boolean(preloadPath && window.api?.getPreloadPath);

  React.useEffect(() => {
    const embed = embedRef.current;
    if (!embed) return;
    const handleReady = () => {
      const css = getEmbedCss(theme);
      if (useWebview && embed.insertCSS) {
        embed.insertCSS(css);
        return;
      }
      try {
        const doc = embed.contentDocument || embed.contentWindow?.document;
        if (!doc) return;
        let style = doc.getElementById('overseer-embed-css');
        if (!style) {
          style = doc.createElement('style');
          style.id = 'overseer-embed-css';
          doc.head.appendChild(style);
        }
        style.id = 'overseer-embed-css';
        style.textContent = css;
      } catch {
        // Cross-origin iframe fallback is intentionally best-effort.
      }
    };
    const handleIpcMessage = (e) => {
      if (!useWebview) return;
      if (e.channel === 'save-fav-servers' && e.args?.[0]) {
        window.api?.saveFavServers?.(e.args[0]);
      }
    };
    embed.addEventListener(useWebview ? 'dom-ready' : 'load', handleReady);
    if (useWebview) embed.addEventListener('ipc-message', handleIpcMessage);
    const readyTimer = window.setTimeout(handleReady, 0);
    return () => {
      window.clearTimeout(readyTimer);
      embed.removeEventListener(useWebview ? 'dom-ready' : 'load', handleReady);
      if (useWebview) embed.removeEventListener('ipc-message', handleIpcMessage);
    };
  }, [pageKey, useWebview, theme]);

  if (!page) return null;

  const embedProps = {
    ref: embedRef,
    src: withEmbedTheme(page.src, theme),
    className: 'embedded-iframe',
  };
  if (useWebview) {
    embedProps.nodeintegration = 'false';
    // preloadPath is already a full file:/// URL from main process
    embedProps.preload = preloadPath;
  }

  return (
    <motion.div
      className="embedded-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      {useWebview ? (
        <webview key={pageKey} {...embedProps} />
      ) : (
        <iframe key={pageKey} title={page.label} {...embedProps} />
      )}
    </motion.div>
  );
}

export default function App() {
  const localPreviewHosts = new Set(['127.0.0.1', 'localhost']);
  const forceLocalAppPreview = localPreviewHosts.has(window.location.hostname)
    && new URLSearchParams(window.location.search).get('app') === '1';
  const isPublicWeb = !window.api && !forceLocalAppPreview;
  const [selectedDino, setSelectedDino] = useState(null);
  const [activePage, setActivePage] = useState(getInitialPage);
  const [preloadPath, setPreloadPath] = useState('');
  const [favorites, setFavorites] = useState(() => parseStoredArray('overseer-favorites'));
  const [showSearch, setShowSearch] = useState(false);
  const [globalQuery, setGlobalQuery] = useState('');
  const [uiTheme, setUiThemeState] = useState(loadUiTheme);

  const setUiTheme = useCallback((theme) => {
    setUiThemeState(theme);
    saveUiTheme(theme);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.overseerTheme = uiTheme;
    document.body.dataset.overseerTheme = uiTheme;
    window.api?.setUiTheme?.(uiTheme);
  }, [uiTheme]);

  const toggleFavorite = useCallback((dinoId) => {
    setFavorites(prev => {
      const next = prev.includes(dinoId)
        ? prev.filter(id => id !== dinoId)
        : [...prev, dinoId];
      localStorage.setItem('overseer-favorites', JSON.stringify(next));
      return next;
    });
  }, []);

  useEffect(() => {
    let alive = true;
    if (window.api) {
      window.api.getPreloadPath?.().then((p) => { if (alive) setPreloadPath(p); });
    }
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (isPublicWeb) return undefined;
    if (canonicalizeLegacyHash()) {
      setActivePage('extractor');
      setSelectedDino(null);
    }
    const syncHash = () => {
      if (canonicalizeLegacyHash()) {
        setActivePage('extractor');
        setSelectedDino(null);
        return;
      }
      const nextPage = getInitialPage();
      setActivePage(nextPage);
      if (nextPage) setSelectedDino(null);
    };
    window.addEventListener('hashchange', syncHash);
    return () => window.removeEventListener('hashchange', syncHash);
  }, [isPublicWeb]);

  // Ctrl+K global search shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(prev => !prev);
        setGlobalQuery('');
      }
      if (e.key === 'Escape') {
        setShowSearch(false);
        setGlobalQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navigateTo = useCallback((page) => {
    const pageKey = String(page || '').split(':')[0];
    if (activePage === pageKey) {
      setActivePage(null);
      setSelectedDino(null);
      window.location.hash = '';
    } else {
      setActivePage(pageKey);
      setSelectedDino(null);
      window.location.hash = page;
    }
  }, [activePage]);

  const goHome = useCallback(() => {
    setActivePage(null);
    setSelectedDino(null);
    window.location.hash = '';
  }, []);

  const handleSelectDino = useCallback((dino) => {
    setActivePage(null);
    setSelectedDino(dino);
    window.location.hash = '';
  }, []);

  const showSidebar = activePage === null;
  const showEmbedded = activePage && EMBEDDED_PAGES[activePage];
  const showExtractor = activePage === 'extractor';
  const showAccount = activePage === 'account';
  const showTribeModule = activePage === 'tribute';
  const showSettings = activePage === 'settings';

  if (isPublicWeb) return <PublicWebsite />;

  return (
    <div className={`app-shell ${showTribeModule ? 'tribute-shell' : ''} module-shell theme-${uiTheme}`}>
      {/* Global video background */}
      <video
        className="app-video-bg"
        autoPlay muted loop playsInline
      >
        <source src="./splash-video.mp4" type="video/mp4" />
      </video>
      <div className="app-video-overlay" />
      <TitleBar
        onGoHome={goHome}
        activePage={activePage}
        onNavigate={navigateTo}
      />
      <div className="main-layout">
        {showSidebar && (
          <Sidebar
            dinosaurs={dinosaurs}
            selectedDino={selectedDino}
            onSelectDino={handleSelectDino}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
          />
        )}
        <div className={`content-area ${showEmbedded ? 'embedded-active' : ''}`}>
          <Suspense fallback={<div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', opacity:0.3 }}>Chargement...</div>}>
            <AnimatePresence mode="wait">
              {showEmbedded ? (
                <EmbeddedPage key={activePage} pageKey={activePage} preloadPath={preloadPath} theme={uiTheme} />
              ) : showExtractor ? (
                <StatsExtractor key="extractor" />
              ) : showAccount ? (
                <AccountBilling key="account" />
              ) : showTribeModule ? (
                <TributePlanner key="tribute-module" />
              ) : showSettings ? (
                <AppSettings key="settings" theme={uiTheme} onThemeChange={setUiTheme} />
              ) : selectedDino ? (
                <DinoDetail key={selectedDino.id} dino={selectedDino} />
              ) : (
                <WelcomeScreen key="welcome" onNavigate={navigateTo} />
              )}
            </AnimatePresence>
          </Suspense>
        </div>
      </div>

      {/* Global search modal (Ctrl+K) */}
      {showSearch && (
        <div
          className="global-search-overlay"
          onClick={() => { setShowSearch(false); setGlobalQuery(''); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.55)', display: 'flex',
            alignItems: 'flex-start', justifyContent: 'center',
            paddingTop: '12vh',
          }}
        >
          <div
            className="global-search-modal"
            onClick={e => e.stopPropagation()}
            style={{
              width: '420px', maxHeight: '60vh', background: 'var(--bg-secondary, #1e1e2e)',
              borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ opacity: 0.5, flexShrink: 0 }}><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></svg>
              <input
                type="text"
                autoFocus
                placeholder="Rechercher une créature..."
                value={globalQuery}
                onChange={e => setGlobalQuery(e.target.value)}
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  color: 'inherit', fontSize: '15px',
                }}
              />
              <kbd style={{ fontSize: '11px', opacity: 0.4, background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px' }}>ESC</kbd>
            </div>
            <div style={{ overflowY: 'auto', maxHeight: '50vh' }}>
              {(() => {
                const q = globalQuery.toLowerCase().trim();
                const results = q
                  ? dinosaurs.filter(d =>
                      d.name.toLowerCase().includes(q) ||
                      (d.aka && d.aka.toLowerCase().includes(q))
                    ).slice(0, 20)
                  : dinosaurs.slice(0, 20);
                if (results.length === 0) {
                  return <div style={{ padding: '24px', textAlign: 'center', opacity: 0.5 }}>Aucun résultat</div>;
                }
                return results.map(dino => (
                  <div
                    key={dino.id}
                    onClick={() => { handleSelectDino(dino); setShowSearch(false); setGlobalQuery(''); }}
                    style={{
                      padding: '10px 16px', cursor: 'pointer', display: 'flex',
                      alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(255,255,255,0.04)',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={{ fontSize: '18px' }}>{dino.icon}</span>
                    <div>
                      <div style={{ fontWeight: 500 }}>{dino.name}</div>
                      {dino.aka && <div style={{ fontSize: '12px', opacity: 0.5 }}>{dino.aka}</div>}
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
