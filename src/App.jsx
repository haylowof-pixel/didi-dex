import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import DinoDetail from './components/DinoDetail';
import WelcomeScreen from './components/WelcomeScreen';
import { dinosaurs } from './data/dinosaurs';

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

  useEffect(() => {
    if (window.api) {
      window.api.onOverlay((value) => setIsOverlay(value));
      window.api.getOverlay().then(setIsOverlay);
      window.api.getPreloadPath().then((p) => setPreloadPath(p));
    }
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
    <div className={`app-shell ${isOverlay ? 'overlay-mode' : ''}`}>
      <TitleBar
        isOverlay={isOverlay}
        onToggleOverlay={handleToggleOverlay}
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
          />
        )}
        <div className={`content-area ${showEmbedded ? 'embedded-active' : ''}`}>
          <AnimatePresence mode="wait">
            {showEmbedded ? (
              <EmbeddedPage key={activePage} pageKey={activePage} preloadPath={preloadPath} />
            ) : selectedDino ? (
              <DinoDetail key={selectedDino.id} dino={selectedDino} />
            ) : (
              <WelcomeScreen key="welcome" onNavigate={navigateTo} />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
