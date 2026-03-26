const { app, BrowserWindow, ipcMain, globalShortcut, session, screen, Notification, dialog, desktopCapturer } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const https = require('https');

const APP_ICON = path.join(__dirname, '..', 'public', process.platform === 'win32' ? 'icon.ico' : 'icon.png');

// Force Windows to use our icon when pinned to taskbar
if (process.platform === 'win32') {
  app.setAppUserModelId('com.overseer.app');
}

let mainWindow;
let splashWindow = null;
let timerWindow = null;
let mapsWindow = null;
let widgetWindow = null;
let settingsWindow = null;
let breedingWindow = null;
let ocrWindow = null;
let tribeWindow = null;
let isOverlay = false;

// ===== WIDGET MODE STATE =====
let widgetMode = 'mini';
const WIDGET_SIZES = {
  mini:     { w: 220, h: 70 },
  standard: { w: 280, h: 140 },
  detailed: { w: 340, h: 260 },
};
const WIDGET_MODES = ['mini', 'standard', 'detailed'];

// ===== KEYBINDS CONFIG =====
const DEFAULT_KEYBINDS = {
  toggleOverlay: 'Alt+O',
  toggleWindow:  'Alt+T',
  toggleTimer:   'Alt+M',
  toggleWidget:  'Alt+W',
  toggleWidgetMode: 'Alt+Shift+W',
  toggleMaps:    'Alt+G',
  toggleBreeding:'Alt+B',
  toggleOCR:     'Alt+S',
  ocrScan:       'F8',
};

let currentKeybinds = { ...DEFAULT_KEYBINDS };

function getKeybindsPath() {
  return path.join(app.getPath('userData'), 'keybinds.json');
}

function loadKeybinds() {
  try {
    const filePath = getKeybindsPath();
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      currentKeybinds = { ...DEFAULT_KEYBINDS, ...data };
    }
  } catch (e) {
    currentKeybinds = { ...DEFAULT_KEYBINDS };
  }
}

function saveKeybinds(bindings) {
  try {
    currentKeybinds = { ...DEFAULT_KEYBINDS, ...bindings };
    fs.writeFileSync(getKeybindsPath(), JSON.stringify(currentKeybinds, null, 2), 'utf8');
  } catch (e) {}
}

function registerAllShortcuts() {
  globalShortcut.unregisterAll();
  try {
    if (currentKeybinds.toggleOverlay) {
      globalShortcut.register(currentKeybinds.toggleOverlay, () => toggleOverlay());
    }
  } catch (e) {}
  try {
    if (currentKeybinds.toggleWindow) {
      globalShortcut.register(currentKeybinds.toggleWindow, () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
        }
      });
    }
  } catch (e) {}
  try {
    if (currentKeybinds.toggleTimer) {
      globalShortcut.register(currentKeybinds.toggleTimer, () => {
        if (isTimerAlive()) safeDestroyTimer();
        else createTimerWindow();
      });
    }
  } catch (e) {}
  try {
    if (currentKeybinds.toggleWidget) {
      globalShortcut.register(currentKeybinds.toggleWidget, () => {
        if (isWidgetAlive()) safeDestroyWidget();
        else createWidgetWindow();
      });
    }
  } catch (e) {}
  try {
    if (currentKeybinds.toggleWidgetMode) {
      globalShortcut.register(currentKeybinds.toggleWidgetMode, () => {
        if (isWidgetAlive()) {
          cycleWidgetMode();
        }
      });
    }
  } catch (e) {}
  try {
    if (currentKeybinds.toggleMaps) {
      globalShortcut.register(currentKeybinds.toggleMaps, () => {
        if (isMapsAlive()) safeDestroyMaps();
        else createMapsWindow('the-island', 'The Island');
      });
    }
  } catch (e) {}
  try {
    if (currentKeybinds.toggleBreeding) {
      globalShortcut.register(currentKeybinds.toggleBreeding, () => {
        if (isBreedingAlive()) safeDestroyBreeding();
        else createBreedingWindow();
      });
    }
  } catch (e) {}
  try {
    if (currentKeybinds.toggleOCR) {
      globalShortcut.register(currentKeybinds.toggleOCR, () => {
        if (isOCRAlive()) safeDestroyOCR();
        else createOCRWindow();
      });
    }
    // F8 = instant OCR scan (opens OCR if not open, then triggers scan)
    if (currentKeybinds.ocrScan) {
      globalShortcut.register(currentKeybinds.ocrScan, () => {
        if (!isOCRAlive()) {
          createOCRWindow();
          // Wait for window to load then trigger scan
          ocrWindow.webContents.once('did-finish-load', () => {
            setTimeout(() => {
              ocrWindow.webContents.send('trigger-scan');
            }, 500);
          });
        } else {
          ocrWindow.webContents.send('trigger-scan');
        }
      });
    }
  } catch (e) {}
}

// ===== AUTO-UPDATER =====
function setupAutoUpdater() {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-status', { status: 'checking' });
      try { if (isSettingsAlive()) settingsWindow.webContents.send('update-status', { status: 'checking' }); } catch (e) {}
    }
  });

  autoUpdater.on('update-available', (info) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-status', { status: 'available', version: info.version });
      try { if (isSettingsAlive()) settingsWindow.webContents.send('update-status', { status: 'available', version: info.version }); } catch (e) {}
    }
  });

  autoUpdater.on('update-not-available', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-status', { status: 'up-to-date' });
      try { if (isSettingsAlive()) settingsWindow.webContents.send('update-status', { status: 'up-to-date' }); } catch (e) {}
    }
  });

  autoUpdater.on('download-progress', (progress) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-status', { status: 'downloading', percent: Math.round(progress.percent) });
      try { if (isSettingsAlive()) settingsWindow.webContents.send('update-status', { status: 'downloading', percent: Math.round(progress.percent) }); } catch (e) {}
    }
  });

  autoUpdater.on('update-downloaded', (info) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-status', { status: 'ready', version: info.version });
      try { if (isSettingsAlive()) settingsWindow.webContents.send('update-status', { status: 'ready', version: info.version }); } catch (e) {}
    }
    // Show dialog
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'OVERSEER — Mise à jour',
      message: `La version ${info.version} est prête !`,
      detail: 'L\'application va redémarrer pour installer la mise à jour.',
      buttons: ['Redémarrer maintenant', 'Plus tard'],
      defaultId: 0,
    }).then(({ response }) => {
      if (response === 0) {
        autoUpdater.quitAndInstall(false, true);
      }
    });
  });

  autoUpdater.on('error', (err) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-status', { status: 'error', message: err.message });
      try { if (isSettingsAlive()) settingsWindow.webContents.send('update-status', { status: 'error', message: err.message }); } catch (e) {}
    }
  });

  // Check for updates
  autoUpdater.checkForUpdates().catch(() => {});

  // Check again every 30 minutes
  setInterval(() => {
    autoUpdater.checkForUpdates().catch(() => {});
  }, 30 * 60 * 1000);
}

// IPC for manual update check
ipcMain.handle('check-for-updates', async () => {
  if (app.isPackaged) {
    try {
      const result = await autoUpdater.checkForUpdates();
      return { available: !!result?.updateInfo, version: result?.updateInfo?.version };
    } catch (e) {
      return { available: false, error: e.message };
    }
  }
  return { available: false, dev: true };
});

ipcMain.on('install-update', () => {
  autoUpdater.quitAndInstall(false, true);
});

ipcMain.handle('get-app-version', () => app.getVersion());
ipcMain.handle('get-preload-path', () => {
  const p = path.join(__dirname, 'webview-preload.js');
  // Convert Windows backslashes to forward slashes for file:// URL
  return 'file:///' + p.replace(/\\/g, '/');
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 850,
    minWidth: 420,
    minHeight: 350,
    frame: false,
    backgroundColor: '#000000',
    alwaysOnTop: false,
    resizable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
    },
    icon: APP_ICON,
    show: false,
  });

  // Allow webview preload scripts – validate that only our own preload is used
  mainWindow.webContents.on('will-attach-webview', (event, webPreferences, params) => {
    // Strip any existing preload scripts for security
    delete webPreferences.preload;
    delete webPreferences.preloadURL;

    // Only allow our webview-preload.js
    const allowedPreload = path.join(__dirname, 'webview-preload.js');
    const allowedPreloadUrl = 'file:///' + allowedPreload.replace(/\\/g, '/');

    if (params.preload && params.preload === allowedPreloadUrl) {
      webPreferences.preload = allowedPreload;
    }

    // Ensure security defaults
    webPreferences.contextIsolation = true;
    webPreferences.nodeIntegration = false;
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  mainWindow.once('ready-to-show', () => {
    // If no splash screen, show immediately; otherwise splash logic handles it
    if (!splashWindow || splashWindow.isDestroyed()) {
      mainWindow.show();
    }
    mainWindow.setAlwaysOnTop(false);
    mainWindow.webContents.setZoomFactor(loadScale());

    // Auto-update check (only in packaged app)
    if (app.isPackaged) {
      setupAutoUpdater();
    }
  });
  mainWindow.on('closed', () => {
    mainWindow = null;
    safeDestroyTimer();
    safeDestroyMaps();
    safeDestroyWidget();
    safeDestroySettings();
    safeDestroyBreeding();
  });

  mainWindow.on('focus', () => {
    setTimerClickThrough(false);
    setWidgetClickThrough(false);
  });
  mainWindow.on('blur', () => {
    setTimerClickThrough(true);
    setWidgetClickThrough(true);
  });

  // Ad blocker
  const adFilter = { urls: [
    '*://*.doubleclick.net/*', '*://*.googlesyndication.com/*',
    '*://*.googleadservices.com/*', '*://pagead2.googlesyndication.com/*',
    '*://*.amazon-adsystem.com/*', '*://*.adnxs.com/*',
    '*://*.ads-twitter.com/*', '*://*.moatads.com/*',
    '*://cdn.taboola.com/*', '*://tpc.googlesyndication.com/*',
  ]};
  session.defaultSession.webRequest.onBeforeRequest(adFilter, (_, cb) => cb({ cancel: true }));
}

// ===== SAFE TIMER WINDOW HELPERS =====
function isTimerAlive() { return timerWindow && !timerWindow.isDestroyed(); }

function safeDestroyTimer() {
  try { if (isTimerAlive()) timerWindow.destroy(); } catch (e) {}
  timerWindow = null;
}

function setTimerClickThrough(enabled) {
  try {
    if (isTimerAlive()) {
      timerWindow.setIgnoreMouseEvents(enabled, enabled ? { forward: true } : {});
      timerWindow.webContents.send('click-through-changed', enabled);
    }
  } catch (e) {}
}

// ===== MINI TIMER WINDOW =====
function createTimerWindow() {
  if (isTimerAlive()) { return; }
  timerWindow = null;
  const { width: sw } = screen.getPrimaryDisplay().workAreaSize;

  timerWindow = new BrowserWindow({
    width: 380, height: 540, x: sw - 400, y: 20,
    minWidth: 220, minHeight: 200,
    frame: false, transparent: true, alwaysOnTop: true,
    resizable: true, minimizable: false, maximizable: false,
    skipTaskbar: true, focusable: true,
    backgroundColor: '#00000000', hasShadow: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false,
    },
  });

  timerWindow.loadFile(path.join(__dirname, '..', 'shell', 'timer-overlay.html'));
  timerWindow.setAlwaysOnTop(true, 'screen-saver');
  timerWindow.setIgnoreMouseEvents(false);

  timerWindow.on('closed', () => { timerWindow = null; });
  timerWindow.webContents.on('destroyed', () => { timerWindow = null; });
}

// ===== MAPS WINDOW =====
function isMapsAlive() { return mapsWindow && !mapsWindow.isDestroyed(); }

function safeDestroyMaps() {
  try { if (isMapsAlive()) mapsWindow.destroy(); } catch (e) {}
  mapsWindow = null;
}

function createMapsWindow(mapSlug, mapName) {
  if (isMapsAlive()) {
    try {
      mapsWindow.webContents.send('map-change', { slug: mapSlug, name: mapName });
      mapsWindow.focus();
    } catch (e) {}
    return;
  }
  mapsWindow = null;

  mapsWindow = new BrowserWindow({
    width: 520, height: 520, minWidth: 350, minHeight: 350,
    frame: false, backgroundColor: '#0a0a0a',
    alwaysOnTop: true, resizable: true,
    minimizable: true, maximizable: true,
    skipTaskbar: false, focusable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false,
    },
    icon: APP_ICON,
  });

  mapsWindow.loadFile(path.join(__dirname, '..', 'shell', 'maps-window.html'));
  mapsWindow.setAlwaysOnTop(true, 'floating');

  mapsWindow.on('closed', () => { mapsWindow = null; });
  mapsWindow.webContents.on('destroyed', () => { mapsWindow = null; });

  if (mapSlug && mapSlug !== 'the-island') {
    mapsWindow.webContents.once('did-finish-load', () => {
      if (isMapsAlive()) {
        mapsWindow.webContents.send('map-change', { slug: mapSlug, name: mapName });
      }
    });
  }
}

// ===== WIDGET MINI =====
function isWidgetAlive() { return widgetWindow && !widgetWindow.isDestroyed(); }

function safeDestroyWidget() {
  try { if (isWidgetAlive()) widgetWindow.destroy(); } catch (e) {}
  widgetWindow = null;
}

function setWidgetClickThrough(enabled) {
  try {
    if (isWidgetAlive()) {
      widgetWindow.setIgnoreMouseEvents(enabled, enabled ? { forward: true } : {});
      widgetWindow.webContents.send('widget-click-through-changed', enabled);
    }
  } catch (e) {}
}

function cycleWidgetMode() {
  const idx = WIDGET_MODES.indexOf(widgetMode);
  const next = WIDGET_MODES[(idx + 1) % WIDGET_MODES.length];
  setWidgetMode(next);
}

function setWidgetMode(mode) {
  if (!WIDGET_SIZES[mode]) return;
  widgetMode = mode;
  if (isWidgetAlive()) {
    const { w, h } = WIDGET_SIZES[mode];
    try { widgetWindow.setSize(w, h); } catch (e) {}
    try { widgetWindow.webContents.send('widget-mode-changed', mode); } catch (e) {}
  }
}

function createWidgetWindow() {
  if (isWidgetAlive()) return;
  widgetWindow = null;
  widgetMode = 'mini'; // Reset mode on new widget
  const { width: sw } = screen.getPrimaryDisplay().workAreaSize;

  widgetWindow = new BrowserWindow({
    width: WIDGET_SIZES.mini.w, height: WIDGET_SIZES.mini.h, x: sw - 240, y: 80,
    frame: false, transparent: true, alwaysOnTop: true,
    resizable: false, minimizable: false, maximizable: false,
    skipTaskbar: true, focusable: false,
    backgroundColor: '#00000000', hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false,
    },
  });

  widgetWindow.loadFile(path.join(__dirname, '..', 'shell', 'widget-mini.html'));
  widgetWindow.setAlwaysOnTop(true, 'screen-saver');
  // Start click-through — will become interactive when main window gets focus
  widgetWindow.setIgnoreMouseEvents(true, { forward: true });

  widgetWindow.on('closed', () => { widgetWindow = null; });
  widgetWindow.webContents.on('destroyed', () => { widgetWindow = null; });
}

// ===== OVERLAY =====
function toggleOverlay() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  isOverlay = !isOverlay;
  if (isOverlay) {
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
    mainWindow.setOpacity(0.92);
  } else {
    mainWindow.setAlwaysOnTop(false);
    mainWindow.setOpacity(1.0);
    // Double-check it's really not on top
    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed() && !isOverlay) {
        mainWindow.setAlwaysOnTop(false);
      }
    }, 100);
  }
  mainWindow.webContents.send('overlay-changed', isOverlay);
}

// ===== SETTINGS WINDOW =====
function isSettingsAlive() { return settingsWindow && !settingsWindow.isDestroyed(); }

function safeDestroySettings() {
  try { if (isSettingsAlive()) settingsWindow.destroy(); } catch (e) {}
  settingsWindow = null;
}

function createSettingsWindow() {
  if (isSettingsAlive()) { settingsWindow.focus(); return; }
  settingsWindow = null;

  settingsWindow = new BrowserWindow({
    width: 500, height: 560, minWidth: 420, minHeight: 450,
    frame: false, backgroundColor: '#000000',
    alwaysOnTop: true, resizable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false,
    },
    icon: APP_ICON,
  });

  settingsWindow.loadFile(path.join(__dirname, '..', 'shell', 'settings-window.html'));
  settingsWindow.setAlwaysOnTop(true, 'floating');

  settingsWindow.on('closed', () => { settingsWindow = null; });
  settingsWindow.webContents.on('destroyed', () => { settingsWindow = null; });
}

app.whenReady().then(() => {
  loadKeybinds();

  // --- Splash Screen ---
  splashWindow = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    transparent: true,
    center: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    show: false,
    icon: APP_ICON,
  });
  splashWindow.loadFile(path.join(__dirname, '..', 'shell', 'splash.html'));
  splashWindow.once('ready-to-show', () => { splashWindow.show(); });

  // Create the main window (starts hidden via show:false)
  createWindow();
  registerAllShortcuts();

  // When main window content finishes loading, wait then transition
  mainWindow.webContents.on('did-finish-load', () => {
    setTimeout(() => {
      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.webContents.send('fade-out');
        // Wait for fade animation to complete, then show main + close splash
        setTimeout(() => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.show();
          }
          if (splashWindow && !splashWindow.isDestroyed()) {
            splashWindow.destroy();
          }
          splashWindow = null;
        }, 400);
      }
    }, 1500);
  });
});

app.on('will-quit', () => globalShortcut.unregisterAll());
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

// ===== IPC =====
ipcMain.on('win-minimize', () => { if (mainWindow && !mainWindow.isDestroyed()) mainWindow.minimize(); });
ipcMain.on('win-maximize', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
  }
});
ipcMain.on('win-close', () => { if (mainWindow && !mainWindow.isDestroyed()) mainWindow.close(); });
ipcMain.on('toggle-overlay', () => toggleOverlay());
ipcMain.on('set-opacity', (_, val) => { if (mainWindow && !mainWindow.isDestroyed()) mainWindow.setOpacity(val); });
ipcMain.handle('get-overlay', () => isOverlay);

// ===== ZOOM / SCALE =====
function getScalePath() { return path.join(app.getPath('userData'), 'scale.json'); }
function loadScale() {
  try { return JSON.parse(fs.readFileSync(getScalePath(), 'utf8')).scale || 1; } catch { return 1; }
}
function saveScale(s) {
  fs.writeFileSync(getScalePath(), JSON.stringify({ scale: s }), 'utf8');
}
function applyScaleToAll(s) {
  const wins = [mainWindow, timerWindow, mapsWindow, widgetWindow, settingsWindow, breedingWindow, ocrWindow, tribeWindow];
  for (const w of wins) {
    if (w && !w.isDestroyed()) w.webContents.setZoomFactor(s);
  }
}
ipcMain.handle('get-scale', () => loadScale());
ipcMain.on('set-scale', (_, val) => {
  const s = Math.max(0.5, Math.min(2, val));
  saveScale(s);
  applyScaleToAll(s);
});

// Resize presets
ipcMain.on('resize-window', (_, preset) => {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  switch (preset) {
    case 'compact':  mainWindow.setSize(480, 700); break;
    case 'normal':   mainWindow.setSize(1000, 800); break;
    case 'wide':     mainWindow.setSize(1400, 900); break;
    case 'tall':     mainWindow.setSize(550, 950); break;
  }
  mainWindow.center();
});

// Timer
ipcMain.on('open-timer-overlay', () => createTimerWindow());
ipcMain.on('close-timer-overlay', () => safeDestroyTimer());
ipcMain.on('timer-close', () => safeDestroyTimer());
ipcMain.handle('is-timer-open', () => isTimerAlive());

ipcMain.on('timer-set-ignore-mouse', (_, ignore, opts) => {
  try { if (isTimerAlive()) timerWindow.setIgnoreMouseEvents(ignore, opts || {}); } catch (e) {}
});

ipcMain.on('resize-timer', (_, preset) => {
  if (!isTimerAlive()) return;
  try {
    switch (preset) {
      case 'small':   timerWindow.setSize(280, 400); break;
      case 'medium':  timerWindow.setSize(380, 540); break;
      case 'large':   timerWindow.setSize(480, 700); break;
    }
  } catch (e) {}
});

// Sync data → timer + widget + comparator
ipcMain.on('sync-timer-data', (_, data) => {
  try { if (isTimerAlive()) timerWindow.webContents.send('timer-data-update', data); } catch (e) {}
  try { if (isWidgetAlive()) widgetWindow.webContents.send('widget-data-update', data); } catch (e) {}
});

// Maps
ipcMain.on('open-maps-window', (_, slug, name) => createMapsWindow(slug, name));
ipcMain.on('close-maps-window', () => safeDestroyMaps());
ipcMain.on('maps-close', () => safeDestroyMaps());
ipcMain.handle('is-maps-open', () => isMapsAlive());
ipcMain.on('change-map', (_, slug, name) => {
  if (isMapsAlive()) {
    try {
      mapsWindow.webContents.send('map-change', { slug: slug, name: name });
    } catch (e) {}
  }
});
ipcMain.on('maps-set-opacity', (_, val) => {
  if (isMapsAlive()) mapsWindow.setOpacity(val);
});
ipcMain.on('maps-toggle-pin', () => {
  if (isMapsAlive()) {
    const pinned = mapsWindow.isAlwaysOnTop();
    mapsWindow.setAlwaysOnTop(!pinned, 'floating');
    mapsWindow.webContents.send('pin-changed', !pinned);
  }
});

// Widget
ipcMain.on('open-widget', () => createWidgetWindow());
ipcMain.on('close-widget', () => safeDestroyWidget());
ipcMain.on('widget-close', () => safeDestroyWidget());
ipcMain.handle('is-widget-open', () => isWidgetAlive());
ipcMain.on('widget-set-mode', (_, mode, w, h) => {
  setWidgetMode(mode);
});
ipcMain.on('widget-cycle-mode', () => {
  if (isWidgetAlive()) {
    cycleWidgetMode();
  }
});
ipcMain.handle('get-widget-mode', () => widgetMode);

// Settings
ipcMain.on('open-settings', () => createSettingsWindow());
ipcMain.on('close-settings', () => safeDestroySettings());
ipcMain.on('settings-close', () => safeDestroySettings());
ipcMain.handle('is-settings-open', () => isSettingsAlive());

// Keybinds
ipcMain.handle('get-keybinds', () => ({ current: currentKeybinds, defaults: DEFAULT_KEYBINDS }));
ipcMain.on('save-keybinds', (_, bindings) => {
  saveKeybinds(bindings);
  registerAllShortcuts();
  // Notify all windows that keybinds changed
  try { if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('keybinds-changed', currentKeybinds); } catch (e) {}
  try { if (isSettingsAlive()) settingsWindow.webContents.send('keybinds-changed', currentKeybinds); } catch (e) {}
});

// Native notifications
ipcMain.on('show-notification', (_, data) => {
  try {
    if (Notification.isSupported()) {
      const notif = new Notification({
        title: data.title || 'ARK Taming Companion',
        body: data.body || '',
        icon: APP_ICON,
        silent: false,
      });
      notif.show();
      notif.on('click', () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.show();
          mainWindow.focus();
        }
      });
    }
  } catch (e) {}
});

// Export/Import config
ipcMain.handle('export-config', () => {
  try {
    const config = {
      keybinds: currentKeybinds,
      version: '2.0.0',
      exportDate: new Date().toISOString(),
    };
    return JSON.stringify(config, null, 2);
  } catch (e) { return '{}'; }
});

ipcMain.on('import-config', (_, jsonStr) => {
  try {
    const config = JSON.parse(jsonStr);
    if (config.keybinds) {
      saveKeybinds(config.keybinds);
      registerAllShortcuts();
      // Notify all windows
      try { if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('keybinds-changed', currentKeybinds); } catch (e) {}
      try { if (isSettingsAlive()) settingsWindow.webContents.send('keybinds-changed', currentKeybinds); } catch (e) {}
    }
  } catch (e) {}
});

// ===== MAP IMAGE MANAGEMENT =====
function getMapImagesConfigPath() {
  return path.join(app.getPath('userData'), 'map-images.json');
}

function loadMapImagePaths() {
  try {
    const filePath = getMapImagesConfigPath();
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (e) {}
  return {};
}

function saveMapImagePath(slug, imgPath) {
  try {
    const paths = loadMapImagePaths();
    if (imgPath) {
      paths[slug] = imgPath;
    } else {
      delete paths[slug];
    }
    fs.writeFileSync(getMapImagesConfigPath(), JSON.stringify(paths, null, 2), 'utf8');
  } catch (e) {}
}

function fileToDataUrl(filePath) {
  try {
    const data = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase().replace('.', '');
    const mimeTypes = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', bmp: 'image/bmp', gif: 'image/gif' };
    const mime = mimeTypes[ext] || 'image/png';
    return 'data:' + mime + ';base64,' + data.toString('base64');
  } catch (e) { return null; }
}

ipcMain.handle('select-map-image', async (_, slug) => {
  const parentWin = isMapsAlive() ? mapsWindow : mainWindow;
  const result = await dialog.showOpenDialog(parentWin, {
    title: 'Select map background image',
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'bmp'] }],
    properties: ['openFile'],
  });
  if (result.canceled || !result.filePaths[0]) return null;
  const filePath = result.filePaths[0];
  saveMapImagePath(slug, filePath);
  return fileToDataUrl(filePath);
});

ipcMain.handle('load-saved-map-image', (_, slug) => {
  // Check user custom image first
  const paths = loadMapImagePaths();
  if (paths[slug] && fs.existsSync(paths[slug])) {
    return fileToDataUrl(paths[slug]);
  }
  // Check download cache
  const cached = path.join(getMapCacheDir(), slug + '.jpg');
  if (fs.existsSync(cached)) {
    return fileToDataUrl(cached);
  }
  return null;
});

ipcMain.on('clear-map-image', (_, slug) => {
  saveMapImagePath(slug, null);
});

// ===== MAP IMAGE AUTO-DOWNLOAD =====
const MAP_IMAGE_WIKI_FILES = {
  'the-island':     'The_Island_Topographic_Map.jpg',
  'scorched-earth': 'Scorched_Earth_Topographic_Map.jpg',
  'aberration':     'Aberration_Topographic_Map.jpg',
  'extinction':     'Extinction_Topographic_Map.jpg',
  'ragnarok':       'Ragnarok_Topographic_Map.jpg',
  'valguero':       'Valguero_Topographic_Map.jpg',
  'genesis':        'Genesis_Part_1_Map.jpg',
  'genesis-2':      'Genesis_Part_2_Map.jpg',
  'crystal-isles':  'Crystal_Isles_Topographic_Map.jpg',
  'lost-island':    'Lost_Island_map.jpg',
  'fjordur':        'Fjordur_Map.jpg',
  'the-center':     'The_Center_Topographic_Map.jpg',
  'astraeos':       'Astraeos_Topographic_Map.jpg',
};

function getMapCacheDir() {
  const dir = path.join(app.getPath('userData'), 'map-cache');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function httpFollow(url, binary) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'ARK-Taming-Companion/2.0' }, timeout: 15000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let loc = res.headers.location;
        if (loc.startsWith('//')) loc = 'https:' + loc;
        else if (loc.startsWith('/')) loc = new URL(url).origin + loc;
        httpFollow(loc, binary).then(resolve).catch(reject);
        res.resume();
        return;
      }
      if (res.statusCode !== 200) { res.resume(); reject(new Error('HTTP ' + res.statusCode)); return; }
      if (binary) {
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      } else {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => resolve(data));
      }
      res.on('error', reject);
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

async function downloadAndCacheMapImage(slug) {
  const cached = path.join(getMapCacheDir(), slug + '.jpg');
  if (fs.existsSync(cached)) return fileToDataUrl(cached);

  const wikiFile = MAP_IMAGE_WIKI_FILES[slug];
  if (!wikiFile) return null;

  try {
    // Query wiki API for the real image URL
    const apiUrl = 'https://ark.wiki.gg/api.php?action=query&titles=File:' +
      encodeURIComponent(wikiFile) + '&prop=imageinfo&iiprop=url&format=json';
    const apiText = await httpFollow(apiUrl, false);
    const apiData = JSON.parse(apiText);
    const pages = apiData.query.pages;
    const pageId = Object.keys(pages)[0];
    if (!pages[pageId].imageinfo || !pages[pageId].imageinfo[0]) return null;
    const imageUrl = pages[pageId].imageinfo[0].url;

    // Download the image binary
    const imageData = await httpFollow(imageUrl, true);
    fs.writeFileSync(cached, imageData);
    return fileToDataUrl(cached);
  } catch (e) {
    return null;
  }
}

ipcMain.handle('download-map-image', async (_, slug) => {
  return await downloadAndCacheMapImage(slug);
});

// ===== BREEDING WINDOW =====
function isBreedingAlive() { return breedingWindow && !breedingWindow.isDestroyed(); }

function safeDestroyBreeding() {
  try { if (isBreedingAlive()) breedingWindow.destroy(); } catch (e) {}
  breedingWindow = null;
}

function createBreedingWindow() {
  console.log('[Breeding] createBreedingWindow called');
  if (isBreedingAlive()) { breedingWindow.focus(); return; }
  breedingWindow = null;

  const breedingPath = path.join(__dirname, '..', 'shell', 'breeding-window.html');
  console.log('[Breeding] Loading file:', breedingPath);
  console.log('[Breeding] File exists:', fs.existsSync(breedingPath));

  breedingWindow = new BrowserWindow({
    width: 960, height: 700, minWidth: 700, minHeight: 500,
    frame: false, backgroundColor: '#000000',
    alwaysOnTop: false, resizable: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false,
    },
    icon: APP_ICON,
  });

  // Allow loading images from ark.wiki.gg
  breedingWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ["default-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; img-src 'self' https://ark.wiki.gg https://*.wiki.gg data:; connect-src 'self' https://ark.wiki.gg https://*.wiki.gg"]
      }
    });
  });

  breedingWindow.loadFile(breedingPath);
  breedingWindow.once('ready-to-show', () => {
    console.log('[Breeding] Window ready-to-show');
    if (isBreedingAlive()) breedingWindow.show();
  });

  breedingWindow.on('closed', () => {
    breedingWindow = null;
    // Notify main window so button state updates
    try {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('breeding-window-closed');
      }
    } catch (e) {}
  });
  breedingWindow.webContents.on('destroyed', () => { breedingWindow = null; });

  // Log any renderer errors
  breedingWindow.webContents.on('crashed', () => {
    console.error('[Breeding] Renderer crashed!');
    breedingWindow = null;
  });
  breedingWindow.webContents.on('did-fail-load', (_, code, desc) => {
    console.error('[Breeding] Failed to load:', code, desc);
  });
}

// Breeding IPC
ipcMain.on('open-breeding', () => createBreedingWindow());
ipcMain.on('close-breeding', () => safeDestroyBreeding());
ipcMain.on('breeding-close', () => safeDestroyBreeding());
ipcMain.handle('is-breeding-open', () => isBreedingAlive());

// Breeding data persistence
function getBreedingDataPath() {
  return path.join(app.getPath('userData'), 'breeding-data.json');
}

ipcMain.handle('load-breeding-data', () => {
  try {
    const filePath = getBreedingDataPath();
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (e) {}
  return null;
});

ipcMain.on('save-breeding-data', (_, data) => {
  try {
    fs.writeFileSync(getBreedingDataPath(), JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {}
});

ipcMain.handle('export-breeding-data', async () => {
  try {
    const result = await dialog.showSaveDialog(isBreedingAlive() ? breedingWindow : mainWindow, {
      title: 'Exporter les données de breeding',
      defaultPath: 'ark-breeding-data.json',
      filters: [{ name: 'JSON', extensions: ['json'] }, { name: 'CSV', extensions: ['csv'] }],
    });
    if (result.canceled || !result.filePath) return null;
    return result.filePath;
  } catch (e) { return null; }
});

ipcMain.on('write-export-file', (_, filePath, content) => {
  try { fs.writeFileSync(filePath, content, 'utf8'); } catch (e) {}
});

ipcMain.on('breeding-toggle-pin', () => {
  if (isBreedingAlive()) {
    const pinned = breedingWindow.isAlwaysOnTop();
    breedingWindow.setAlwaysOnTop(!pinned, pinned ? undefined : 'floating');
    breedingWindow.webContents.send('breeding-pin-changed', !pinned);
  }
});

// ===== PIN TOGGLE FOR ALL WINDOWS =====
ipcMain.on('timer-toggle-pin', () => {
  if (isTimerAlive()) {
    const pinned = timerWindow.isAlwaysOnTop();
    timerWindow.setAlwaysOnTop(!pinned, pinned ? undefined : 'screen-saver');
    timerWindow.webContents.send('timer-pin-changed', !pinned);
  }
});

ipcMain.on('settings-toggle-pin', () => {
  if (isSettingsAlive()) {
    const pinned = settingsWindow.isAlwaysOnTop();
    settingsWindow.setAlwaysOnTop(!pinned, pinned ? undefined : 'floating');
    settingsWindow.webContents.send('settings-pin-changed', !pinned);
  }
});

// ===== TRIBE TASKS WINDOW =====
function isTribeAlive() { return tribeWindow && !tribeWindow.isDestroyed(); }
function safeDestroyTribe() {
  try { if (isTribeAlive()) tribeWindow.destroy(); } catch (e) {}
  tribeWindow = null;
}

function createTribeWindow() {
  if (isTribeAlive()) { tribeWindow.focus(); return; }
  tribeWindow = new BrowserWindow({
    width: 700, height: 600, minWidth: 500, minHeight: 400,
    frame: false, backgroundColor: '#000000',
    alwaysOnTop: false, resizable: true, show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false,
    },
    icon: APP_ICON,
  });
  // Allow jsonblob.com and npoint.io for cloud sync
  tribeWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ["default-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; img-src * data:; connect-src 'self' https://jsonblob.com https://api.npoint.io https://*.npoint.io;"]
      }
    });
  });
  tribeWindow.loadFile(path.join(__dirname, '..', 'shell', 'tribe-tasks.html'));
  tribeWindow.once('ready-to-show', () => { if (isTribeAlive()) tribeWindow.show(); });
  tribeWindow.on('closed', () => { tribeWindow = null; });
}

ipcMain.on('open-tribe', () => createTribeWindow());
ipcMain.on('tribe-close', () => safeDestroyTribe());
ipcMain.handle('is-tribe-open', () => isTribeAlive());
ipcMain.on('tribe-toggle-pin', () => {
  if (isTribeAlive()) {
    const pinned = tribeWindow.isAlwaysOnTop();
    tribeWindow.setAlwaysOnTop(!pinned, pinned ? undefined : 'floating');
    tribeWindow.webContents.send('tribe-pin-changed', !pinned);
  }
});

// Tribe data persistence (local backup)
function getTribeDataPath() { return path.join(app.getPath('userData'), 'tribe-data.json'); }
ipcMain.handle('load-tribe-data', () => {
  try {
    const fp = getTribeDataPath();
    if (fs.existsSync(fp)) return JSON.parse(fs.readFileSync(fp, 'utf8'));
  } catch (e) {}
  return null;
});
ipcMain.on('save-tribe-data', (_, data) => {
  try { fs.writeFileSync(getTribeDataPath(), JSON.stringify(data, null, 2), 'utf8'); } catch (e) {}
});

// Sync breeding library to tribe
ipcMain.handle('sync-breeding-to-tribe', (_, creatures, pseudo) => {
  try {
    const tribeFp = getTribeDataPath();
    if (!fs.existsSync(tribeFp)) return { ok: false, error: 'no-tribe' };
    const tribe = JSON.parse(fs.readFileSync(tribeFp, 'utf8'));
    if (!tribe || !tribe.tribeCode) return { ok: false, error: 'no-tribe' };
    if (!tribe.breedingLibrary) tribe.breedingLibrary = [];
    // Merge: replace existing from same user, add new
    const others = tribe.breedingLibrary.filter(c => c.syncedBy !== pseudo);
    const synced = creatures.map(c => ({ ...c, syncedBy: pseudo, syncedAt: Date.now() }));
    tribe.breedingLibrary = [...others, ...synced];
    fs.writeFileSync(tribeFp, JSON.stringify(tribe, null, 2), 'utf8');
    // Notify tribe window if open
    if (tribeWindow && !tribeWindow.isDestroyed()) {
      tribeWindow.webContents.send('tribe-breeding-updated', tribe.breedingLibrary);
    }
    return { ok: true, count: synced.length };
  } catch (e) { return { ok: false, error: e.message }; }
});

// ===== OCR WINDOW =====
function isOCRAlive() { return ocrWindow && !ocrWindow.isDestroyed(); }
function safeDestroyOCR() {
  try { if (isOCRAlive()) ocrWindow.destroy(); } catch (e) {}
  ocrWindow = null;
}

function createOCRWindow() {
  if (isOCRAlive()) { ocrWindow.focus(); return; }
  ocrWindow = new BrowserWindow({
    width: 380, height: 500,
    frame: false, resizable: true, minimizable: true,
    transparent: true,
    backgroundColor: '#00000000',
    alwaysOnTop: true,
    skipTaskbar: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false,
    },
  });

  // Allow Tesseract.js CDN and ark.wiki.gg images
  ocrWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ["default-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://cdn.jsdelivr.net; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://cdn.jsdelivr.net; worker-src 'self' blob:; img-src * data: blob:; connect-src 'self' https://cdn.jsdelivr.net https://tessdata.projectnaptha.com https://ark.wiki.gg https://*.wiki.gg blob:;"]
      }
    });
  });

  ocrWindow.loadFile(path.join(__dirname, '..', 'shell', 'ocr-window.html'));
  ocrWindow.setAlwaysOnTop(true, 'screen-saver');
  ocrWindow.on('closed', () => { ocrWindow = null; });

  // Position in top-right corner
  const { width: sw } = screen.getPrimaryDisplay().workAreaSize;
  ocrWindow.setPosition(sw - 390, 10);
}

ipcMain.on('open-ocr', () => createOCRWindow());
ipcMain.on('ocr-close', () => safeDestroyOCR());
ipcMain.handle('is-ocr-open', () => isOCRAlive());

// Legacy screen capture (kept for backward compat)
ipcMain.handle('capture-screen', async () => {
  try {
    const primary = screen.getPrimaryDisplay();
    const { width, height } = primary.size;
    const scaleFactor = primary.scaleFactor || 1;
    const captureW = Math.round(width * scaleFactor);
    const captureH = Math.round(height * scaleFactor);
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: captureW, height: captureH }
    });
    if (sources.length > 0) {
      return sources[0].thumbnail.toDataURL();
    }
    return null;
  } catch (e) {
    return null;
  }
});

// One-click screenshot: hide OCR overlay briefly, capture screen via PowerShell, restore
ipcMain.handle('take-screenshot', async () => {
  const { exec } = require('child_process');
  const tmpPath = path.join(app.getPath('temp'), 'overseer-screenshot.png');

  // Only hide the OCR overlay briefly so it doesn't appear in screenshot
  const ocrWasVisible = isOCRAlive() && ocrWindow.isVisible();
  if (ocrWasVisible) ocrWindow.hide();

  // Wait for OCR to hide
  await new Promise(r => setTimeout(r, 300));

  try {
    const dataUrl = await new Promise((resolve, reject) => {
      const psPath = tmpPath.replace(/\\/g, '\\\\');
      const ps = `Add-Type -AssemblyName System.Windows.Forms; Add-Type -AssemblyName System.Drawing; $screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds; $bitmap = New-Object System.Drawing.Bitmap($screen.Width, $screen.Height); $graphics = [System.Drawing.Graphics]::FromImage($bitmap); $graphics.CopyFromScreen($screen.Location, [System.Drawing.Point]::Empty, $screen.Size); $bitmap.Save('${psPath}'); $graphics.Dispose(); $bitmap.Dispose();`;
      exec(`powershell -command "${ps}"`, (err) => {
        if (err) return reject(err);
        try {
          const data = fs.readFileSync(tmpPath);
          resolve('data:image/png;base64,' + data.toString('base64'));
        } catch (readErr) {
          reject(readErr);
        }
      });
    });

    // Restore OCR overlay
    if (ocrWasVisible && isOCRAlive()) ocrWindow.show();

    // Clean up temp file
    try { fs.unlinkSync(tmpPath); } catch (e) {}

    return dataUrl;
  } catch (e) {
    // Restore OCR even on error
    if (ocrWasVisible && isOCRAlive()) ocrWindow.show();
    try { fs.unlinkSync(tmpPath); } catch (e2) {}
    throw e;
  }
});

// Legacy OCR processing (kept for backward compat, new OCR runs in renderer via Tesseract.js CDN)
ipcMain.handle('run-ocr', async (event, dataUrl) => {
  try {
    const Tesseract = require('tesseract.js');
    const worker = await Tesseract.createWorker('eng+fra', 1, {
      logger: (info) => {
        if (info.status === 'recognizing text' && info.progress !== undefined) {
          try {
            if (isOCRAlive()) {
              ocrWindow.webContents.send('ocr-progress', Math.round(info.progress * 100));
            }
          } catch (e) {}
        }
      }
    });
    await worker.setParameters({
      tessedit_pageseg_mode: '4',
      preserve_interword_spaces: '1',
    });
    const { data } = await worker.recognize(dataUrl);
    await worker.terminate();
    return {
      text: data.text,
      confidence: Math.round(data.confidence),
      words: data.words ? data.words.map(w => ({
        text: w.text, confidence: Math.round(w.confidence),
        bbox: w.bbox ? { x0: w.bbox.x0, y0: w.bbox.y0, x1: w.bbox.x1, y1: w.bbox.y1 } : null
      })) : []
    };
  } catch (e) {
    throw new Error('OCR failed: ' + e.message);
  }
});

// Send creature to breeding library DB and notify breeding window
ipcMain.handle('send-to-breeding', async (event, creatureData) => {
  const dbPath = getBreedingDataPath();
  let db = { creatures: [], nextId: 1, config: {} };
  try {
    if (fs.existsSync(dbPath)) {
      db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    }
  } catch (e) {}
  if (!db.creatures) db.creatures = [];
  if (!db.nextId) db.nextId = 1;

  creatureData.id = db.nextId++;
  db.creatures.push(creatureData);
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');

  // Notify breeding window if open
  if (isBreedingAlive()) {
    breedingWindow.webContents.send('breeding-data-updated', db);
  }
  return { success: true, id: creatureData.id };
});

// Legacy: Send OCR stats to breeding window (kept for backward compat)
ipcMain.on('send-ocr-to-breeding', (_, stats) => {
  if (isBreedingAlive()) {
    breedingWindow.webContents.send('ocr-stats-received', stats);
  } else {
    createBreedingWindow();
    setTimeout(() => {
      if (isBreedingAlive()) {
        breedingWindow.webContents.send('ocr-stats-received', stats);
      }
    }, 1500);
  }
});
