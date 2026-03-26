import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import { dinosaurs } from './data/dinosaurs';

// Lazy-loaded components for faster startup
const DinoDetail = lazy(() => import('./components/DinoDetail'));
const WelcomeScreen = lazy(() => import('./components/WelcomeScreen'));

// Pages that embed shell HTML files
const EMBEDDED_PAGES = {
  breeding: { src: '../shell/breeding-window.html', label: 'Breeding' },
  tribe:    { src: '../shell/tribe-tasks.html',     label: 'Tribu' },
  maps:     { src: '../shell/maps-window.html',     label: 'Cartes' },
  ocr:      { src: '../shell/ocr-window.html',      label: 'OCR Scanner' },
  settings: { src: '../shell/settings-window.html',  label: 'Paramètres' },
  comparator: { src: '../shell/comparator-window.html', label: 'Comparateur' },
};

// CSS injected into each webview to hide its title bar
const EMBED_CSS = `
  #breed-bar, #maps-bar, #ocr-bar, #cmp-bar, #titlebar, #mini-bar, #appbar,
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
  const webviewRef = React.useRef(null);

  React.useEffect(() => {
    const wv = webviewRef.current;
    if (!wv) return;
    const handleReady = () => {
      wv.insertCSS(EMBED_CSS);
    };
    wv.addEventListener('dom-ready', handleReady);
    return () => wv.removeEventListener('dom-ready', handleReady);
  }, [pageKey]);

  if (!page) return null;

  const webviewProps = {
    ref: webviewRef,
    key: pageKey,
    src: page.src,
    className: 'embedded-iframe',
    nodeintegration: 'false',
  };
  if (preloadPath) {
    // preloadPath is already a full file:/// URL from main process
    webviewProps.preload = preloadPath;
  }

  return (
    <motion.div
      className="embedded-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <webview {...webviewProps} />
    </motion.div>
  );
}

export default function App() {
  const [selectedDino, setSelectedDino] = useState(null);
  const [activePage, setActivePage] = useState(null);
  const [isOverlay, setIsOverlay] = useState(false);
  const [preloadPath, setPreloadPath] = useState('');
  const [favorites, setFavorites] = useState(() => JSON.parse(localStorage.getItem('didi-dex-favorites') || '[]'));
  const [showSearch, setShowSearch] = useState(false);
  const [globalQuery, setGlobalQuery] = useState('');
  const [lightTheme, setLightTheme] = useState(() => localStorage.getItem('didi-dex-theme') === 'light');

  const toggleTheme = useCallback(() => {
    setLightTheme(prev => {
      const next = !prev;
      localStorage.setItem('didi-dex-theme', next ? 'light' : 'dark');
      return next;
    });
  }, []);

  const toggleFavorite = useCallback((dinoId) => {
    setFavorites(prev => {
      const next = prev.includes(dinoId)
        ? prev.filter(id => id !== dinoId)
        : [...prev, dinoId];
      localStorage.setItem('didi-dex-favorites', JSON.stringify(next));
      return next;
    });
  }, []);

  useEffect(() => {
    if (window.api) {
      window.api.onOverlay((value) => setIsOverlay(value));
      window.api.getOverlay().then(setIsOverlay);
      window.api.getPreloadPath().then((p) => setPreloadPath(p));
    }
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
    if (activePage === page) {
      setActivePage(null);
      setSelectedDino(null);
    } else {
      setActivePage(page);
      setSelectedDino(null);
    }
  }, [activePage]);

  const goHome = useCallback(() => {
    setActivePage(null);
    setSelectedDino(null);
  }, []);

  const handleSelectDino = useCallback((dino) => {
    setActivePage(null);
    setSelectedDino(dino);
  }, []);

  const showSidebar = activePage === null;
  const showEmbedded = activePage && EMBEDDED_PAGES[activePage];

  return (
    <div className={`app-shell ${isOverlay ? 'overlay-mode' : ''} ${lightTheme ? 'light-theme' : ''}`}>
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
