import React, { useEffect } from 'react';
import { ClipboardIcon, DnaIcon, MapIcon, ScanIcon, ServerIcon, ShieldIcon, SkullIcon, TamingLassoIcon, TimerIcon, WidgetIcon, ZapIcon } from './Icons';

const releaseUrl = 'https://github.com/haylowof-pixel/overseer-companion/releases/latest';

const previewRows = [
  ['Broodmother Lysrix', '72%', 'Artifacts 8/10'],
  ['Megapithecus', '45%', 'Trophies 4/7'],
  ['Dragon', '18%', 'Raid prep 3/11'],
  ['Overseer', '0%', 'Tek cave plan'],
];

const featureStories = [
  {
    key: 'breeding',
    Icon: DnaIcon,
    title: 'Smart Breeding',
    text: 'Comprends les points sauvages, les mutations, les lignées et les candidats de reproduction sans ouvrir trois tableurs.',
    stats: ['HP 48', 'Melee 52', 'Mutations 3/20'],
    image: './site/screens/smart-breeding.png',
  },
  {
    key: 'taming',
    Icon: TamingLassoIcon,
    title: 'Taming Calculator',
    text: 'Nourriture, narcotiques, torpeur, starving timer et préparation de tame dans une lecture claire pour chaque créature.',
    stats: ['Kibble 17', 'Torpor 42m', 'Effectiveness 98.6%'],
    image: './site/screens/taming-calculator.png',
  },
  {
    key: 'tribute',
    Icon: SkullIcon,
    title: 'Boss Tribute Planner',
    text: 'Boss, artefacts, tributes, armée conseillée, assignations de tribu et readiness avant de lancer l’arène.',
    stats: ['Broodmother 72%', 'Artifacts 8/10', 'Raid prep 8/12'],
    image: './site/screens/tribute-planner.png',
  },
  {
    key: 'tribe',
    Icon: ClipboardIcon,
    title: 'Tribe Cloud Tasks',
    text: 'Une base commune pour les tâches de tribu, les runs, les priorités et les responsabilités de chaque joueur.',
    stats: ['Cloud sync', 'Invite code', 'Activity log'],
    image: './site/screens/tribe-tasks.png',
  },
  {
    key: 'ocr',
    Icon: ScanIcon,
    title: 'OCR Stat Scanner',
    text: 'Capture les stats affichées en jeu et prépare l’import vers l’extractor pour éviter la saisie manuelle.',
    stats: ['HP detected', 'Stamina parsed', 'Import ready'],
    image: './site/screens/ocr-scanner.png',
  },
  {
    key: 'quick-lookup',
    Icon: ScanIcon,
    title: 'Quick Lookup',
    text: 'Une mini barre flottante au-dessus du jeu pour chercher une créature et accéder vite aux infos de tame, food, narcotiques et torpeur.',
    stats: ['Floating search', 'Tame info', 'Alt + Q'],
    image: './site/screens/quick-lookup.png',
  },
  {
    key: 'servers',
    Icon: ServerIcon,
    title: 'Server Monitor',
    text: 'Garde tes serveurs favoris sous les yeux avec statut, joueurs, map, ping et accès rapide.',
    stats: ['Online', '64/70', '38 ms'],
    image: './site/screens/servers.png',
  },
  {
    key: 'maps',
    Icon: MapIcon,
    title: 'Maps & Locations',
    text: 'Prépare tes trajets, repères, caves, ressources et routes de farm avec une vue dédiée plutôt qu’un navigateur séparé.',
    stats: ['Caves', 'Resources', 'Pins'],
    image: './site/screens/maps.png',
  },
  {
    key: 'library',
    Icon: ShieldIcon,
    title: 'Creature Library',
    text: 'Une bibliothèque de créatures avec stats, favoris, notes, couleurs, timers et accès rapide aux espèces importantes.',
    stats: ['Favorites', 'Color regions', 'Creature notes'],
    image: './site/screens/taming-calculator.png',
  },
  {
    key: 'timer-widgets',
    Icon: WidgetIcon,
    title: 'Timer & Torpor Widgets',
    text: 'Widgets flottants pour suivre starve timer, torpor timer, narcotiques, bio toxin, maturation et imprint sans quitter ARK.',
    stats: ['Starve timer', 'Torpor widget', 'Always on top'],
    image: './site/screens/timer-widget.png',
  },
  {
    key: 'account',
    Icon: ServerIcon,
    title: 'Account & Cloud Sync',
    text: 'Connexion, profil, avatar, backup et données hébergées pour préparer la version web/mobile sans perdre le local.',
    stats: ['Login', 'Avatar', 'Backup sync'],
    image: './site/screens/account-cloud.png',
  },
];

function FeatureVisual({ story }) {
  if (story.image) {
    return (
      <figure className={`public-app-shot ${story.key}`}>
        <img src={story.image} alt={`Capture app ${story.title}`} />
      </figure>
    );
  }

  if (story.visual === 'boss') {
    return (
      <div className="public-boss-stack">
        {previewRows.map(row => (
          <div key={row[0]}>
            <img src={`./tribute/official-${row[0].split(' ')[0].toLowerCase()}.png`} alt="" />
            <span>{row[0]}</span>
            <strong>{row[1]}</strong>
          </div>
        ))}
      </div>
    );
  }

  if (story.visual === 'tasks') {
    return (
      <div className="public-task-board">
        {['Farm artifacts', 'Raise boss line', 'Craft med brews', 'Check saddles'].map((task, index) => (
          <div key={task} style={{ '--task-index': index }}>
            <i />
            <span>{task}</span>
            <em>{['KR', 'MI', 'SO', 'DA'][index]}</em>
          </div>
        ))}
      </div>
    );
  }

  if (story.visual === 'scan') {
    return (
      <div className="public-scan-frame">
        <span />
        <span />
        <strong>OCR</strong>
        <em>HP 12,430</em>
        <em>Weight 824</em>
        <em>Melee 421%</em>
      </div>
    );
  }

  if (story.visual === 'map') {
    return (
      <div className="public-map-grid">
        {Array.from({ length: 16 }, (_, index) => <span key={index} className={index % 5 === 0 ? 'hot' : ''} />)}
      </div>
    );
  }

  return (
    <div className={`public-module-visual ${story.visual}`}>
      {story.stats.map((stat, index) => (
        <span key={stat} style={{ '--line': index }}>
          <i />
          {stat}
        </span>
      ))}
    </div>
  );
}

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
          <img src="./icon-128.png" alt="" />
          <span>OVERSEER</span>
        </a>
        <nav>
          <a href="#download">Download</a>
          <a href="#features">Features</a>
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
            <a className="public-secondary" href="#features">Voir les features</a>
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

      <section className="public-features" id="features">
        <div className="public-section-head">
          <h2>Chaque module a sa place. Rien de collé au hasard.</h2>
          <p>Le site montre les capacités d’OVERSEER avec une DA propre. L’app desktop garde les vrais outils complets, l’overlay et les workflows de jeu.</p>
        </div>
        <div className="public-feature-showcase">
          {featureStories.map((story, index) => {
            const Icon = story.Icon;
            return (
              <article key={story.key} className={index % 2 ? 'reverse' : ''}>
                <div className="public-feature-copy">
                  <Icon size={26} />
                  <h3>{story.title}</h3>
                  <p>{story.text}</p>
                  <div>
                    {story.stats.map(stat => <span key={stat}>{stat}</span>)}
                  </div>
                </div>
                <FeatureVisual story={story} />
              </article>
            );
          })}
        </div>
      </section>

      <section className="public-cloud-strip" id="cloud">
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
