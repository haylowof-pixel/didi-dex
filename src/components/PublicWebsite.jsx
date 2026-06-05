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

const servers = [
  ['ASA Official 101', 'The Island', '64/70', '38 ms', 'Online'],
  ['SmallTribes EU', 'Scorched Earth', '48/70', '42 ms', 'Online'],
  ['Community PvE', 'Lost Island', '21/100', '24 ms', 'Online'],
  ['Overseer Test Cluster', 'Aberration', '0/70', '12 ms', 'Idle'],
];

const navItems = [
  ['creatures', 'Accueil'],
  ['library', 'Dinos'],
  ['taming', 'Taming'],
  ['tribe', 'Tribu'],
  ['maps', 'Cartes'],
  ['servers', 'Serveurs'],
  ['account', 'Compte'],
];

function assetFallback(event, fallback = './icon-128.png') {
  event.currentTarget.src = fallback;
}

function scrollToSection(id) {
  const section = document.getElementById(id);
  if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function formatPercent(value) {
  return `${Number(value).toFixed(1)}%`;
}

function energyStyle(value) {
  return { '--ow-value': `${Math.max(0, Math.min(100, value))}%` };
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
    ['Bestiaire', 'Recherche et filtres sur les créatures tamables.', SkullIcon, 'Dinos'],
    ['Taming', 'Nourriture, torpeur, narcotiques et tirs nécessaires.', TamingLassoIcon, 'Calculateur'],
    ['Boss planner', 'Checklist de préparation pour les runs tribu.', ClipboardIcon, 'Tribu'],
    ['Cartes', 'Cartes ARK et repères de progression.', MapIcon, 'Maps'],
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
        {webFeatures.map(([title, text, Icon, action]) => (
          <article key={title} className="ow-feature-card ow-card-energy">
            <Icon size={22} />
            <strong>{title}</strong>
            <p>{text}</p>
            <span>{action}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

function Header({ account }) {
  return (
    <header className="ow-header">
      <a className="ow-logo" href="#">
        <img src="./icon-128.png" alt="" />
        <span>
          <strong>OVERSEER</strong>
          <em>Survival Companion</em>
        </span>
      </a>
      <nav>
        {navItems.map(item => (
          <button type="button" key={item[0]} onClick={() => scrollToSection(item[0])}>{item[1]}</button>
        ))}
      </nav>
      <div className="ow-header-actions">
        <a href="?app=1">App Windows</a>
        <a href={releaseUrl}>Télécharger</a>
        <span>{account.userId ? account.displayName || 'Profil' : 'Compte'}</span>
      </div>
    </header>
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
          <button type="button" onClick={() => scrollToSection('library')}>Chercher une créature</button>
          <button type="button" onClick={() => scrollToSection('taming')}>Ouvrir le calculateur</button>
          <button type="button" onClick={() => scrollToSection('tribe')}>Préparer un boss</button>
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

  return (
    <section className="ow-section ow-taming-section" id="taming">
      <div className="ow-section-head">
        <span><TamingLassoIcon size={18} /> Calculateur tame</span>
        <h2>Calculer le tame du {creature.name}.</h2>
        <p>Choisis le niveau, la nourriture, le type de narcotique et la qualité d’arme. Les quantités se mettent à jour directement.</p>
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
  const active = creatures.find(item => item.id === selectedCreature) || filteredCreatures[0] || creatures[0];
  const bestFood = active.foods[0]?.[1] || 'Non tame';
  const visibleCreatures = filteredCreatures.slice(0, 90);

  return (
    <section className="ow-section ow-creature-browser" id="library">
      <div className="ow-section-head">
        <span><SkullIcon size={18} /> Explorateur créatures</span>
        <h2>Trouve une créature et lance le calcul.</h2>
        <p>{filteredCreatures.length} créatures tamables disponibles avec nourriture, torpeur, narcotiques et armes.</p>
      </div>
      <div className="ow-browser-layout">
        <aside className="ow-browser-panel ow-panel">
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
        </aside>

        <div className="ow-browser-results">
          {visibleCreatures.map(creature => (
            <button
              type="button"
              key={creature.id}
              className={selectedCreature === creature.id ? 'active' : ''}
              onClick={() => setSelectedCreature(creature.id)}
            >
              <img src={creature.icon} alt="" onError={assetFallback} />
              <span>
                <strong>{creature.name}</strong>
                <em>{creature.species}</em>
              </span>
              <b>{creature.diet}</b>
            </button>
          ))}
          {!visibleCreatures.length && (
            <div className="ow-empty-state">
              <strong>Aucun résultat</strong>
              <span>Change la recherche ou enlève un filtre.</span>
            </div>
          )}
        </div>

        <article className="ow-browser-focus ow-card-energy">
          <img src={active.dossier} alt="" onError={event => assetFallback(event, active.icon)} />
          <div>
            <span>Dossier sélectionné</span>
            <h3>{active.name}</h3>
            <p>{active.warning}</p>
          </div>
          <dl>
            <div>
              <dt>Régime</dt>
              <dd>{active.diet}</dd>
            </div>
            <div>
              <dt>Tame</dt>
              <dd>{active.tame}</dd>
            </div>
            <div>
              <dt>Food</dt>
              <dd>{bestFood}</dd>
            </div>
          </dl>
          <button type="button" onClick={() => scrollToSection('taming')}>Calculer ce tame</button>
        </article>
      </div>
    </section>
  );
}

function TribeSection({ checks, setChecks }) {
  const items = ['Artefacts', 'Trophées', 'Brews', 'Ammo', 'Cryopods', 'Selles', 'Armée', 'Rôles'];
  const ready = items.filter(item => checks[item]).length;

  return (
    <section className="ow-section" id="tribe">
      <div className="ow-section-head">
        <span><ClipboardIcon size={18} /> Tribus et boss</span>
        <h2>Préparer un run boss.</h2>
        <p>Choisis un boss, coche les préparatifs et garde une readiness lisible avant de lancer l’arène.</p>
      </div>
      <div className="ow-tribe-layout">
        <article className="ow-bosses ow-panel">
          {bosses.map(boss => (
            <button type="button" key={boss[0]}>
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
          <div>
            <span>Préparation</span>
            <strong>{ready}/{items.length}</strong>
          </div>
          <div className="ow-checklist">
            {items.map(item => (
              <label key={item}>
                <input
                  type="checkbox"
                  checked={Boolean(checks[item])}
                  onChange={event => setChecks(prev => ({ ...prev, [item]: event.target.checked }))}
                />
                <span>{item}</span>
              </label>
            ))}
          </div>
        </article>
      </div>
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

function ServerSection() {
  return (
    <section className="ow-section" id="servers">
      <div className="ow-section-head">
        <span><ServerIcon size={18} /> Serveurs</span>
        <h2>Serveurs favoris.</h2>
      </div>
      <div className="ow-server-grid">
        {servers.map(server => (
          <article key={server[0]} className="ow-panel">
            <span className={server[4] === 'Online' ? 'online' : ''} />
            <strong>{server[0]}</strong>
            <em>{server[1]}</em>
            <b>{server[2]}</b>
            <small>{server[3]}</small>
          </article>
        ))}
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
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [tameFilter, setTameFilter] = useState('all');
  const [selectedCreature, setSelectedCreature] = useState(creatures[0].id);
  const [selectedFood, setSelectedFood] = useState(creatures[0].foods[0][0]);
  const [wildLevel, setWildLevel] = useState(150);
  const [weaponQuality, setWeaponQuality] = useState(100);
  const [narcoticId, setNarcoticId] = useState('narcotic');
  const [tribeChecks, setTribeChecks] = useState({});
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
    return () => {
      document.documentElement.classList.remove('public-web-root');
      document.body.classList.remove('public-web-body');
    };
  }, []);

  return (
    <main className="ow-site">
      <video className="ow-video" autoPlay muted loop playsInline>
        <source src="./splash-video.mp4" type="video/mp4" />
      </video>
      <div className="ow-backdrop" />
      <Header account={account} />
      <Hero
        creature={creature}
      />
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
      <FeatureDeck />
      <TribeSection checks={tribeChecks} setChecks={setTribeChecks} />
      <MapSection />
      <ServerSection />
      <AccountSection account={account} setAccount={setAccount} />
    </main>
  );
}
