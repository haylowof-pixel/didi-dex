/**
 * Maps creature names to their ARK wiki icon URLs.
 * Uses https://ark.wiki.gg/images/thumb/{Name}.png/64px-{Name}.png pattern.
 */

const SPECIAL_NAMES = {
  // Verified wiki icon filenames that differ from in-app names
  'Therizinosaurus':    'Therizinosaur',
  'Spinosaurus':        'Spino',
  'Sarcosuchus':        'Sarco',
  'Pulmonoscorpius':    'Scorpion',
  'Castoroides':        'Giant_Beaver',
  'Araneo':             'Spider',
  'Compsognathus':      'Compy',
  'Triceratops':        'Trike',
  'Pachycephalosaurus': 'Pachy',
  'Thylacosmilus':      'Thylacoleo', // No wiki icon, use Thylacoleo as closest match
  'Sabertooth Salmon':  'Salmon',
  'Megapiranha':        'Piranha',
  'DodoRex':            'Dodorex',
  'Super Turkey':       'Turkey',
  'Royal Griffin':      'Griffin',
  'Quetzalcoatlus':     'Quetzal',
  'Woolly Rhino':       'Woolly_Rhinoceros',
  'Woolly Mammoth':     'Mammoth',

  // Tek variants
  'Tek Quetzal':        'Tek_Quetzal',

  // X- variants with special base names
  'X-Woolly Rhino':     'Woolly_Rhinoceros',
  'X-Woolly Mammoth':   'Mammoth',

  // Alpha creatures → use base creature icon
  'Alpha Rex':          'Rex',
  'Alpha Raptor':       'Raptor',
  'Alpha Carno':        'Carnotaurus',
  'Alpha Mosasaur':     'Mosasaurus',
  'Alpha Tusoteuthis':  'Tusoteuthis',
  'Alpha Leedsichthys': 'Leedsichthys',
  'Alpha Megalodon':    'Megalodon',

  // Event creatures
  'Zombie Wyvern':      'Wyvern',
  'Skeletal Rex':       'Rex',
  'Bunny Dodo':         'Dodo',
};

/**
 * Base name resolver for special wiki icon names.
 * Used by R- and Aberrant variants to find the correct base icon.
 */
const BASE_SPECIAL = {
  'Therizinosaurus':   'Therizinosaur',
  'Spinosaurus':       'Spino',
  'Sarcosuchus':       'Sarco',
  'Pulmonoscorpius':   'Scorpion',
  'Castoroides':       'Giant_Beaver',
  'Araneo':            'Spider',
  'Compsognathus':     'Compy',
  'Triceratops':       'Trike',
  'Pachycephalosaurus':'Pachy',
  'Woolly Rhino':      'Woolly_Rhinoceros',
  'Woolly Mammoth':    'Mammoth',
  'Quetzalcoatlus':    'Quetzal',
  // These use the FULL name as wiki icon (not abbreviated)
  'Stegosaurus':       'Stegosaurus',
  'Carnotaurus':       'Carnotaurus',
  'Brontosaurus':      'Brontosaurus',
  'Ankylosaurus':      'Ankylosaurus',
  'Trike':             'Trike',
  'Stego':             'Stegosaurus',
  'Carno':             'Carnotaurus',
  'Bronto':            'Brontosaurus',
};

const LOCAL_ICON_URLS = {
  Ankylosaurus: './creatures/wiki/ankylosaurus.png',
  Argentavis: './creatures/wiki/argentavis.png',
  Baryonyx: './creatures/wiki/baryonyx.png',
  Carnotaurus: './creatures/wiki/carnotaurus.png',
  Carno: './creatures/wiki/carnotaurus.png',
  Doedicurus: './creatures/wiki/doedicurus.png',
  Giganotosaurus: './creatures/wiki/giganotosaurus.png',
  Parasaur: './creatures/wiki/parasaur.png',
  Pteranodon: './creatures/wiki/pteranodon.png',
  Quetzalcoatlus: './creatures/wiki/quetzalcoatlus.png',
  Quetzal: './creatures/wiki/quetzalcoatlus.png',
  Raptor: './creatures/wiki/raptor.png',
  'Alpha Raptor': './creatures/wiki/raptor.png',
  Rex: './creatures/wiki/rex.png',
  'Alpha Rex': './creatures/wiki/rex.png',
  'Alpha T-Rex': './creatures/wiki/rex.png',
  'Tek Rex': './creatures/wiki/rex.png',
  'X-Rex': './creatures/wiki/rex.png',
  Spinosaurus: './creatures/wiki/spinosaurus.png',
  Spino: './creatures/wiki/spinosaurus.png',
  'Aberrant Spino': './creatures/wiki/spinosaurus.png',
  Stegosaurus: './creatures/wiki/stegosaurus.png',
  Stego: './creatures/wiki/stegosaurus.png',
  'Aberrant Stegosaurus': './creatures/wiki/stegosaurus.png',
  Therizinosaurus: './creatures/wiki/therizinosaurus.png',
  Therizinosaur: './creatures/wiki/therizinosaurus.png',
  Triceratops: './creatures/wiki/triceratops.png',
  Trike: './creatures/wiki/triceratops.png',
  'X-Triceratops': './creatures/wiki/triceratops.png',
  'Aberrant Triceratops': './creatures/wiki/triceratops.png',
  Yutyrannus: './creatures/wiki/yutyrannus.png',
};

const LOCAL_DOSSIER_URLS = {
  Ankylosaurus: './creatures/dossiers/ankylosaurus.png',
  Argentavis: './creatures/dossiers/argentavis.png',
  Baryonyx: './creatures/dossiers/baryonyx.png',
  Doedicurus: './creatures/dossiers/doedicurus.png',
  Giganotosaurus: './creatures/dossiers/giganotosaurus.png',
  Pteranodon: './creatures/dossiers/pteranodon.png',
  Quetzalcoatlus: './creatures/dossiers/quetzalcoatlus.png',
  Quetzal: './creatures/dossiers/quetzalcoatlus.png',
  Raptor: './creatures/dossiers/raptor.png',
  Rex: './creatures/dossiers/rex.png',
  Spinosaurus: './creatures/dossiers/spinosaurus.png',
  Spino: './creatures/dossiers/spinosaurus.png',
  Therizinosaurus: './creatures/dossiers/therizinosaurus.png',
  Therizinosaur: './creatures/dossiers/therizinosaurus.png',
};

import { LOCAL_CREATURE_ICON_URLS } from './localCreatureIcons.generated';

/**
 * For R- and Aberrant variants, strip the prefix to use the base creature icon.
 */
function resolveVariantName(name) {
  if (name.startsWith('R-')) {
    const base = name.slice(2);
    if (BASE_SPECIAL[base]) return BASE_SPECIAL[base];
    if (SPECIAL_NAMES[base]) return SPECIAL_NAMES[base];
    return base.replace(/ /g, '_');
  }
  if (name.startsWith('Aberrant ')) {
    const base = name.slice(9);
    if (BASE_SPECIAL[base]) return BASE_SPECIAL[base];
    if (SPECIAL_NAMES[base]) return SPECIAL_NAMES[base];
    return base.replace(/ /g, '_');
  }
  if (name.startsWith('X-')) {
    if (SPECIAL_NAMES[name]) return SPECIAL_NAMES[name];
    const base = name.slice(2);
    if (BASE_SPECIAL[base]) return BASE_SPECIAL[base];
    if (SPECIAL_NAMES[base]) return SPECIAL_NAMES[base];
    return base.replace(/ /g, '_');
  }
  return null;
}

/**
 * Returns the ARK wiki icon URL for a given creature name.
 */
export function getCreatureIconUrl(name) {
  if (LOCAL_CREATURE_ICON_URLS[name]) {
    return LOCAL_CREATURE_ICON_URLS[name];
  }

  if (LOCAL_ICON_URLS[name]) {
    return LOCAL_ICON_URLS[name];
  }

  const variant = resolveVariantName(name);
  if (variant) {
    if (LOCAL_ICON_URLS[variant]) {
      return LOCAL_ICON_URLS[variant];
    }
    return `https://ark.wiki.gg/images/thumb/${variant}.png/64px-${variant}.png`;
  }

  const wikiName = SPECIAL_NAMES[name] || name.replace(/ /g, '_');
  if (LOCAL_CREATURE_ICON_URLS[wikiName]) {
    return LOCAL_CREATURE_ICON_URLS[wikiName];
  }
  if (LOCAL_ICON_URLS[wikiName]) {
    return LOCAL_ICON_URLS[wikiName];
  }

  return `https://ark.wiki.gg/images/thumb/${wikiName}.png/64px-${wikiName}.png`;
}

/**
 * Returns the ARK wiki dossier image URL (full creature artwork).
 */
export function getCreatureDossierUrl(name) {
  if (LOCAL_DOSSIER_URLS[name]) return LOCAL_DOSSIER_URLS[name];
  const wikiName = name.replace(/ /g, '_');
  return `https://ark.wiki.gg/images/thumb/Dossier_${wikiName}.png/400px-Dossier_${wikiName}.png`;
}

/**
 * Returns fallback image URLs to try for a creature.
 * Dossier images use full creature names more often than icon aliases (e.g. Spinosaurus, not Spino).
 */
export function getCreatureImageFallbacks(name) {
  const variant = resolveVariantName(name);
  const fullName = name.replace(/ /g, '_');
  const aliasName = SPECIAL_NAMES[name] || variant || fullName;
  const candidates = [fullName, aliasName].filter(Boolean);
  const unique = Array.from(new Set(candidates));
  const localCandidates = [name, aliasName, variant].filter(Boolean)
    .map(candidate => LOCAL_DOSSIER_URLS[candidate])
    .filter(Boolean);
  return [
    ...Array.from(new Set(localCandidates)),
    ...unique.flatMap(wikiName => [
    `https://ark.wiki.gg/images/thumb/Dossier_${wikiName}.png/400px-Dossier_${wikiName}.png`,
    `https://ark.wiki.gg/images/thumb/${wikiName}_PaintRegion0_ASA.png/400px-${wikiName}_PaintRegion0_ASA.png`,
    `https://ark.wiki.gg/images/thumb/${wikiName}_PaintRegion0.png/400px-${wikiName}_PaintRegion0.png`,
    ]),
  ];
}
