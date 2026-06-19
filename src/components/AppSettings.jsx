import React, { useMemo, useState } from 'react';
import {
  CheckIcon,
  ClipboardIcon,
  ShieldIcon,
  SparklesIcon,
  TekSettingsIcon,
  TekWidgetIcon,
  ZapIcon,
} from './Icons';

const THEMES = [
  {
    id: 'blackglass',
    name: 'Black Glass',
    tone: 'Thème principal',
    description: 'Noir glass transparent, reflets or, violet profond et bleu ultraviolet subtil. C’est le rendu officiel par défaut.',
    swatches: ['#010104', '#d9c07a', '#8f7bff', '#79d7ff'],
  },
  {
    id: 'overseer',
    name: 'Tek Violet',
    tone: 'Variante plus lumineuse',
    description: 'Même interface, mais avec plus de violet et de bleu Tek pour ceux qui veulent un rendu plus énergique.',
    swatches: ['#9d70ff', '#e8be5c', '#68b8ff', '#05040d'],
  },
  {
    id: 'mutagen',
    name: 'Mutagen',
    tone: 'Mutation sombre',
    description: 'Accent mutation plus marqué, violet dense et or discret. À utiliser si tu veux un thème plus expérimental.',
    swatches: ['#070511', '#5d39db', '#b06cff', '#f0c76b'],
  },
];

const SCALE_OPTIONS = ['90%', '100%', '110%', '125%'];

export default function AppSettings({ theme = 'blackglass', onThemeChange }) {
  const [activeSection, setActiveSection] = useState('appearance');
  const currentTheme = useMemo(() => THEMES.find(t => t.id === theme) || THEMES[0], [theme]);

  return (
    <div className="settings-page">
      <aside className="settings-nav">
        <div>
          <span className="settings-kicker">OVERSEER</span>
          <h1>Paramètres</h1>
          <p>Contrôle l’interface, les préférences et les modules sans quitter l’app.</p>
        </div>

        <button className={activeSection === 'appearance' ? 'active' : ''} onClick={() => setActiveSection('appearance')}>
          <SparklesIcon size={16} />
          Apparence
        </button>
        <button className={activeSection === 'interface' ? 'active' : ''} onClick={() => setActiveSection('interface')}>
          <TekWidgetIcon size={16} />
          Interface
        </button>
        <button className={activeSection === 'shortcuts' ? 'active' : ''} onClick={() => setActiveSection('shortcuts')}>
          <ZapIcon size={16} />
          Raccourcis
        </button>
        <button className={activeSection === 'data' ? 'active' : ''} onClick={() => setActiveSection('data')}>
          <ShieldIcon size={16} />
          Données
        </button>
      </aside>

      <main className="settings-main">
        <section className="settings-hero">
          <div>
            <span className="settings-kicker">{activeSection === 'appearance' ? 'Module thème' : 'Préférences'}</span>
            <h2>{activeSection === 'appearance' ? 'Thème & couleur' : sectionTitle(activeSection)}</h2>
            <p>
              {activeSection === 'appearance'
                ? 'Change uniquement le ton de couleur. La structure, le glass, les animations et la navigation restent identiques.'
                : 'Réglages rapides pour garder l’app propre, lisible et prête pour une release.'}
            </p>
          </div>
          <div className="settings-current-theme">
            <span>Thème actif</span>
            <strong>{currentTheme.name}</strong>
            <small>{currentTheme.tone}</small>
          </div>
        </section>

        {activeSection === 'appearance' && (
          <>
            <section className="settings-panel">
              <div className="settings-panel-head">
                <div>
                  <span className="settings-kicker">Couleurs</span>
                  <h3>Choisir un thème</h3>
                </div>
                <span className="settings-pill">Défaut : Black Glass</span>
              </div>

              <div className="theme-grid">
                {THEMES.map(item => (
                  <button
                    key={item.id}
                    className={`theme-card ${theme === item.id ? 'active' : ''}`}
                    onClick={() => onThemeChange?.(item.id)}
                  >
                    <span className="theme-preview" style={{ background: `linear-gradient(135deg, ${item.swatches.join(', ')})` }} />
                    <span className="theme-copy">
                      <strong>{item.name}</strong>
                      <small>{item.description}</small>
                    </span>
                    <span className="theme-swatches">
                      {item.swatches.map(color => <i key={color} style={{ background: color }} />)}
                    </span>
                    {theme === item.id && <span className="theme-check"><CheckIcon size={13} /> Actif</span>}
                  </button>
                ))}
              </div>
            </section>

            <section className="settings-panel settings-preview-panel">
              <div className="settings-panel-head">
                <div>
                  <span className="settings-kicker">Aperçu</span>
                  <h3>Rendu interface</h3>
                </div>
              </div>
              <div className="settings-preview">
                <div className="settings-preview-sidebar">
                  <span />
                  <span className="active" />
                  <span />
                </div>
                <div className="settings-preview-content">
                  <div className="settings-preview-card wide" />
                  <div className="settings-preview-row">
                    <div />
                    <div />
                    <div />
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {activeSection === 'interface' && (
          <section className="settings-panel settings-form-grid">
            <SettingTile title="Échelle interface" icon={<TekSettingsIcon size={16} />}>
              <div className="settings-chip-row">
                {SCALE_OPTIONS.map(option => <button key={option}>{option}</button>)}
              </div>
            </SettingTile>
            <SettingTile title="Mode fenêtres" icon={<TekWidgetIcon size={16} />}>
              <p>La fenêtre principale utilise la barre OVERSEER custom. Les widgets restent en overlay transparent.</p>
            </SettingTile>
            <SettingTile title="Animations" icon={<SparklesIcon size={16} />}>
              <label className="settings-toggle"><input type="checkbox" defaultChecked /> Effets énergie activés</label>
            </SettingTile>
          </section>
        )}

        {activeSection === 'shortcuts' && (
          <section className="settings-panel">
            <div className="shortcut-list">
              {[
                ['Alt+B', 'Smart Breeding'],
                ['Alt+M', 'Timer Overlay'],
                ['Alt+W', 'Widget Mini'],
                ['Alt+L', 'Quick Lookup'],
              ].map(([key, label]) => (
                <div className="shortcut-row" key={key}>
                  <kbd>{key}</kbd>
                  <span>{label}</span>
                  <button>Modifier</button>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeSection === 'data' && (
          <section className="settings-panel settings-form-grid">
            <SettingTile title="Sauvegardes locales" icon={<ClipboardIcon size={16} />}>
              <p>Profils, favoris, presets d’armes, tribus et préférences restent sauvegardés localement.</p>
            </SettingTile>
            <SettingTile title="Cloud" icon={<ShieldIcon size={16} />}>
              <p>Le module cloud sera utilisé pour compte, sync et tribus partagées.</p>
            </SettingTile>
          </section>
        )}
      </main>
    </div>
  );
}

function SettingTile({ title, icon, children }) {
  return (
    <div className="settings-tile">
      <div className="settings-tile-title">
        <span>{icon}</span>
        <strong>{title}</strong>
      </div>
      {children}
    </div>
  );
}

function sectionTitle(section) {
  if (section === 'interface') return 'Interface';
  if (section === 'shortcuts') return 'Raccourcis';
  if (section === 'data') return 'Données & stockage';
  return 'Paramètres';
}
