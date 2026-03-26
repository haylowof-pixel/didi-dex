/**
 * Preload script for <webview> tags embedded in the main window.
 *
 * contextBridge.exposeInMainWorld works inside webview preloads when
 * contextIsolation is enabled.  We expose the same window.api surface
 * as the main preload.js so every shell HTML page works identically
 * whether it is loaded in a standalone BrowserWindow or inside a
 * <webview> element.
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Window chrome (no-ops in embedded context, but harmless)
  minimize:       () => ipcRenderer.send('win-minimize'),
  maximize:       () => ipcRenderer.send('win-maximize'),
  close:          () => ipcRenderer.send('win-close'),
  toggleOverlay:  () => ipcRenderer.send('toggle-overlay'),
  setOpacity:     (v) => ipcRenderer.send('set-opacity', v),
  getOverlay:     () => ipcRenderer.invoke('get-overlay'),
  onOverlay:      (cb) => ipcRenderer.on('overlay-changed', (_, v) => cb(v)),
  resizeWindow:   (preset) => ipcRenderer.send('resize-window', preset),

  // Timer
  openTimerOverlay:  () => ipcRenderer.send('open-timer-overlay'),
  closeTimerOverlay: () => ipcRenderer.send('close-timer-overlay'),
  isTimerOpen:       () => ipcRenderer.invoke('is-timer-open'),
  timerClose:        () => ipcRenderer.send('timer-close'),
  syncTimerData:     (data) => ipcRenderer.send('sync-timer-data', data),
  onTimerDataUpdate: (cb) => ipcRenderer.on('timer-data-update', (_, data) => cb(data)),
  setIgnoreMouseEvents: (ignore, opts) => ipcRenderer.send('timer-set-ignore-mouse', ignore, opts),
  onClickThroughChanged: (cb) => ipcRenderer.on('click-through-changed', (_, v) => cb(v)),
  resizeTimer:       (preset) => ipcRenderer.send('resize-timer', preset),
  timerTogglePin:    () => ipcRenderer.send('timer-toggle-pin'),
  onTimerPinChanged: (cb) => ipcRenderer.on('timer-pin-changed', (_, v) => cb(v)),

  // Maps
  openMapsWindow:    (slug, name) => ipcRenderer.send('open-maps-window', slug, name),
  closeMapsWindow:   () => ipcRenderer.send('close-maps-window'),
  mapsClose:         () => ipcRenderer.send('maps-close'),
  isMapsOpen:        () => ipcRenderer.invoke('is-maps-open'),
  changeMap:         (slug, name) => ipcRenderer.send('change-map', slug, name),
  onMapChange:       (cb) => ipcRenderer.on('map-change', (_, data) => cb(data)),
  mapsSetOpacity:    (v) => ipcRenderer.send('maps-set-opacity', v),
  mapsTogglePin:     () => ipcRenderer.send('maps-toggle-pin'),
  onPinChanged:      (cb) => ipcRenderer.on('pin-changed', (_, v) => cb(v)),
  selectMapImage:    (slug) => ipcRenderer.invoke('select-map-image', slug),
  loadSavedMapImage: (slug) => ipcRenderer.invoke('load-saved-map-image', slug),
  clearMapImage:     (slug) => ipcRenderer.send('clear-map-image', slug),
  downloadMapImage:  (slug) => ipcRenderer.invoke('download-map-image', slug),

  // Widget
  openWidget:        () => ipcRenderer.send('open-widget'),
  closeWidget:       () => ipcRenderer.send('close-widget'),
  widgetClose:       () => ipcRenderer.send('widget-close'),
  isWidgetOpen:      () => ipcRenderer.invoke('is-widget-open'),
  onWidgetDataUpdate:(cb) => ipcRenderer.on('widget-data-update', (_, data) => cb(data)),
  onWidgetClickThroughChanged: (cb) => ipcRenderer.on('widget-click-through-changed', (_, v) => cb(v)),
  widgetSetMode:     (mode, w, h) => ipcRenderer.send('widget-set-mode', mode, w, h),
  onWidgetCycleMode: (cb) => ipcRenderer.on('widget-cycle-mode', () => cb()),

  // OCR
  openOCR:           () => ipcRenderer.send('open-ocr'),
  ocrClose:          () => ipcRenderer.send('ocr-close'),
  isOCROpen:         () => ipcRenderer.invoke('is-ocr-open'),
  captureScreen:     () => ipcRenderer.invoke('capture-screen'),
  takeScreenshot:    () => ipcRenderer.invoke('take-screenshot'),
  runOCR:            (dataUrl) => ipcRenderer.invoke('run-ocr', dataUrl),
  onOCRProgress:     (cb) => ipcRenderer.on('ocr-progress', (_, pct) => cb(pct)),
  sendOCRToBreeding: (stats) => ipcRenderer.send('send-ocr-to-breeding', stats),
  sendToBreeding:    (creatureData) => ipcRenderer.invoke('send-to-breeding', creatureData),
  onOCRStatsReceived:(cb) => ipcRenderer.on('ocr-stats-received', (_, stats) => cb(stats)),
  onTriggerScan:     (cb) => ipcRenderer.on('trigger-scan', () => cb()),
  onBreedingDataUpdated: (cb) => ipcRenderer.on('breeding-data-updated', (_, data) => cb(data)),

  // Breeding
  openBreeding:      () => ipcRenderer.send('open-breeding'),
  closeBreeding:     () => ipcRenderer.send('close-breeding'),
  breedingClose:     () => ipcRenderer.send('breeding-close'),
  isBreedingOpen:    () => ipcRenderer.invoke('is-breeding-open'),
  loadBreedingData:  () => ipcRenderer.invoke('load-breeding-data'),
  saveBreedingData:  (data) => ipcRenderer.send('save-breeding-data', data),
  exportBreedingData:() => ipcRenderer.invoke('export-breeding-data'),
  writeExportFile:   (fp, c) => ipcRenderer.send('write-export-file', fp, c),
  breedingTogglePin: () => ipcRenderer.send('breeding-toggle-pin'),
  onBreedingPinChanged: (cb) => ipcRenderer.on('breeding-pin-changed', (_, v) => cb(v)),
  onBreedingWindowClosed: (cb) => ipcRenderer.on('breeding-window-closed', () => cb()),

  // Settings
  openSettings:      () => ipcRenderer.send('open-settings'),
  closeSettings:     () => ipcRenderer.send('close-settings'),
  settingsClose:     () => ipcRenderer.send('settings-close'),
  isSettingsOpen:    () => ipcRenderer.invoke('is-settings-open'),
  settingsTogglePin:    () => ipcRenderer.send('settings-toggle-pin'),
  onSettingsPinChanged: (cb) => ipcRenderer.on('settings-pin-changed', (_, v) => cb(v)),

  // Scale
  getScale:          () => ipcRenderer.invoke('get-scale'),
  setScale:          (val) => ipcRenderer.send('set-scale', val),

  // Keybinds
  getKeybinds:       () => ipcRenderer.invoke('get-keybinds'),
  saveKeybinds:      (bindings) => ipcRenderer.send('save-keybinds', bindings),
  onKeybindsChanged: (cb) => ipcRenderer.on('keybinds-changed', (_, data) => cb(data)),

  // Notifications
  showNotification:  (data) => ipcRenderer.send('show-notification', data),

  // Export/Import
  exportConfig:      () => ipcRenderer.invoke('export-config'),
  importConfig:      (json) => ipcRenderer.send('import-config', json),

  // Tribe Tasks
  openTribe:         () => ipcRenderer.send('open-tribe'),
  tribeClose:        () => ipcRenderer.send('tribe-close'),
  isTribeOpen:       () => ipcRenderer.invoke('is-tribe-open'),
  tribeTogglePin:    () => ipcRenderer.send('tribe-toggle-pin'),
  onTribePinChanged: (cb) => ipcRenderer.on('tribe-pin-changed', (_, v) => cb(v)),
  loadTribeData:     () => ipcRenderer.invoke('load-tribe-data'),
  saveTribeData:     (data) => ipcRenderer.send('save-tribe-data', data),
  syncBreedingToTribe: (creatures, pseudo) => ipcRenderer.invoke('sync-breeding-to-tribe', creatures, pseudo),
  onTribeBreedingUpdated: (cb) => ipcRenderer.on('tribe-breeding-updated', (_, data) => cb(data)),

  // Preload path (for nested webviews – unlikely but keeps parity)
  getPreloadPath:    () => ipcRenderer.invoke('get-preload-path'),

  // Auto-Update
  checkForUpdates:   () => ipcRenderer.invoke('check-for-updates'),
  installUpdate:     () => ipcRenderer.send('install-update'),
  getAppVersion:     () => ipcRenderer.invoke('get-app-version'),
  onUpdateStatus:    (cb) => ipcRenderer.on('update-status', (_, data) => cb(data)),

  // Comparator (used by comparator-window.html)
  comparatorClose:       () => ipcRenderer.send('comparator-close'),
  comparatorTogglePin:   () => ipcRenderer.send('comparator-toggle-pin'),
  onComparatorPinChanged:(cb) => ipcRenderer.on('comparator-pin-changed', (_, v) => cb(v)),
  onComparatorDataUpdate:(cb) => ipcRenderer.on('comparator-data-update', (_, data) => cb(data)),
  onDinoPinned:          (cb) => ipcRenderer.on('dino-pinned', (_, data) => cb(data)),
});
