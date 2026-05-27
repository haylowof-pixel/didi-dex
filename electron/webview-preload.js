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

function subscribe(channel, cb) {
  const listener = (_, ...args) => {
    if (typeof cb === 'function') cb(...args);
  };
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
}

contextBridge.exposeInMainWorld('api', {
  // Window chrome (no-ops in embedded context, but harmless)
  minimize:       () => ipcRenderer.send('win-minimize'),
  maximize:       () => ipcRenderer.send('win-maximize'),
  close:          () => ipcRenderer.send('win-close'),
  toggleOverlay:  () => ipcRenderer.send('toggle-overlay'),
  setOpacity:     (v) => ipcRenderer.send('set-opacity', v),
  getOverlay:     () => ipcRenderer.invoke('get-overlay'),
  onOverlay:      (cb) => subscribe('overlay-changed', cb),
  resizeWindow:   (preset) => ipcRenderer.send('resize-window', preset),

  // Timer
  openTimerOverlay:  () => ipcRenderer.send('open-timer-overlay'),
  closeTimerOverlay: () => ipcRenderer.send('close-timer-overlay'),
  isTimerOpen:       () => ipcRenderer.invoke('is-timer-open'),
  timerClose:        () => ipcRenderer.send('timer-close'),
  syncTimerData:     (data) => ipcRenderer.send('sync-timer-data', data),
  onTimerDataUpdate: (cb) => subscribe('timer-data-update', cb),
  setIgnoreMouseEvents: (ignore, opts) => ipcRenderer.send('timer-set-ignore-mouse', ignore, opts),
  onClickThroughChanged: (cb) => subscribe('click-through-changed', cb),
  resizeTimer:       (preset) => ipcRenderer.send('resize-timer', preset),
  timerTogglePin:    () => ipcRenderer.send('timer-toggle-pin'),
  onTimerPinChanged: (cb) => subscribe('timer-pin-changed', cb),

  // Maps
  openMapsWindow:    (slug, name) => ipcRenderer.send('open-maps-window', slug, name),
  closeMapsWindow:   () => ipcRenderer.send('close-maps-window'),
  mapsClose:         () => ipcRenderer.send('maps-close'),
  isMapsOpen:        () => ipcRenderer.invoke('is-maps-open'),
  changeMap:         (slug, name) => ipcRenderer.send('change-map', slug, name),
  onMapChange:       (cb) => subscribe('map-change', cb),
  mapsSetOpacity:    (v) => ipcRenderer.send('maps-set-opacity', v),
  mapsTogglePin:     () => ipcRenderer.send('maps-toggle-pin'),
  onPinChanged:      (cb) => subscribe('pin-changed', cb),
  selectMapImage:    (slug) => ipcRenderer.invoke('select-map-image', slug),
  loadSavedMapImage: (slug) => ipcRenderer.invoke('load-saved-map-image', slug),
  clearMapImage:     (slug) => ipcRenderer.send('clear-map-image', slug),
  downloadMapImage:  (slug) => ipcRenderer.invoke('download-map-image', slug),

  // Widget
  openWidget:        () => ipcRenderer.send('open-widget'),
  closeWidget:       () => ipcRenderer.send('close-widget'),
  widgetClose:       () => ipcRenderer.send('widget-close'),
  isWidgetOpen:      () => ipcRenderer.invoke('is-widget-open'),
  onWidgetDataUpdate:(cb) => subscribe('widget-data-update', cb),
  onWidgetClickThroughChanged: (cb) => subscribe('widget-click-through-changed', cb),
  widgetSetMode:     (mode, w, h) => ipcRenderer.send('widget-set-mode', mode, w, h),
  onWidgetCycleMode: (cb) => subscribe('widget-cycle-mode', cb),
  getWidgetMode:     () => ipcRenderer.invoke('get-widget-mode'),
  onWidgetModeChanged: (cb) => subscribe('widget-mode-changed', cb),

  // Quick lookup
  openQuickLookup:   () => ipcRenderer.send('open-quick-lookup'),
  quickLookupClose:  () => ipcRenderer.send('quick-lookup-close'),
  isQuickLookupOpen: () => ipcRenderer.invoke('is-quick-lookup-open'),
  quickLookupResize: (height) => ipcRenderer.send('quick-lookup-resize', height),

  // OCR
  openOCR:           () => ipcRenderer.send('open-ocr'),
  ocrClose:          () => ipcRenderer.send('ocr-close'),
  isOCROpen:         () => ipcRenderer.invoke('is-ocr-open'),
  captureScreen:     () => ipcRenderer.invoke('capture-screen'),
  takeScreenshot:    () => ipcRenderer.invoke('take-screenshot'),
  runOCR:            (dataUrl) => ipcRenderer.invoke('run-ocr', dataUrl),
  onOCRProgress:     (cb) => subscribe('ocr-progress', cb),
  sendOCRToBreeding: (stats) => ipcRenderer.send('send-ocr-to-breeding', stats),
  sendToBreeding:    (creatureData) => ipcRenderer.invoke('send-to-breeding', creatureData),
  onOCRStatsReceived:(cb) => subscribe('ocr-stats-received', cb),
  onTriggerScan:     (cb) => subscribe('trigger-scan', cb),
  onBreedingDataUpdated: (cb) => subscribe('breeding-data-updated', cb),

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
  onBreedingPinChanged: (cb) => subscribe('breeding-pin-changed', cb),
  onBreedingWindowClosed: (cb) => subscribe('breeding-window-closed', cb),

  // Settings
  openSettings:      () => ipcRenderer.send('open-settings'),
  closeSettings:     () => ipcRenderer.send('close-settings'),
  settingsClose:     () => ipcRenderer.send('settings-close'),
  isSettingsOpen:    () => ipcRenderer.invoke('is-settings-open'),
  settingsTogglePin:    () => ipcRenderer.send('settings-toggle-pin'),
  onSettingsPinChanged: (cb) => subscribe('settings-pin-changed', cb),

  // Scale
  getScale:          () => ipcRenderer.invoke('get-scale'),
  setScale:          (val) => ipcRenderer.send('set-scale', val),

  // Keybinds
  getKeybinds:       () => ipcRenderer.invoke('get-keybinds'),
  saveKeybinds:      (bindings) => ipcRenderer.send('save-keybinds', bindings),
  onKeybindsChanged: (cb) => subscribe('keybinds-changed', cb),

  // Notifications
  showNotification:  (data) => ipcRenderer.send('show-notification', data),

  // Export/Import
  exportConfig:      () => ipcRenderer.invoke('export-config'),
  importConfig:      (json) => ipcRenderer.send('import-config', json),
  selectAsbImportFolder: () => ipcRenderer.invoke('select-asb-import-folder'),
  watchAsbImportFolder: () => ipcRenderer.invoke('watch-asb-import-folder'),
  stopAsbImportWatch: () => ipcRenderer.invoke('stop-asb-import-watch'),
  startAsbExportServer: (port) => ipcRenderer.invoke('start-asb-export-server', port),
  stopAsbExportServer: () => ipcRenderer.invoke('stop-asb-export-server'),
  onAsbImportFiles: (cb) => subscribe('asb-import-files', cb),

  // Tribe Tasks
  openTribe:         () => ipcRenderer.send('open-tribe'),
  tribeClose:        () => ipcRenderer.send('tribe-close'),
  isTribeOpen:       () => ipcRenderer.invoke('is-tribe-open'),
  tribeTogglePin:    () => ipcRenderer.send('tribe-toggle-pin'),
  onTribePinChanged: (cb) => subscribe('tribe-pin-changed', cb),
  loadTribeData:     () => ipcRenderer.invoke('load-tribe-data'),
  saveTribeData:     (data) => ipcRenderer.send('save-tribe-data', data),
  syncBreedingToTribe: (creatures, pseudo) => ipcRenderer.invoke('sync-breeding-to-tribe', creatures, pseudo),
  onTribeBreedingUpdated: (cb) => subscribe('tribe-breeding-updated', cb),

  // Preload path (for nested webviews – unlikely but keeps parity)
  getPreloadPath:    () => ipcRenderer.invoke('get-preload-path'),

  // Auto-Update
  checkForUpdates:   () => ipcRenderer.invoke('check-for-updates'),
  installUpdate:     () => ipcRenderer.send('install-update'),
  getAppVersion:     () => ipcRenderer.invoke('get-app-version'),
  onUpdateStatus:    (cb) => subscribe('update-status', cb),

  // Comparator (used by comparator-window.html)
  comparatorClose:       () => ipcRenderer.send('comparator-close'),
  comparatorTogglePin:   () => ipcRenderer.send('comparator-toggle-pin'),
  onComparatorPinChanged:(cb) => subscribe('comparator-pin-changed', cb),
  onComparatorDataUpdate:(cb) => subscribe('comparator-data-update', cb),
  onDinoPinned:          (cb) => subscribe('dino-pinned', cb),

  // Server Status
  fetchUrl:          (url) => ipcRenderer.invoke('fetch-url', url),
  loadFavServers:    () => ipcRenderer.invoke('load-fav-servers'),
  saveFavServers:    (data) => ipcRenderer.send('save-fav-servers', data),
  sendToHost:        (channel, ...args) => { try { ipcRenderer.sendToHost(channel, ...args); } catch(e){} },

  // GPS Tracker
  captureRegion:      (rect) => ipcRenderer.invoke('capture-region', rect),
  ocrCoordinates:     (dataUrl) => ipcRenderer.invoke('ocr-coordinates', dataUrl),
  loadTrackerConfig:  () => ipcRenderer.invoke('load-tracker-config'),
  saveTrackerConfig:  (cfg) => ipcRenderer.send('save-tracker-config', cfg),
  openRegionSelector: () => ipcRenderer.send('open-region-selector'),
  regionSelected:     (rect) => ipcRenderer.send('region-selected', rect),
  regionSelectorCancel: () => ipcRenderer.send('region-selector-cancel'),
  onTrackerRegionSet: (cb) => subscribe('tracker-region-set', cb),

  // Shared Markers
  shareMarkerToTribe: (marker) => ipcRenderer.invoke('share-marker-to-tribe', marker),
  onTribeMarkersUpdated: (cb) => subscribe('tribe-markers-updated', cb),
});
