import React, { useEffect, useMemo, useState } from 'react';
import {
  ClipboardIcon,
  MapIcon,
  ScanIcon,
  ServerIcon,
  ShieldIcon,
  SkullIcon,
  SparklesIcon,
  TamingLassoIcon,
  TimerIcon,
  ZapIcon,
} from './Icons';
import { loadAccount, saveAccount } from '../data/account';
import {
  getBackendConfig,
  loginCloudAccount,
  logoutCloudAccount,
  registerCloudAccount,
} from '../data/cloudApi';
import { dinosaurs as appDinosaurs, FOOD_TYPES } from '../data/dinosaurs';
import { getCreatureDossierUrl, getCreatureIconUrl } from '../data/creatureIcons';
import {
  getCurrentSession,
  isSupabaseConfigured,
  onAuthStateChange,
  signInWithEmail,
  signOut,
  signUpWithEmail,
  upsertUserProfile,
} from '../data/supabaseClient';
import {
  createHostedTribe,
  joinHostedTribe,
  loadHostedTribeTasks,
  saveHostedTribeTasks,
} from '../data/tribeCloud';
import { calculateTaming } from '../data/tamingCalculator';

const releaseUrl = 'https://github.com/haylowof-pixel/overseer-companion/releases/latest';

const featuredCreatureSeeds = [
  {
    id: 'rex',
    name: 'Rex',
    species: 'Tyrannosaurus',
    diet: 'Carnivore',
    tame: 'Knockout',
    dossier: './creatures/dossiers/rex.png',
    icon: './creatures/wiki/rex.png',
    maxWild: 150,
    baseTorpor: 1550,
    torporDrop: '18m 42s',
    biome: 'Montagnes, plaines, neige',
    warning: 'Rayon de virage lent. Kite terrain haut ou trap conseillé.',
    foods: [
      ['exceptional-kibble', 'Exceptional Kibble', './creatures/wiki/exceptional-kibble.png', 17, 400, '16m', 99.6],
      ['raw-mutton', 'Raw Mutton', './creatures/wiki/raw-mutton.png', 37, 720, '23m', 94.2],
      ['raw-prime-meat', 'Raw Prime Meat', './creatures/wiki/raw-prime-meat.png', 45, 860, '28m', 91.8],
      ['raw-meat', 'Raw Meat', './creatures/wiki/raw-meat.png', 92, 1840, '1h 04m', 72.1],
    ],
    weapons: [
      ['crossbow', 'Crossbow + Tranq Arrow', './creatures/wiki/crossbow.png', './creatures/wiki/tranq-arrow.png', 51, 90],
      ['longneck', 'Longneck + Tranq Dart', './creatures/wiki/longneck-rifle.png', './creatures/wiki/tranq-dart.png', 21, 221],
      ['shocking', 'Longneck + Shocking Dart', './creatures/wiki/longneck-rifle.png', './creatures/wiki/shocking-tranq-dart.png', 11, 442],
      ['toxicant', 'Compound Bow + Toxicant Arrow', './creatures/wiki/compound-bow.png', './creatures/wiki/toxicant-arrow.png', 19, 243],
    ],
  },
  {
    id: 'argentavis',
    name: 'Argentavis',
    species: 'Argentavis magnificens',
    diet: 'Carnivore',
    tame: 'Knockout',
    dossier: './creatures/dossiers/argentavis.png',
    icon: './creatures/wiki/argentavis.png',
    maxWild: 150,
    baseTorpor: 650,
    torporDrop: '10m 18s',
    biome: 'Montagnes, zones froides',
    warning: 'Trap portes recommandé. Très utile pour transport et farm.',
    foods: [
      ['superior-kibble', 'Superior Kibble', './creatures/wiki/superior-kibble.png', 11, 220, '13m', 99.1],
      ['raw-mutton', 'Raw Mutton', './creatures/wiki/raw-mutton.png', 23, 440, '18m', 92.4],
      ['raw-prime-meat', 'Raw Prime Meat', './creatures/wiki/raw-prime-meat.png', 29, 560, '22m', 88.7],
      ['raw-meat', 'Raw Meat', './creatures/wiki/raw-meat.png', 54, 1080, '43m', 68.2],
    ],
    weapons: [
      ['crossbow', 'Crossbow + Tranq Arrow', './creatures/wiki/crossbow.png', './creatures/wiki/tranq-arrow.png', 34, 90],
      ['longneck', 'Longneck + Tranq Dart', './creatures/wiki/longneck-rifle.png', './creatures/wiki/tranq-dart.png', 14, 221],
      ['shocking', 'Longneck + Shocking Dart', './creatures/wiki/longneck-rifle.png', './creatures/wiki/shocking-tranq-dart.png', 8, 442],
    ],
  },
  {
    id: 'therizinosaurus',
    name: 'Therizinosaur',
    species: 'Therizinosaurus',
    diet: 'Herbivore',
    tame: 'Knockout',
    dossier: './creatures/dossiers/therizinosaurus.png',
    icon: './creatures/wiki/therizinosaurus.png',
    maxWild: 150,
    baseTorpor: 1750,
    torporDrop: '22m 05s',
    biome: 'Jungle, forêts, rivières',
    warning: 'Très dangereux au corps à corps. Trap fortement conseillé.',
    foods: [
      ['exceptional-kibble', 'Exceptional Kibble', './creatures/wiki/exceptional-kibble.png', 21, 520, '24m', 99.3],
      ['crops', 'Crops', './creatures/wiki/berries.png', 156, 1560, '1h 12m', 67.0],
      ['mejoberry', 'Mejoberry', './creatures/wiki/mejoberry.png', 312, 3120, '1h 58m', 42.0],
    ],
    weapons: [
      ['crossbow', 'Crossbow + Tranq Arrow', './creatures/wiki/crossbow.png', './creatures/wiki/tranq-arrow.png', 74, 90],
      ['longneck', 'Longneck + Tranq Dart', './creatures/wiki/longneck-rifle.png', './creatures/wiki/tranq-dart.png', 30, 221],
      ['shocking', 'Longneck + Shocking Dart', './creatures/wiki/longneck-rifle.png', './creatures/wiki/shocking-tranq-dart.png', 16, 442],
    ],
  },
  {
    id: 'spinosaurus',
    name: 'Spinosaurus',
    species: 'Spino',
    diet: 'Carnivore',
    tame: 'Knockout',
    dossier: './creatures/dossiers/spinosaurus.png',
    icon: './creatures/wiki/spinosaurus.png',
    maxWild: 150,
    baseTorpor: 1350,
    torporDrop: '15m 30s',
    biome: 'Rivières, marais, côtes',
    warning: 'Éloigner de l’eau pour casser son buff de vitesse.',
    foods: [
      ['exceptional-kibble', 'Exceptional Kibble', './creatures/wiki/exceptional-kibble.png', 15, 360, '14m', 99.5],
      ['raw-mutton', 'Raw Mutton', './creatures/wiki/raw-mutton.png', 33, 660, '21m', 93.8],
      ['raw-prime-fish', 'Raw Prime Fish', './creatures/wiki/raw-prime-fish-meat.png', 48, 960, '30m', 86.1],
    ],
    weapons: [
      ['crossbow', 'Crossbow + Tranq Arrow', './creatures/wiki/crossbow.png', './creatures/wiki/tranq-arrow.png', 47, 90],
      ['longneck', 'Longneck + Tranq Dart', './creatures/wiki/longneck-rifle.png', './creatures/wiki/tranq-dart.png', 20, 221],
      ['shocking', 'Longneck + Shocking Dart', './creatures/wiki/longneck-rifle.png', './creatures/wiki/shocking-tranq-dart.png', 10, 442],
    ],
  },
  {
    id: 'raptor',
    name: 'Raptor',
    species: 'Utahraptor',
    diet: 'Carnivore',
    tame: 'Knockout',
    dossier: './creatures/dossiers/raptor.png',
    icon: './creatures/wiki/raptor.png',
    maxWild: 150,
    baseTorpor: 180,
    torporDrop: '4m 12s',
    biome: 'Plaines, plages, forêts',
    warning: 'Bola puis headshots. Très rapide en début de wipe.',
    foods: [
      ['simple-kibble', 'Simple Kibble', './creatures/wiki/simple-kibble.png', 9, 90, '7m', 99.4],
      ['raw-mutton', 'Raw Mutton', './creatures/wiki/raw-mutton.png', 11, 170, '8m', 94.8],
      ['raw-meat', 'Raw Meat', './creatures/wiki/raw-meat.png', 29, 420, '21m', 72.5],
    ],
    weapons: [
      ['bow', 'Bow + Tranq Arrow', './creatures/wiki/bow.png', './creatures/wiki/tranq-arrow.png', 9, 45],
      ['crossbow', 'Crossbow + Tranq Arrow', './creatures/wiki/crossbow.png', './creatures/wiki/tranq-arrow.png', 5, 90],
      ['boomerang', 'Boomerang', './creatures/wiki/boomerang.png', null, 12, 70],
    ],
  },
];

const featuredById = new Map(featuredCreatureSeeds.map(creature => [creature.id, creature]));

function localDossierFor(dino) {
  return getCreatureDossierUrl(dino.name) || featuredById.get(dino.id)?.dossier || getCreatureIconUrl(dino.name);
}

function toWebCreature(dino) {
  const featured = featuredById.get(dino.id);
  const foods = (dino.tamingFoods || []).map(foodData => {
    const food = FOOD_TYPES[foodData.food] || {};
    return [
      foodData.food,
      food.name || foodData.food,
      food.img || food.icon || './icon-128.png',
      0,
      0,
      '-',
      0,
    ];
  });

  return {
    ...featured,
    ...dino,
    raw: dino,
    species: dino.aka || featured?.species || dino.name,
    diet: dino.category || featured?.diet || 'Special',
    tame: dino.tamingMethod || featured?.tame || 'Special',
    dossier: localDossierFor(dino),
    icon: getCreatureIconUrl(dino.name) || dino.icon || featured?.icon || './icon-128.png',
    baseTorpor: typeof dino.torpor === 'object' ? dino.torpor.base : dino.torpor || featured?.baseTorpor || 0,
    torporDrop: featured?.torporDrop || 'Calculé selon le niveau',
    biome: featured?.biome || dino.category || 'ARK maps',
    warning: dino.tips || featured?.warning || 'Aucune note disponible pour cette créature.',
    foods,
  };
}

const creatures = appDinosaurs
  .filter(dino => Array.isArray(dino.tamingFoods) && dino.tamingFoods.length > 0)
  .map(toWebCreature);

const narcotics = [
  ['narcotic', 'Narcotic', './creatures/wiki/narcotic.png', 40],
  ['narcoberry', 'Narcoberry', './creatures/wiki/narcoberry.png', 7.5],
  ['bio-toxin', 'Bio Toxin', './creatures/wiki/bio-toxin.png', 80],
  ['ascerbic-mushroom', 'Ascerbic Mushroom', './creatures/wiki/ascerbic-mushroom.png', 25],
];

const bosses = [
  ['Broodmother Lysrix', './tribute/official-broodmother.png', 'The Island', 'Gamma', 'Artefacts + trophées araignée'],
  ['Megapithecus', './tribute/official-megapithecus.png', 'The Island', 'Beta', 'Armée rex / theri recommandée'],
  ['Dragon', './tribute/official-dragon.png', 'The Island', 'Alpha', 'Theri + cakes végétaux'],
  ['Overseer', './tribute/official-overseer.png', 'The Island', 'Gamma', 'Tek cave + préparation longue'],
];

const maps = [
  ['The Island', './maps/images/the-island.jpg', 'Caves, bosses, ressources, routes de tame'],
  ['Scorched Earth', './maps/images/scorched-earth.jpg', 'Wyverns, drops, désert, ressources rares'],
  ['Aberration', './maps/images/aberration.jpg', 'Biomes profonds, radiation, ressources Tek'],
  ['Lost Island', './maps/images/lost-island.jpg', 'Spawn zones, ressources, artefacts'],
];

const serverCatalog = [
  ['ASA Official EU-PVE-TheIsland5101', 'Official PvE', 'The Island', 'EU', 64, 70, 38, 'Online', 'Beginner friendly official progression'],
  ['ASA Official EU-PVP-TheIsland201', 'Official PvP', 'The Island', 'EU', 58, 70, 42, 'Online', 'Official PvP cluster'],
  ['ASA Official NA-PVE-ScorchedEarth5122', 'Official PvE', 'Scorched Earth', 'NA', 51, 70, 74, 'Online', 'Official scorched progression'],
  ['ASA SmallTribes EU-PVP-36', 'SmallTribes', 'The Island', 'EU', 47, 70, 46, 'Online', 'SmallTribes rates and rules'],
  ['ASA SmallTribes NA-PVP-84', 'SmallTribes', 'Scorched Earth', 'NA', 42, 70, 88, 'Online', 'NA SmallTribes cluster'],
  ['ARKpocalypse EU-PVP-07', 'ARKpocalypse', 'The Island', 'EU', 39, 70, 44, 'Online', 'Seasonal wipe progression'],
  ['ARKpocalypse NA-PVP-11', 'ARKpocalypse', 'Aberration', 'NA', 34, 70, 93, 'Online', 'Fast seasonal PvP'],
  ['Conquest EU-ASA-04', 'Conquest', 'The Center', 'EU', 61, 70, 41, 'Online', 'Conquest style PvP'],
  ['MTS Arena Cluster', 'Community PvP', 'Ragnarok', 'EU', 128, 150, 28, 'Online', 'High activity community cluster'],
  ['Astraeos Roleplay Hub', 'Community RP', 'Astraeos', 'EU', 74, 100, 33, 'Online', 'RP and PvE events'],
  ['Lost Island Breeders', 'Community PvE', 'Lost Island', 'EU', 22, 100, 24, 'Online', 'Breeding and boss progression'],
  ['Fjordur Weekend Boost', 'Community PvE', 'Fjordur', 'NA', 18, 80, 81, 'Online', 'Boosted weekend rates'],
  ['Aberration Hardcore EU', 'Community PvP', 'Aberration', 'EU', 16, 70, 39, 'Online', 'Hardcore survival'],
  ['Crystal Isles Trade Hub', 'Community PvE', 'Crystal Isles', 'EU', 30, 100, 31, 'Online', 'Trading and boss carries'],
  ['Extinction OSD Farm', 'Community PvE', 'Extinction', 'NA', 12, 80, 92, 'Online', 'OSD and element routes'],
  ['Genesis Missions France', 'Community PvE', 'Genesis', 'EU', 9, 70, 26, 'Online', 'Mission progression'],
  ['Valguero Starter Cluster', 'Community PvE', 'Valguero', 'EU', 5, 60, 21, 'Idle', 'Starter tames and relaxed rates'],
  ['Overseer Test Cluster', 'Development', 'Aberration', 'EU', 0, 70, 12, 'Idle', 'Internal validation cluster'],
];

const navItems = [
  ['home', 'Accueil'],
  ['library', 'Dinos'],
  ['taming', 'Taming'],
  ['tribe', 'Tribu'],
  ['maps', 'Cartes'],
  ['servers', 'Serveurs'],
];

const validPageIds = ['home', 'library', 'taming', 'tribe', 'maps', 'servers', 'account'];

const mobilePrimaryItems = [
  ['home', 'Accueil'],
  ['library', 'Dinos'],
  ['taming', 'Tame'],
  ['tribe', 'Tribu'],
];

const mobileSecondaryItems = [
  ['maps', 'Cartes'],
  ['servers', 'Serveurs'],
  ['account', 'Compte'],
];

const pageMeta = {
  home: {
    title: 'OVERSEER - ARK taming calculator, dinos, maps and tribe planner',
    description: 'OVERSEER is a web companion for ARK with creature search, taming calculator, narcotics, knockout weapons, maps, servers, tribe planning and account sync.',
  },
  library: {
    title: 'Dinos - OVERSEER ARK companion',
    description: 'Search ARK creatures by name, food, tame method and diet, then open a live taming calculator.',
  },
  taming: {
    title: 'Taming calculator - OVERSEER ARK companion',
    description: 'Calculate ARK tame food, effectiveness, duration, narcotics and knockout weapon shots.',
  },
  tribe: {
    title: 'Tribe boss planner - OVERSEER ARK companion',
    description: 'Prepare ARK boss runs with tribe checklists, artifacts, trophies and raid prep readiness.',
  },
  maps: {
    title: 'Maps - OVERSEER ARK companion',
    description: 'Browse ARK maps and progression references from the OVERSEER web companion.',
  },
  servers: {
    title: 'Servers - OVERSEER ARK companion',
    description: 'Track favorite ARK server status from the OVERSEER web companion.',
  },
  account: {
    title: 'Account - OVERSEER ARK companion',
    description: 'Create or manage your OVERSEER web account and support the project.',
  },
};

function assetFallback(event, fallback = './icon-128.png') {
  event.currentTarget.src = fallback;
}

function navigateToPage(id) {
  window.location.hash = id === 'home' ? '' : id;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function normalizePageHash(hashValue) {
  const hash = String(hashValue || '').replace('#', '');
  if (!hash) return 'home';
  if (hash === 'tribute' || hash.startsWith('tribute:')) return 'tribe';
  return hash;
}

function getInitialPage() {
  const hash = normalizePageHash(window.location.hash);
  const currentHash = String(window.location.hash || '').replace('#', '');
  if (hash !== 'home' && currentHash !== hash) {
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#${hash}`);
  }
  return validPageIds.includes(hash) ? hash : 'home';
}

function formatPercent(value) {
  return `${Number(value).toFixed(1)}%`;
}

function formatDuration(seconds) {
  const total = Math.max(0, Math.round(Number(seconds) || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  if (minutes > 0) return `${minutes}m ${String(secs).padStart(2, '0')}s`;
  return `${secs}s`;
}

function energyStyle(value) {
  return { '--ow-value': `${Math.max(0, Math.min(100, value))}%` };
}

function loadStoredJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || '') || fallback;
  } catch {
    return fallback;
  }
}

function saveStoredJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  return value;
}

function normalizeSearch(value) {
  return String(value || '').trim().toLowerCase();
}

function creatureMatchesQuery(creature, value) {
  if (!value) return true;
  return (
    creature.name.toLowerCase().includes(value) ||
    creature.species.toLowerCase().includes(value) ||
    creature.diet.toLowerCase().includes(value) ||
    creature.tame.toLowerCase().includes(value) ||
    creature.foods.some(food => food[1].toLowerCase().includes(value))
  );
}

function sortedUnique(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function FeatureDeck() {
  const webFeatures = [
    ['Bestiaire', 'Recherche et filtres sur les créatures tamables.', SkullIcon, 'Dinos', 'library'],
    ['Taming', 'Nourriture, torpeur, narcotiques et tirs nécessaires.', TamingLassoIcon, 'Calculateur', 'taming'],
    ['Boss planner', 'Checklist de préparation pour les runs tribu.', ClipboardIcon, 'Tribu', 'tribe'],
    ['Cartes', 'Cartes ARK et repères de progression.', MapIcon, 'Maps', 'maps'],
  ];

  return (
    <section className="ow-section ow-feature-deck" id="tools">
      <div className="ow-section-head ow-section-head-row">
        <div>
          <span><SparklesIcon size={18} /> Outils disponibles</span>
          <h2>Accès rapide aux modules web.</h2>
        </div>
        <p>Tout ce qui est utile dans un navigateur est accessible directement ici. Les outils overlay restent dans l’application Windows.</p>
      </div>
      <div className="ow-feature-grid">
        {webFeatures.map(([title, text, Icon, action, page]) => (
          <button type="button" key={title} className="ow-feature-card ow-card-energy" onClick={() => navigateToPage(page)}>
            <Icon size={22} />
            <strong>{title}</strong>
            <p>{text}</p>
            <span>{action}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function SiteNav({ page, className = '' }) {
  return (
    <nav className={className}>
      {navItems.map(item => (
        <button
          type="button"
          key={item[0]}
          className={page === item[0] ? 'active' : ''}
          onClick={() => navigateToPage(item[0])}
        >
          {item[1]}
        </button>
      ))}
    </nav>
  );
}

function MobileNav({ page }) {
  const [isOpen, setIsOpen] = useState(false);
  const secondaryIsActive = mobileSecondaryItems.some(item => item[0] === page);

  useEffect(() => {
    setIsOpen(false);
  }, [page]);

  const goTo = id => {
    setIsOpen(false);
    navigateToPage(id);
  };

  return (
    <>
      {isOpen && (
        <button
          type="button"
          className="ow-mobile-scrim"
          aria-label="Fermer le menu mobile"
          onClick={() => setIsOpen(false)}
        />
      )}
      <div className={`ow-mobile-more ${isOpen ? 'open' : ''}`} aria-hidden={!isOpen}>
        {mobileSecondaryItems.map(item => (
          <button
            type="button"
            key={item[0]}
            className={page === item[0] ? 'active' : ''}
            onClick={() => goTo(item[0])}
          >
            {item[1]}
          </button>
        ))}
        <a href={releaseUrl}>Télécharger</a>
      </div>
      <nav className="ow-mobile-dock" aria-label="Navigation mobile">
        {mobilePrimaryItems.map(item => (
          <button
            type="button"
            key={item[0]}
            className={page === item[0] ? 'active' : ''}
            onClick={() => goTo(item[0])}
          >
            {item[1]}
          </button>
        ))}
        <button
          type="button"
          className={secondaryIsActive || isOpen ? 'active' : ''}
          onClick={() => setIsOpen(prev => !prev)}
        >
          Plus
        </button>
      </nav>
    </>
  );
}

function Header({ account, page, setSelectedCreature }) {
  const [searchValue, setSearchValue] = useState('');
  const searchQuery = normalizeSearch(searchValue);
  const searchMatches = useMemo(() => (
    searchQuery
      ? creatures.filter(creature => creatureMatchesQuery(creature, searchQuery)).slice(0, 7)
      : []
  ), [searchQuery]);

  const openCreature = creatureId => {
    setSelectedCreature(creatureId);
    setSearchValue('');
    navigateToPage('taming');
  };

  const submitSearch = event => {
    event.preventDefault();
    if (searchMatches[0]) openCreature(searchMatches[0].id);
  };

  return (
    <>
    <header className="ow-header">
      <button className="ow-logo" type="button" onClick={() => navigateToPage('home')}>
        <img src="./icon-128.png" alt="" />
        <span>
          <strong>OVERSEER</strong>
          <em>Survival Companion</em>
        </span>
      </button>
      <SiteNav page={page} className="ow-header-nav" />
      <form className="ow-top-search" onSubmit={submitSearch}>
        <ScanIcon size={18} />
        <input
          type="search"
          value={searchValue}
          onChange={event => setSearchValue(event.target.value)}
          placeholder="Chercher un dino..."
          aria-label="Chercher une créature"
        />
        {searchMatches.length > 0 && (
          <div className="ow-top-search-results">
            {searchMatches.map(match => (
              <button type="button" key={match.id} onClick={() => openCreature(match.id)}>
                <img src={match.icon} alt="" onError={assetFallback} />
                <span>
                  <strong>{match.name}</strong>
                  <em>{match.diet} · {match.tame}</em>
                </span>
              </button>
            ))}
          </div>
        )}
        {searchQuery && searchMatches.length === 0 && (
          <div className="ow-top-search-results empty">
            <span>Aucun dino trouvé</span>
          </div>
        )}
      </form>
      <div className="ow-header-actions">
        <a href="?app=1">App Windows</a>
        <a href={releaseUrl}>Télécharger</a>
        <button type="button" onClick={() => navigateToPage('account')}>
          {account.userId ? account.displayName || 'Profil' : 'Compte'}
        </button>
      </div>
    </header>
    <MobileNav page={page} />
    </>
  );
}

function Hero({ creature }) {
  return (
    <section className="ow-hero" id="creatures">
      <div className="ow-hero-copy">
        <div className="ow-kicker"><SparklesIcon size={16} /> ARK tools</div>
        <h1>Cherche, calcule et prépare tes tames ARK.</h1>
        <p>
          Bestiaire, tame calculator, narcotiques, armes, boss planner, cartes et compte web dans une interface claire.
        </p>
        <div className="ow-hero-metrics">
          <span><strong>{creatures.length}</strong> créatures</span>
          <span><strong>Tame</strong> calculator</span>
          <span><strong>Boss</strong> planner</span>
        </div>
        <div className="ow-hero-actions">
          <button type="button" onClick={() => navigateToPage('library')}>Chercher une créature</button>
          <button type="button" onClick={() => navigateToPage('taming')}>Ouvrir le calculateur</button>
          <button type="button" onClick={() => navigateToPage('tribe')}>Préparer un boss</button>
        </div>
      </div>
      <article className="ow-hero-dossier ow-card-energy">
        <img src={creature.dossier} alt="" onError={event => assetFallback(event, creature.icon)} />
        <div>
          <span>Dossier actif</span>
          <h2>{creature.name}</h2>
          <p>{creature.species}</p>
          <strong>Calcul tame disponible</strong>
        </div>
      </article>
    </section>
  );
}

function TamingCalculator({
  creature,
  selectedFood,
  setSelectedFood,
  wildLevel,
  setWildLevel,
  weaponQuality,
  setWeaponQuality,
  narcoticId,
  setNarcoticId,
}) {
  const foodRows = creature.foods
    .map(item => calculateTaming(creature.raw, wildLevel, item[0], 1, false))
    .filter(Boolean);
  const result = calculateTaming(creature.raw, wildLevel, selectedFood, 1, false) || foodRows[0];
  const food = result
    ? [result.foodKey, result.foodName, result.foodImg || result.foodIcon, result.foodNeeded, Math.round(result.foodPointsConsumed), result.totalTimeFmt, result.effectiveness]
    : (creature.foods[0] || ['none', 'No food', './icon-128.png', 0, 0, '-', 0]);
  const narcoticOptions = result?.narcoticOptions?.length ? result.narcoticOptions : narcotics.map(item => ({
    key: item[0],
    name: item[1],
    img: item[2],
    torpor: item[3],
    needed: 0,
  }));
  const selectedNarcotic = narcoticOptions.find(item => item.key === narcoticId) || narcoticOptions[0];
  const starveSeconds = result?.starveTimeSeconds || 0;
  const torporSeconds = result?.torporTimerSeconds || 0;
  const totalSeconds = result?.totalTimeSeconds || 0;
  const torporCoveragePercent = totalSeconds > 0 ? Math.min(100, (torporSeconds / totalSeconds) * 100) : 0;
  const starvePercent = totalSeconds > 0 ? Math.min(100, (starveSeconds / totalSeconds) * 100) : 0;

  return (
    <section className="ow-section ow-taming-section" id="taming">
      <div className="ow-detail-hero ow-card-energy">
        <img src={creature.dossier} alt="" onError={event => assetFallback(event, creature.icon)} />
        <div>
          <button type="button" onClick={() => navigateToPage('library')}>Changer de créature</button>
          <span><TamingLassoIcon size={18} /> Calculateur tame</span>
          <h2>{creature.name}</h2>
          <p>{creature.warning}</p>
          <dl>
            <div>
              <dt>Régime</dt>
              <dd>{creature.diet}</dd>
            </div>
            <div>
              <dt>Méthode</dt>
              <dd>{creature.tame}</dd>
            </div>
            <div>
              <dt>Efficacité</dt>
              <dd>{formatPercent(food[6])}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="ow-calculator">
        <article className="ow-tame-summary ow-card-energy">
          <img src={creature.icon} alt="" onError={assetFallback} />
          <div>
            <span>{creature.diet} · {creature.tame}</span>
            <h3>{creature.name}</h3>
            <p>{creature.warning}</p>
          </div>
          <strong>{formatPercent(food[6])}</strong>
        </article>

        <div className="ow-sliders">
          <label className="ow-slider-card">
            <span>Niveau sauvage</span>
            <div className="ow-range" style={energyStyle(((wildLevel - 1) / 299) * 100)}>
              <input type="range" min="1" max="300" value={wildLevel} onChange={event => setWildLevel(Number(event.target.value))} />
              <b>{wildLevel}</b>
            </div>
          </label>
          <label className="ow-slider-card">
            <span>Qualité arme</span>
            <div className="ow-range" style={energyStyle((weaponQuality - 100) / 2)}>
              <input type="range" min="100" max="300" value={weaponQuality} onChange={event => setWeaponQuality(Number(event.target.value))} />
              <b>{weaponQuality}%</b>
            </div>
          </label>
        </div>

        <div className="ow-timer-grid">
          <article className="ow-timer-card ow-card-energy">
            <div className="ow-panel-title">
              <TimerIcon size={18} />
              <span>Starve timer</span>
              <strong>{result?.starveTimeFmt || formatDuration(starveSeconds)}</strong>
            </div>
            <div className="ow-timer-meter" style={energyStyle(starvePercent)}>
              <span />
            </div>
            <dl>
              <div>
                <dt>Food à perdre</dt>
                <dd>{Math.round(result?.foodPointsConsumed || 0)}</dd>
              </div>
              <div>
                <dt>Drain food</dt>
                <dd>{result?.foodDrainPerSec || 0}/s</dd>
              </div>
              <div>
                <dt>Tame complet</dt>
                <dd>{result?.totalTimeFmt || '-'}</dd>
              </div>
            </dl>
          </article>

          <article className="ow-timer-card ow-card-energy">
            <div className="ow-panel-title">
              <ZapIcon size={18} />
              <span>Torpor timer</span>
              <strong>{formatDuration(torporSeconds)}</strong>
            </div>
            <div className="ow-timer-meter danger" style={energyStyle(torporCoveragePercent)}>
              <span />
            </div>
            <dl>
              <div>
                <dt>Torpor max</dt>
                <dd>{result?.maxTorpor || 0}</dd>
              </div>
              <div>
                <dt>Drain torpeur</dt>
                <dd>{result?.torporDrainPerSec || 0}/s</dd>
              </div>
              <div>
                <dt>{selectedNarcotic?.name || 'Narcotic'}</dt>
                <dd>{selectedNarcotic?.needed || 0}</dd>
              </div>
            </dl>
          </article>
        </div>

        <div className="ow-food-panel">
          <div className="ow-table-head">
            <span>Nourriture</span>
            <span>Qté</span>
            <span>Food</span>
            <span>Durée</span>
            <span>Efficacité</span>
          </div>
          {foodRows.map(item => (
            <button
              type="button"
              key={item.foodKey}
              className={`ow-food-row ${selectedFood === item.foodKey ? 'active' : ''}`}
              onClick={() => setSelectedFood(item.foodKey)}
            >
              <span>
                <img src={item.foodImg || item.foodIcon} alt="" onError={assetFallback} />
                <strong>{item.foodName}</strong>
              </span>
              <b>{item.foodNeeded}</b>
              <b>{Math.round(item.foodPointsConsumed)}</b>
              <b>{item.totalTimeFmt}</b>
              <em>{formatPercent(item.effectiveness)}</em>
            </button>
          ))}
        </div>

        <div className="ow-info-grid">
          <article className="ow-panel">
            <div className="ow-panel-title">
              <TimerIcon size={18} />
              <span>Maintien torpeur</span>
              <strong>{selectedNarcotic?.needed || 0} nécessaires</strong>
            </div>
            <div className="ow-narco-list">
              {narcoticOptions.map(item => (
                <button
                  type="button"
                  key={item.key}
                  className={narcoticId === item.key ? 'active' : ''}
                  onClick={() => setNarcoticId(item.key)}
                >
                  <img src={item.img || item.icon} alt="" onError={assetFallback} />
                  <span>{item.name}</span>
                  <b>{item.needed}</b>
                </button>
              ))}
            </div>
          </article>

          <article className="ow-panel">
            <div className="ow-panel-title">
              <ZapIcon size={18} />
              <span>Armes et munitions</span>
              <strong>{weaponQuality}%</strong>
          </div>
          <div className="ow-weapon-list">
            {(result?.knockoutWeapons || []).map(weapon => {
              const adjustedShots = Math.max(1, Math.ceil((weapon.needed * 100) / weaponQuality));
              return (
              <div key={weapon.key}>
                <span>
                  <img src={weapon.weaponImg || weapon.weaponIcon} alt="" onError={assetFallback} />
                  {!weapon.solo && <img src={weapon.ammoImg || weapon.ammoIcon} alt="" onError={assetFallback} />}
                </span>
                <strong>{adjustedShots} tirs</strong>
                <em>{weapon.solo ? weapon.weaponName : `${weapon.weaponName} + ${weapon.ammoName}`}</em>
                <b>{Math.round(weapon.torporPerShot * 10) / 10} torp/tir</b>
              </div>
            );})}
          </div>
          </article>
        </div>
      </div>
    </section>
  );
}

function CreatureOverview({ creature, selectedFood, selectedCreature, setSelectedCreature, wildLevel }) {
  const result = calculateTaming(creature.raw, wildLevel, selectedFood, 1, false)
    || calculateTaming(creature.raw, wildLevel, creature.foods[0]?.[0], 1, false);
  const foodName = result?.foodName || creature.foods[0]?.[1] || 'Non tame';
  const torporTime = result?.torporTimerSeconds ? result.torporTimerSeconds : 0;
  const quickCreatures = [...new Map([creature, ...creatures.slice(0, 11)].map(item => [item.id, item])).values()];

  return (
    <section className="ow-section ow-creature-overview">
      <div className="ow-overview-shell ow-card-energy">
        <div className="ow-overview-main">
          <img src={creature.icon} alt="" onError={assetFallback} />
          <div>
            <span>Fiche créature</span>
            <h2>{creature.name}</h2>
            <p>{creature.species}</p>
          </div>
        </div>
        <div className="ow-overview-stats">
          <article>
            <span>Habitat</span>
            <strong>{creature.biome}</strong>
          </article>
          <article>
            <span>Tempérament</span>
            <strong>{creature.diet} · {creature.tame}</strong>
          </article>
          <article>
            <span>Meilleure food</span>
            <strong>{foodName}</strong>
          </article>
          <article>
            <span>Torpeur</span>
            <strong>{result?.torporTimerSeconds ? `${Math.floor(torporTime / 60)}m ${torporTime % 60}s` : creature.torporDrop}</strong>
          </article>
        </div>
        <p className="ow-overview-note">{creature.warning}</p>
        <div className="ow-overview-picker">
          {quickCreatures.map(item => (
            <button
              type="button"
              key={item.id}
              className={selectedCreature === item.id ? 'active' : ''}
              onClick={() => setSelectedCreature(item.id)}
            >
              <img src={item.icon} alt="" onError={assetFallback} />
              <span>{item.name}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function CreatureExplorer({
  query,
  setQuery,
  categoryFilter,
  setCategoryFilter,
  tameFilter,
  setTameFilter,
  categoryOptions,
  tameOptions,
  filteredCreatures,
  selectedCreature,
  setSelectedCreature,
}) {
  const [visibleCount, setVisibleCount] = useState(24);
  const visibleCreatures = filteredCreatures.slice(0, visibleCount);

  useEffect(() => {
    setVisibleCount(24);
  }, [query, categoryFilter, tameFilter]);

  return (
    <section className="ow-section ow-creature-browser" id="library">
      <div className="ow-section-head">
        <span><SkullIcon size={18} /> Bestiaire</span>
        <h2>Choisis une créature.</h2>
        <p>Recherche une créature, filtre la liste, puis ouvre directement son calculateur.</p>
      </div>
      <div className="ow-browser-workspace">
        <div className="ow-browser-panel ow-panel">
          <div className="ow-browser-search">
            <ScanIcon size={18} />
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Chercher une créature, food, méthode..."
            />
          </div>
          <div className="ow-filter-stack">
            <span>Régime</span>
            <div>
              {['Tous', ...categoryOptions].map(option => {
                const value = option === 'Tous' ? 'all' : option;
                return (
                  <button
                    type="button"
                    key={value}
                    className={categoryFilter === value ? 'active' : ''}
                    onClick={() => setCategoryFilter(value)}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="ow-filter-stack">
            <span>Méthode</span>
            <div>
              {['Toutes', ...tameOptions].map(option => {
                const value = option === 'Toutes' ? 'all' : option;
                return (
                  <button
                    type="button"
                    key={value}
                    className={tameFilter === value ? 'active' : ''}
                    onClick={() => setTameFilter(value)}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="ow-browser-count">
            <strong>{filteredCreatures.length}</strong>
            <span>résultats</span>
          </div>
        </div>

        <div className="ow-browser-results">
          {visibleCreatures.map(creature => (
            <button
              type="button"
              key={creature.id}
              className={selectedCreature === creature.id ? 'active' : ''}
              onClick={() => {
                setSelectedCreature(creature.id);
                navigateToPage('taming');
              }}
            >
              <img src={creature.icon} alt="" onError={assetFallback} />
              <span>
                <strong>{creature.name}</strong>
                <em>{creature.species}</em>
              </span>
              <b>{creature.diet}</b>
              <small>{creature.tame}</small>
            </button>
          ))}
          {!visibleCreatures.length && (
            <div className="ow-empty-state">
              <strong>Aucun résultat</strong>
              <span>Change la recherche ou enlève un filtre.</span>
            </div>
          )}
          {filteredCreatures.length > visibleCreatures.length && (
            <button
              type="button"
              className="ow-load-more"
              onClick={() => setVisibleCount(count => count + 24)}
            >
              Afficher plus de créatures
              <span>{visibleCreatures.length}/{filteredCreatures.length}</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

const bossPlannerItems = [
  ['Artefacts', ['Artifact of the Hunter', 'Artifact of the Massive', 'Artifact of the Clever', 'Artifact of the Pack']],
  ['Trophées', ['Broodmother Trophy', 'Megapithecus Trophy', 'Dragon Trophy', 'DodoRex Trophy']],
  ['Raid prep', ['Medical Brews', 'Canteens', 'Ammo', 'Cryopods', 'Selles vérifiées', 'Armée réparée']],
];

const taskCategories = ['Boss', 'Farm', 'Breed', 'Build', 'Serveur'];

function createWebTask(title, category = 'Boss') {
  return {
    id: `web-task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title,
    category,
    priority: 'normal',
    assignedTo: '',
    due: 'Prochain run',
    done: false,
    items: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function TribeSection({ account, setAccount }) {
  const [view, setView] = useState('tasks');
  const [selectedBoss, setSelectedBoss] = useState(bosses[0][0]);
  const [difficulty, setDifficulty] = useState('Gamma');
  const [checks, setChecks] = useState(() => loadStoredJson('overseer-web-boss-checks-v1', {}));
  const [tasks, setTasks] = useState(() => loadStoredJson('overseer-web-tribe-tasks-v1', []));
  const [taskDraft, setTaskDraft] = useState('');
  const [taskCategory, setTaskCategory] = useState(taskCategories[0]);
  const [workspaceDraft, setWorkspaceDraft] = useState({ name: account.tribeName || '', invite: '' });
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState('');
  const selectedBossData = bosses.find(boss => boss[0] === selectedBoss) || bosses[0];
  const plannerKey = `${selectedBoss}:${difficulty}`;
  const currentChecks = checks[plannerKey] || {};
  const flatPlannerItems = bossPlannerItems.flatMap(group => group[1]);
  const ready = flatPlannerItems.filter(item => currentChecks[item]).length;
  const readiness = Math.round((ready / Math.max(flatPlannerItems.length, 1)) * 100);
  const taskDone = tasks.filter(task => task.done).length;

  useEffect(() => {
    let alive = true;
    loadHostedTribeTasks({ tribeId: account.hostedTribeId || '' })
      .then(remoteTasks => {
        if (!alive || !Array.isArray(remoteTasks) || remoteTasks.length === 0) return;
        setTasks(remoteTasks);
        saveStoredJson('overseer-web-tribe-tasks-v1', remoteTasks);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [account.hostedTribeId]);

  useEffect(() => {
    setWorkspaceDraft(current => ({ ...current, name: account.tribeName || current.name }));
  }, [account.tribeName]);

  const persistTasks = next => {
    setTasks(next);
    saveStoredJson('overseer-web-tribe-tasks-v1', next);
    saveHostedTribeTasks({ tribeId: account.hostedTribeId || '', tasks: next }).catch(() => {});
  };

  const toggleCheck = item => {
    setChecks(prev => saveStoredJson('overseer-web-boss-checks-v1', {
      ...prev,
      [plannerKey]: {
        ...(prev[plannerKey] || {}),
        [item]: !(prev[plannerKey] || {})[item],
      },
    }));
  };

  const addTask = event => {
    event.preventDefault();
    const title = taskDraft.trim();
    if (!title) return;
    persistTasks([createWebTask(title, taskCategory), ...tasks]);
    setTaskDraft('');
  };

  const toggleTask = id => {
    persistTasks(tasks.map(task => (
      task.id === id ? { ...task, done: !task.done, updatedAt: new Date().toISOString() } : task
    )));
  };

  const deleteTask = id => {
    persistTasks(tasks.filter(task => task.id !== id));
  };

  const createTribe = async event => {
    event.preventDefault();
    const name = workspaceDraft.name.trim();
    if (!name) return;
    setBusy('create');
    setNotice('');
    try {
      await createHostedTribe({
        name,
        ownerId: account.userId || `web-${Date.now()}`,
        ownerName: account.displayName || account.email || 'Survivor',
      });
      const next = loadAccount();
      setAccount(next);
      setNotice('Tribu créée. Le code invitation est prêt à partager.');
    } catch (error) {
      setNotice(error.message || 'Impossible de créer la tribu.');
    } finally {
      setBusy('');
    }
  };

  const joinTribe = async event => {
    event.preventDefault();
    const invite = workspaceDraft.invite.trim();
    if (!invite) return;
    setBusy('join');
    setNotice('');
    try {
      await joinHostedTribe({
        inviteCode: invite,
        userId: account.userId || `web-${Date.now()}`,
        displayName: account.displayName || account.email || 'Survivor',
      });
      const next = loadAccount();
      setAccount(next);
      setNotice('Tribu liée au profil web.');
    } catch (error) {
      setNotice(error.message || 'Impossible de rejoindre cette tribu.');
    } finally {
      setBusy('');
    }
  };

  return (
    <section className="ow-section" id="tribe">
      <div className="ow-section-head">
        <span><ClipboardIcon size={18} /> Tribus et boss</span>
        <h2>Un vrai espace tribu web.</h2>
        <p>Crée ou rejoins une tribu, prépare les runs boss et suis les tâches sans passer par l’overlay Windows.</p>
      </div>
      <div className="ow-module-tabs">
        {[
          ['tasks', 'Tâches'],
          ['planner', 'Boss planner'],
          ['workspace', 'Workspace'],
        ].map(item => (
          <button key={item[0]} type="button" className={view === item[0] ? 'active' : ''} onClick={() => setView(item[0])}>
            {item[1]}
          </button>
        ))}
      </div>

      {view === 'tasks' && (
        <div className="ow-tribe-workbench">
          <article className="ow-panel ow-card-energy">
            <div className="ow-panel-title">
              <span><ClipboardIcon size={16} /> Tâches de tribu</span>
              <strong>{taskDone}/{tasks.length || 0}</strong>
            </div>
            <form className="ow-task-compose" onSubmit={addTask}>
              <input value={taskDraft} onChange={event => setTaskDraft(event.target.value)} placeholder="Ex: Farmer les artéfacts du Dragon" />
              <select value={taskCategory} onChange={event => setTaskCategory(event.target.value)}>
                {taskCategories.map(category => <option key={category}>{category}</option>)}
              </select>
              <button type="submit">Ajouter</button>
            </form>
            <div className="ow-task-list">
              {tasks.length === 0 ? (
                <div className="ow-empty-state">
                  <strong>Aucune tâche</strong>
                  <span>Crée une tâche pour ton serveur, ton boss run ou ton élevage.</span>
                </div>
              ) : tasks.map(task => (
                <article key={task.id} className={`ow-task-row ${task.done ? 'done' : ''}`}>
                  <button type="button" onClick={() => toggleTask(task.id)}>{task.done ? '✓' : ''}</button>
                  <span>
                    <strong>{task.title}</strong>
                    <em>{task.category} · {task.due || 'Prochain run'}</em>
                  </span>
                  <button type="button" onClick={() => deleteTask(task.id)}>Supprimer</button>
                </article>
              ))}
            </div>
          </article>
          <aside className="ow-panel ow-tribe-status">
            <span>Tribu active</span>
            <strong>{account.tribeName || 'Aucune tribu'}</strong>
            <p>{account.tribeCode ? `Code invitation : ${account.tribeCode}` : 'Crée ou rejoins une tribu pour synchroniser les tâches entre joueurs.'}</p>
            <button type="button" onClick={() => setView('workspace')}>Gérer la tribu</button>
          </aside>
        </div>
      )}

      {view === 'planner' && (
        <div className="ow-tribe-layout">
          <article className="ow-bosses ow-panel">
            {bosses.map(boss => (
              <button type="button" key={boss[0]} className={selectedBoss === boss[0] ? 'active' : ''} onClick={() => setSelectedBoss(boss[0])}>
                <img src={boss[1]} alt="" onError={assetFallback} />
                <span>
                  <strong>{boss[0]}</strong>
                  <em>{boss[2]} · {boss[3]}</em>
                </span>
                <b>{boss[4]}</b>
              </button>
            ))}
          </article>
          <article className="ow-planner ow-card-energy">
            <div className="ow-boss-command">
              <img src={selectedBossData[1]} alt="" onError={assetFallback} />
              <span>
                <small>Boss sélectionné</small>
                <strong>{selectedBoss}</strong>
                <em>{selectedBossData[2]}</em>
              </span>
              <div className="ow-difficulty">
                {['Gamma', 'Beta', 'Alpha'].map(level => (
                  <button key={level} type="button" className={difficulty === level ? 'active' : ''} onClick={() => setDifficulty(level)}>{level}</button>
                ))}
              </div>
            </div>
            <div className="ow-readiness-card">
              <span>Readiness</span>
              <strong>{readiness}%</strong>
              <em>{ready}/{flatPlannerItems.length} éléments prêts</em>
            </div>
            <div className="ow-checklist ow-checklist-groups">
              {bossPlannerItems.map(group => (
                <div key={group[0]}>
                  <strong>{group[0]}</strong>
                  {group[1].map(item => (
                    <label key={item}>
                      <input type="checkbox" checked={Boolean(currentChecks[item])} onChange={() => toggleCheck(item)} />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>
              ))}
            </div>
          </article>
        </div>
      )}

      {view === 'workspace' && (
        <div className="ow-workspace-grid">
          <article className="ow-panel ow-card-energy">
            <span>Créer une tribu</span>
            <h3>{account.tribeName || 'Nouvelle tribu web'}</h3>
            <p>Crée un workspace pour partager les tâches et les préparations boss.</p>
            <form className="ow-workspace-form" onSubmit={createTribe}>
              <input value={workspaceDraft.name} onChange={event => setWorkspaceDraft(prev => ({ ...prev, name: event.target.value }))} placeholder="Nom de tribu" />
              <button type="submit" disabled={busy === 'create'}>{busy === 'create' ? 'Création...' : 'Créer'}</button>
            </form>
          </article>
          <article className="ow-panel">
            <span>Rejoindre</span>
            <h3>Code invitation</h3>
            <p>Entre le code donné par le propriétaire de la tribu.</p>
            <form className="ow-workspace-form" onSubmit={joinTribe}>
              <input value={workspaceDraft.invite} onChange={event => setWorkspaceDraft(prev => ({ ...prev, invite: event.target.value.toUpperCase() }))} placeholder="CODE-TRIBU" />
              <button type="submit" disabled={busy === 'join'}>{busy === 'join' ? 'Connexion...' : 'Rejoindre'}</button>
            </form>
          </article>
          {notice && <p className="ow-auth-notice">{notice}</p>}
        </div>
      )}
    </section>
  );
}

function MapSection() {
  const [active, setActive] = useState(maps[0][0]);
  const map = maps.find(item => item[0] === active) || maps[0];

  return (
    <section className="ow-section" id="maps">
      <div className="ow-section-head">
        <span><MapIcon size={18} /> Cartes</span>
        <h2>Maps ARK lisibles en plein navigateur.</h2>
      </div>
      <div className="ow-map-web">
        <div className="ow-map-tabs">
          {maps.map(item => (
            <button type="button" key={item[0]} className={active === item[0] ? 'active' : ''} onClick={() => setActive(item[0])}>
              {item[0]}
            </button>
          ))}
        </div>
        <div className="ow-map-frame ow-card-energy">
          <img src={map[1]} alt="" onError={assetFallback} />
          <div>
            <span>Explorer</span>
            <h3>{map[0]}</h3>
            <p>{map[2]}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function toServerObject(server) {
  if (Array.isArray(server)) {
    return {
      id: server[0],
      name: server[0],
      mode: server[1],
      map: server[2],
      region: server[3],
      players: server[4],
      maxPlayers: server[5],
      ping: server[6],
      status: server[7],
      note: server[8],
      source: 'catalogue',
    };
  }

  const attributes = server.attributes || {};
  const details = attributes.details || {};
  return {
    id: server.id || attributes.id || attributes.name,
    name: attributes.name || server.name || 'ARK server',
    mode: details.official ? 'Official' : details.pve ? 'PvE' : 'Community',
    map: details.map || attributes.map || 'ARK',
    region: details.region || details.country || 'Live',
    players: attributes.players ?? 0,
    maxPlayers: attributes.maxPlayers ?? details.maxPlayers ?? 70,
    ping: details.ping ?? '-',
    status: attributes.status === 'online' ? 'Online' : attributes.status || 'Unknown',
    note: 'Résultat live BattleMetrics',
    source: 'live',
  };
}

function ServerSection() {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState('all');
  const [region, setRegion] = useState('all');
  const [favorites, setFavorites] = useState(() => loadStoredJson('overseer-web-server-favorites-v1', []));
  const [liveServers, setLiveServers] = useState([]);
  const [liveState, setLiveState] = useState('');
  const serverQuery = normalizeSearch(query);
  const catalogServers = serverCatalog.map(toServerObject);
  const mergedServers = [
    ...liveServers,
    ...catalogServers.filter(server => !liveServers.some(live => live.name === server.name)),
  ];
  const modes = ['all', ...Array.from(new Set(catalogServers.map(server => server.mode)))];
  const regions = ['all', ...Array.from(new Set(catalogServers.map(server => server.region)))];
  const filteredServers = mergedServers
    .filter(server => mode === 'all' || server.mode === mode)
    .filter(server => region === 'all' || server.region === region)
    .filter(server => !serverQuery || [server.name, server.mode, server.map, server.region, server.note].some(value => normalizeSearch(value).includes(serverQuery)))
    .sort((a, b) => (favorites.includes(b.id) ? 1 : 0) - (favorites.includes(a.id) ? 1 : 0) || (b.players || 0) - (a.players || 0));

  useEffect(() => {
    if (serverQuery.length < 3) {
      setLiveServers([]);
      setLiveState('');
      return;
    }
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      controller.abort();
      setLiveState('Catalogue local affiché');
    }, 4500);
    setLiveState('Recherche live...');
    const params = new URLSearchParams({
      'filter[game]': 'arksa',
      'filter[search]': query,
      'page[size]': '12',
    });
    fetch(`https://api.battlemetrics.com/servers?${params.toString()}`, { signal: controller.signal })
      .then(response => response.ok ? response.json() : Promise.reject(new Error('BattleMetrics unavailable')))
      .then(payload => {
        window.clearTimeout(timeoutId);
        setLiveServers((payload.data || []).map(toServerObject));
        setLiveState((payload.data || []).length ? 'Résultats live BattleMetrics' : 'Aucun résultat live, catalogue local affiché');
      })
      .catch(error => {
        window.clearTimeout(timeoutId);
        if (error.name !== 'AbortError') setLiveState('Catalogue local affiché');
      });
    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [serverQuery, query]);

  const toggleFavorite = server => {
    setFavorites(prev => {
      const next = prev.includes(server.id) ? prev.filter(id => id !== server.id) : [...prev, server.id];
      return saveStoredJson('overseer-web-server-favorites-v1', next);
    });
  };

  return (
    <section className="ow-section" id="servers">
      <div className="ow-section-head">
        <span><ServerIcon size={18} /> Serveurs</span>
        <h2>Explorer les serveurs ARK.</h2>
        <p>Recherche live quand disponible, catalogue web utilisable et favoris stockés dans ton navigateur.</p>
      </div>
      <div className="ow-server-browser">
        <article className="ow-panel ow-server-controls">
          <label>
            Recherche serveur
            <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Nom, map, mode, région..." />
          </label>
          <label>
            Mode
            <select value={mode} onChange={event => setMode(event.target.value)}>
              {modes.map(item => <option key={item} value={item}>{item === 'all' ? 'Tous' : item}</option>)}
            </select>
          </label>
          <label>
            Région
            <select value={region} onChange={event => setRegion(event.target.value)}>
              {regions.map(item => <option key={item} value={item}>{item === 'all' ? 'Toutes' : item}</option>)}
            </select>
          </label>
          <span>{liveState || `${filteredServers.length} serveurs affichés`}</span>
        </article>
        <div className="ow-server-grid">
          {filteredServers.map(server => (
            <article key={server.id} className={`ow-panel ow-server-card ${favorites.includes(server.id) ? 'favorite' : ''}`}>
              <div>
                <span className={server.status === 'Online' ? 'online' : ''} />
                <button type="button" onClick={() => toggleFavorite(server)}>{favorites.includes(server.id) ? 'Favori' : 'Suivre'}</button>
              </div>
              <strong>{server.name}</strong>
              <em>{server.mode} · {server.map}</em>
              <dl>
                <div><dt>Joueurs</dt><dd>{server.players}/{server.maxPlayers}</dd></div>
                <div><dt>Ping</dt><dd>{server.ping} ms</dd></div>
                <div><dt>Région</dt><dd>{server.region}</dd></div>
              </dl>
              <small>{server.note}</small>
            </article>
          ))}
          {filteredServers.length === 0 && (
            <div className="ow-empty-state">
              <strong>Aucun serveur</strong>
              <span>Change la recherche ou les filtres.</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function AccountSection({ account, setAccount }) {
  const [authMode, setAuthMode] = useState('signin');
  const [password, setPassword] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState('');
  const backend = useMemo(() => getBackendConfig(), []);
  const useCloudflareAuth = backend.configured && backend.authProvider !== 'supabase';
  const isSignedIn = Boolean(account.userId);

  useEffect(() => {
    let alive = true;
    if (useCloudflareAuth) return () => { alive = false; };
    getCurrentSession()
      .then(({ user }) => {
        if (!alive || !user) return;
        const metadata = user.user_metadata || {};
        const next = saveAccount({
          ...loadAccount(),
          userId: user.id,
          email: user.email || '',
          displayName: metadata.display_name || loadAccount().displayName,
          avatarUrl: metadata.avatar_url || loadAccount().avatarUrl,
          authProvider: 'supabase',
          billingStatus: 'signed-in',
        });
        setAccount(next);
      })
      .catch(() => {});
    const unsubscribe = onAuthStateChange(({ user }) => {
      if (!user) return;
      const metadata = user.user_metadata || {};
      const next = saveAccount({
        ...loadAccount(),
        userId: user.id,
        email: user.email || '',
        displayName: metadata.display_name || loadAccount().displayName,
        avatarUrl: metadata.avatar_url || loadAccount().avatarUrl,
        authProvider: 'supabase',
        billingStatus: 'signed-in',
      });
      setAccount(next);
    });
    return () => {
      alive = false;
      unsubscribe();
    };
  }, [setAccount, useCloudflareAuth]);

  const update = (key, value) => setAccount(prev => ({ ...prev, [key]: value }));
  const saveLocal = () => {
    const next = saveAccount({
      ...account,
      userId: account.userId || `web-${Date.now()}`,
      authProvider: 'web-local',
      billingStatus: 'freemium',
      planId: 'free',
    });
    setAccount(next);
  };
  const submitAuth = async (event) => {
    event.preventDefault();
    setBusy('auth');
    setNotice('');
    try {
      const payload = {
        email: account.email.trim(),
        password,
        displayName: account.displayName.trim(),
        avatarUrl: account.avatarUrl,
      };

      if (useCloudflareAuth) {
        const result = authMode === 'signup'
          ? await registerCloudAccount(payload)
          : await loginCloudAccount(payload);
        const cloudAccount = result.account || {};
        const next = saveAccount({
          ...account,
          userId: cloudAccount.id || `cloud-${Date.now()}`,
          email: cloudAccount.email || payload.email,
          displayName: cloudAccount.displayName || payload.displayName,
          avatarUrl: cloudAccount.avatarUrl || payload.avatarUrl,
          planId: cloudAccount.planId || 'free',
          authProvider: 'cloudflare',
          billingStatus: cloudAccount.billingStatus || 'signed-in',
        });
        setAccount(next);
        setNotice(authMode === 'signup' ? 'Compte web créé et connecté.' : 'Connecté au compte web.');
        return;
      }

      if (isSupabaseConfigured) {
        const result = authMode === 'signup'
          ? await signUpWithEmail(payload)
          : await signInWithEmail(payload);
        const user = result.user || result.session?.user;
        if (user) {
          await upsertUserProfile({
            userId: user.id,
            email: user.email,
            displayName: payload.displayName,
            avatarUrl: payload.avatarUrl,
          });
          const next = saveAccount({
            ...account,
            userId: user.id,
            email: user.email || payload.email,
            authProvider: 'supabase',
            billingStatus: 'signed-in',
          });
          setAccount(next);
        }
        setNotice(authMode === 'signup' ? 'Compte créé. Vérifie ton email si demandé.' : 'Connecté au compte web.');
        return;
      }

      saveLocal();
      setNotice('Mode local actif. Configure Cloudflare ou Supabase pour une inscription hébergée 24/7.');
    } catch (error) {
      setNotice(error.message || 'Impossible de traiter la connexion.');
    } finally {
      setBusy('');
      setPassword('');
    }
  };

  const logout = async () => {
    setBusy('logout');
    setNotice('');
    try {
      if (useCloudflareAuth) await logoutCloudAccount();
      else if (isSupabaseConfigured) await signOut();
    } catch {}
    const next = saveAccount({
      ...account,
      userId: '',
      authProvider: 'local',
      billingStatus: 'signed-out',
    });
    setAccount(next);
    setNotice('Déconnecté.');
    setBusy('');
  };

  return (
    <section className="ow-section" id="account">
      <div className="ow-section-head">
        <span><ShieldIcon size={18} /> Compte</span>
        <h2>Profil web et support Overseer.</h2>
      </div>
      <div className="ow-account-grid">
        <article className="ow-panel ow-account-card">
          {isSignedIn ? (
            <>
              <div className="ow-account-avatar">
                <img src={account.avatarUrl || './icon-128.png'} alt="" onError={assetFallback} />
                <span>
                  <strong>{account.displayName || 'Survivor'}</strong>
                  <em>{account.email || 'Compte web'}</em>
                </span>
              </div>
              <div className="ow-session-panel">
                <span>Session active</span>
                <strong>{account.authProvider === 'local-dev' || account.authProvider === 'web-local' ? 'Mode local' : 'Compte cloud'}</strong>
                <p>{account.authProvider === 'local-dev' || account.authProvider === 'web-local'
                  ? 'Profil enregistré dans ce navigateur.'
                  : 'Profil prêt pour synchronisation web et tribu.'}</p>
              </div>
              <label>Nom affiché<input value={account.displayName || ''} onChange={event => update('displayName', event.target.value)} placeholder="Pseudo survivant" /></label>
              <label>Avatar URL<input value={account.avatarUrl || ''} onChange={event => update('avatarUrl', event.target.value)} placeholder="https://..." /></label>
              <div className="ow-account-actions">
                <button type="button" onClick={saveLocal}>Sauvegarder</button>
                <button type="button" onClick={logout} disabled={Boolean(busy)}>{busy === 'logout' ? 'Déconnexion...' : 'Déconnexion'}</button>
              </div>
            </>
          ) : (
            <form onSubmit={submitAuth}>
              <div className="ow-auth-tabs">
                <button type="button" className={authMode === 'signin' ? 'active' : ''} onClick={() => setAuthMode('signin')}>Connexion</button>
                <button type="button" className={authMode === 'signup' ? 'active' : ''} onClick={() => setAuthMode('signup')}>Inscription</button>
              </div>
              <label>Email<input required type="email" value={account.email || ''} onChange={event => update('email', event.target.value)} placeholder="email@overseer.app" /></label>
              {authMode === 'signup' && (
                <>
                  <label>Nom affiché<input value={account.displayName || ''} onChange={event => update('displayName', event.target.value)} placeholder="Pseudo survivant" /></label>
                  <label>Avatar URL<input value={account.avatarUrl || ''} onChange={event => update('avatarUrl', event.target.value)} placeholder="https://..." /></label>
                </>
              )}
              <label>Mot de passe<input required type="password" minLength={8} value={password} onChange={event => setPassword(event.target.value)} placeholder="8 caractères minimum" /></label>
              <button type="submit" disabled={Boolean(busy)}>{busy === 'auth' ? 'Traitement...' : authMode === 'signup' ? 'Créer le compte' : 'Se connecter'}</button>
            </form>
          )}
          {notice && <p className="ow-auth-notice">{notice}</p>}
        </article>
        <article className="ow-panel ow-support">
          <span>Support Overseer</span>
          <h3>Garder Overseer rapide, gratuit et maintenu.</h3>
          <p>Le support volontaire finance hosting, données, imports d’assets et polish long terme.</p>
          <div>
            <a href="https://ko-fi.com/haitamhil3" target="_blank" rel="noreferrer">Ko-fi</a>
            <a href="https://paypal.me/haitamhil" target="_blank" rel="noreferrer">PayPal.me</a>
            <a href="https://buymeacoffee.com/haylow" target="_blank" rel="noreferrer">Buy Me a Coffee</a>
          </div>
        </article>
      </div>
    </section>
  );
}

export default function PublicWebsite() {
  const [page, setPage] = useState(getInitialPage);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [tameFilter, setTameFilter] = useState('all');
  const [selectedCreature, setSelectedCreature] = useState(creatures[0].id);
  const [selectedFood, setSelectedFood] = useState(creatures[0].foods[0][0]);
  const [wildLevel, setWildLevel] = useState(150);
  const [weaponQuality, setWeaponQuality] = useState(100);
  const [narcoticId, setNarcoticId] = useState('narcotic');
  const [account, setAccount] = useState(() => loadAccount());
  const categoryOptions = useMemo(() => sortedUnique(creatures.map(creature => creature.diet)), []);
  const tameOptions = useMemo(() => sortedUnique(creatures.map(creature => creature.tame)), []);

  const filteredCreatures = useMemo(() => {
    const value = normalizeSearch(query);
    return creatures.filter(creature => (
      creatureMatchesQuery(creature, value) &&
      (categoryFilter === 'all' || creature.diet === categoryFilter) &&
      (tameFilter === 'all' || creature.tame === tameFilter)
    ));
  }, [query, categoryFilter, tameFilter]);

  const creature = useMemo(() => creatures.find(item => item.id === selectedCreature) || creatures[0], [selectedCreature]);

  useEffect(() => {
    setSelectedFood(creature.foods[0][0]);
  }, [creature.id]);

  useEffect(() => {
    document.documentElement.classList.add('public-web-root');
    document.body.classList.add('public-web-body');
    const syncPage = () => setPage(getInitialPage());
    window.addEventListener('hashchange', syncPage);
    return () => {
      window.removeEventListener('hashchange', syncPage);
      document.documentElement.classList.remove('public-web-root');
      document.body.classList.remove('public-web-body');
    };
  }, []);

  useEffect(() => {
    const meta = pageMeta[page] || pageMeta.home;
    document.title = meta.title;
    let description = document.querySelector('meta[name="description"]');
    if (!description) {
      description = document.createElement('meta');
      description.setAttribute('name', 'description');
      document.head.appendChild(description);
    }
    description.setAttribute('content', meta.description);
  }, [page]);

  const pageContent = {
    home: (
      <>
        <Hero creature={creature} />
        <FeatureDeck />
      </>
    ),
    library: (
      <CreatureExplorer
        query={query}
        setQuery={setQuery}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        tameFilter={tameFilter}
        setTameFilter={setTameFilter}
        categoryOptions={categoryOptions}
        tameOptions={tameOptions}
        filteredCreatures={filteredCreatures}
        selectedCreature={selectedCreature}
        setSelectedCreature={setSelectedCreature}
      />
    ),
    taming: (
      <TamingCalculator
        creature={creature}
        selectedFood={selectedFood}
        setSelectedFood={setSelectedFood}
        wildLevel={wildLevel}
        setWildLevel={setWildLevel}
        weaponQuality={weaponQuality}
        setWeaponQuality={setWeaponQuality}
        narcoticId={narcoticId}
        setNarcoticId={setNarcoticId}
      />
    ),
    tribe: <TribeSection account={account} setAccount={setAccount} />,
    maps: <MapSection />,
    servers: <ServerSection />,
    account: <AccountSection account={account} setAccount={setAccount} />,
  };

  return (
    <main className="ow-site">
      <video className="ow-video" autoPlay muted loop playsInline>
        <source src="./splash-video.mp4" type="video/mp4" />
      </video>
      <div className="ow-backdrop" />
      <Header account={account} page={page} setSelectedCreature={setSelectedCreature} />
      <div className="ow-page">
        {pageContent[page] || pageContent.home}
      </div>
    </main>
  );
}
