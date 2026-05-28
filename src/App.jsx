import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import { dinosaurs } from './data/dinosaurs';

// Lazy-loaded components for faster startup
const DinoDetail = lazy(() => import('./components/DinoDetail'));
const WelcomeScreen = lazy(() => import('./components/WelcomeScreen'));
const StatsExtractor = lazy(() => import('./components/StatsExtractor'));
const AccountBilling = lazy(() => import('./components/AccountBilling'));
const TributePlanner = lazy(() => import('./components/TributePlanner'));

// Pages that embed shell HTML files
const EMBEDDED_PAGES = {
  maps:     { src: '../shell/maps-window.html',     label: 'Cartes' },
  servers:  { src: '../shell/server-status.html',     label: 'Serveurs' },
  settings: { src: '../shell/settings-window.html',  label: 'Paramètres' },
  comparator: { src: '../shell/comparator-window.html', label: 'Comparateur' },
};

const LOCAL_PAGES = new Set(['extractor', 'account', 'tribute']);
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

// CSS injected into each webview to hide its title bar
const EMBED_CSS = `
  #breed-bar, #maps-bar, #ocr-bar, #cmp-bar, #srv-bar, #titlebar, #mini-bar, #appbar,
  .bar, .title-bar {
    display: none !important;
  }
  html, body {
    overflow: auto !important;
    height: 100% !important;
  }
  #app {
    height: 100% !important;
  }
  * { -webkit-app-region: no-drag !important; }
`;

function EmbeddedPage({ pageKey, preloadPath }) {
  const page = EMBEDDED_PAGES[pageKey];
  const embedRef = React.useRef(null);
  const useWebview = Boolean(preloadPath && window.api?.getPreloadPath);

  React.useEffect(() => {
    const embed = embedRef.current;
    if (!embed) return;
    const handleReady = () => {
      if (useWebview && embed.insertCSS) {
        embed.insertCSS(EMBED_CSS);
        return;
      }
      try {
        const doc = embed.contentDocument || embed.contentWindow?.document;
        if (!doc || doc.getElementById('overseer-embed-css')) return;
        const style = doc.createElement('style');
        style.id = 'overseer-embed-css';
        style.textContent = EMBED_CSS;
        doc.head.appendChild(style);
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
    return () => {
      embed.removeEventListener(useWebview ? 'dom-ready' : 'load', handleReady);
      if (useWebview) embed.removeEventListener('ipc-message', handleIpcMessage);
    };
  }, [pageKey, useWebview]);

  if (!page) return null;

  const embedProps = {
    ref: embedRef,
    src: page.src,
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
  const [selectedDino, setSelectedDino] = useState(null);
  const [activePage, setActivePage] = useState(getInitialPage);
  const [isOverlay, setIsOverlay] = useState(false);
  const [preloadPath, setPreloadPath] = useState('');
  const [favorites, setFavorites] = useState(() => parseStoredArray('overseer-favorites'));
  const [showSearch, setShowSearch] = useState(false);
  const [globalQuery, setGlobalQuery] = useState('');
  const [lightTheme, setLightTheme] = useState(() => localStorage.getItem('overseer-theme') === 'light');

  const toggleTheme = useCallback(() => {
    setLightTheme(prev => {
      const next = !prev;
      localStorage.setItem('overseer-theme', next ? 'light' : 'dark');
      return next;
    });
  }, []);

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
    let unsubscribeOverlay;
    let alive = true;
    if (window.api) {
      unsubscribeOverlay = window.api.onOverlay?.((value) => setIsOverlay(value));
      window.api.getOverlay().then(value => { if (alive) setIsOverlay(value); });
      window.api.getPreloadPath().then((p) => { if (alive) setPreloadPath(p); });
    }
    return () => {
      alive = false;
      if (typeof unsubscribeOverlay === 'function') unsubscribeOverlay();
    };
  }, []);

  useEffect(() => {
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
  }, []);

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

  const handleToggleOverlay = useCallback(() => {
    if (window.api) window.api.toggleOverlay();
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

  return (
    <div className={`app-shell ${isOverlay ? 'overlay-mode' : ''} ${lightTheme ? 'light-theme' : ''} ${showTribeModule ? 'tribute-shell' : ''} module-shell`}>
      {/* Global video background */}
      <video
        className="app-video-bg"
        autoPlay muted loop playsInline
      >
        <source src="./splash-video.mp4" type="video/mp4" />
      </video>
      <div className="app-video-overlay" />
      <TitleBar
        isOverlay={isOverlay}
        onToggleOverlay={handleToggleOverlay}
        onGoHome={goHome}
        activePage={activePage}
        onNavigate={navigateTo}
        lightTheme={lightTheme}
        onToggleTheme={toggleTheme}
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
                <EmbeddedPage key={activePage} pageKey={activePage} preloadPath={preloadPath} />
              ) : showExtractor ? (
                <StatsExtractor key="extractor" />
              ) : showAccount ? (
                <AccountBilling key="account" />
              ) : showTribeModule ? (
                <TributePlanner key="tribute-module" />
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
