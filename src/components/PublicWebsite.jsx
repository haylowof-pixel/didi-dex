import React, { useEffect } from 'react';
import { ClipboardIcon, DnaIcon, LogoIcon, ServerIcon, ShieldIcon, SkullIcon, SparklesIcon, TimerIcon, ZapIcon } from './Icons';

const releaseUrl = 'https://github.com/haylowof-pixel/overseer-companion/releases/latest';

const featureRows = [
  { Icon: DnaIcon, title: 'Smart Breeding', text: 'Extraction de stats, lignées, mutations et décisions de reproduction lisibles au lieu de tableaux confus.' },
  { Icon: ClipboardIcon, title: 'Tribe Cloud', text: 'Tâches de tribu, assignations, runs et synchronisation cloud pour arrêter les captures Discord perdues.' },
  { Icon: SkullIcon, title: 'Boss Tribute Planner', text: 'Préparation boss par map, difficulté, tributes, armée conseillée et readiness avant le lancement.' },
];

const previewRows = [
  ['Broodmother Lysrix', '72%', 'Artifacts 8/10'],
  ['Megapithecus', '45%', 'Trophies 4/7'],
  ['Dragon', '18%', 'Raid prep 3/11'],
  ['Overseer', '0%', 'Tek cave plan'],
];

export default function PublicWebsite() {
  useEffect(() => {
    document.documentElement.classList.add('public-web-root');
    document.body.classList.add('public-web-body');
    return () => {
      document.documentElement.classList.remove('public-web-root');
      document.body.classList.remove('public-web-body');
    };
  }, []);

  return (
    <main className="public-site">
      <video className="public-video" autoPlay muted loop playsInline>
        <source src="./splash-video.mp4" type="video/mp4" />
      </video>
      <div className="public-shade" />

      <header className="public-nav">
        <a className="public-brand" href="#">
          <LogoIcon size={34} />
          <span>OVERSEER</span>
        </a>
        <nav>
          <a href="#download">Download</a>
          <a href="#cloud">Cloud Sync</a>
          <a href="#support">Support</a>
        </nav>
        <a className="public-nav-cta" href={releaseUrl}>Télécharger Windows</a>
      </header>

      <section className="public-hero" id="download">
        <div className="public-hero-copy">
          <h1>OVERSEER Companion</h1>
          <p>Taming, breeding, tribe planning and boss prep for ARK players.</p>
          <div className="public-actions">
            <a className="public-primary" href={releaseUrl}>Télécharger Windows</a>
            <a className="public-secondary" href="#cloud">Voir le cloud</a>
          </div>
          <div className="public-proof">
            <span><ZapIcon size={15} /> Freemium launch</span>
            <span><ShieldIcon size={15} /> Cloudflare sync</span>
            <span><TimerIcon size={15} /> Overlay timers</span>
          </div>
        </div>

        <div className="public-product" aria-label="OVERSEER product preview">
          <div className="public-product-bar">
            <span />
            <strong>Boss readiness</strong>
            <em>Live preview</em>
          </div>
          <div className="public-product-grid">
            <div className="public-ring">
              <strong>72%</strong>
              <span>Ready</span>
            </div>
            <div className="public-mini-list">
              {previewRows.map(row => (
                <div key={row[0]}>
                  <img src={`./tribute/official-${row[0].split(' ')[0].toLowerCase().replace('broodmother', 'broodmother')}.png`} alt="" onError={event => { event.currentTarget.style.display = 'none'; }} />
                  <strong>{row[0]}</strong>
                  <span>{row[2]}</span>
                  <em>{row[1]}</em>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="public-features" id="cloud">
        <div className="public-section-head">
          <h2>Le site présente le produit. L’app fait le travail.</h2>
          <p>On garde le web propre et rapide : pas de modules internes collés dans le navigateur, pas de sidebar d’app, pas de fenêtre Electron.</p>
        </div>
        <div className="public-feature-grid">
          {featureRows.map(({ Icon, title, text }) => (
            <article key={title}>
              <Icon size={24} />
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="public-cloud-strip">
        <div>
          <ServerIcon size={26} />
          <h2>Comptes et données hébergées 24/7</h2>
          <p>L’inscription et les données de tribu passent par Cloudflare Workers + D1. Le site reste léger, l’app desktop garde les outils avancés.</p>
        </div>
          <a className="public-secondary" href={releaseUrl}>Dernière release</a>
      </section>

      <footer className="public-footer" id="support">
        <span>OVERSEER Companion</span>
        <div>
          <a href={releaseUrl}>GitHub release</a>
          <a href="https://overseer-api.overseer-companion.workers.dev/health">API status</a>
        </div>
      </footer>
    </main>
  );
}
