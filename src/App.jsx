import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import DinoDetail from './components/DinoDetail';
import WelcomeScreen from './components/WelcomeScreen';
import { dinosaurs } from './data/dinosaurs';

export default function App() {
  const [selectedDino, setSelectedDino] = useState(null);
  const [isOverlay, setIsOverlay] = useState(false);

  useEffect(() => {
    if (window.api) {
      window.api.onOverlay((value) => setIsOverlay(value));
      window.api.getOverlay().then(setIsOverlay);
    }
  }, []);

  const handleToggleOverlay = useCallback(() => {
    if (window.api) window.api.toggleOverlay();
  }, []);

  return (
    <div className={`app-shell ${isOverlay ? 'overlay-mode' : ''}`}>
      <TitleBar
        isOverlay={isOverlay}
        onToggleOverlay={handleToggleOverlay}
        onGoHome={() => setSelectedDino(null)}
      />
      <div className="main-layout">
        <Sidebar
          dinosaurs={dinosaurs}
          selectedDino={selectedDino}
          onSelectDino={setSelectedDino}
        />
        <div className="content-area">
          <AnimatePresence mode="wait">
            {selectedDino ? (
              <DinoDetail key={selectedDino.id} dino={selectedDino} />
            ) : (
              <WelcomeScreen key="welcome" />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
