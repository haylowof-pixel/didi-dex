(function applyOverseerShellTheme() {
  var key = 'overseer-ui-theme';
  var migrationKey = 'overseer-ui-theme-default-blackglass-v1';
  function normalize(theme) {
    return ['overseer', 'blackglass', 'mutagen'].indexOf(theme) >= 0 ? theme : 'blackglass';
  }

  function apply(theme) {
    theme = normalize(theme);
    try { localStorage.setItem(key, theme); } catch (_) {}
    document.documentElement.dataset.overseerTheme = theme;
    if (document.body) {
      document.body.dataset.overseerTheme = theme;
    }
  }

  var theme = 'blackglass';
  try {
    var params = new URLSearchParams(window.location.search || '');
    theme = params.get('theme') || localStorage.getItem(key) || theme;
    if (theme === 'overseer' && !localStorage.getItem(migrationKey) && !params.get('theme')) {
      theme = 'blackglass';
      localStorage.setItem(key, theme);
      localStorage.setItem(migrationKey, '1');
    }
  } catch (_) {}

  window.__OVERSEER_SET_THEME__ = apply;
  document.documentElement.dataset.overseerTheme = normalize(theme);
  if (document.body) {
    apply(theme);
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      apply(theme);
    }, { once: true });
  }
})();
