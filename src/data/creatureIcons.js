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
  const variant = resolveVariantName(name);
  if (variant) {
    return `https://ark.wiki.gg/images/thumb/${variant}.png/64px-${variant}.png`;
  }
  const wikiName = SPECIAL_NAMES[name] || name.replace(/ /g, '_');
  return `https://ark.wiki.gg/images/thumb/${wikiName}.png/64px-${wikiName}.png`;
}

/**
 * Returns the ARK wiki dossier image URL (full creature artwork).
 */
export function getCreatureDossierUrl(name) {
  const variant = resolveVariantName(name);
  const wikiName = variant || SPECIAL_NAMES[name] || name.replace(/ /g, '_');
  return `https://ark.wiki.gg/images/thumb/Dossier_${wikiName}.png/400px-Dossier_${wikiName}.png`;
}

/**
 * Returns fallback image URLs to try for a creature (dossier, PaintRegion0_ASA, PaintRegion0, icon).
 */
export function getCreatureImageFallbacks(name) {
  const variant = resolveVariantName(name);
  const wikiName = variant || SPECIAL_NAMES[name] || name.replace(/ /g, '_');
  return [
    `https://ark.wiki.gg/images/thumb/Dossier_${wikiName}.png/400px-Dossier_${wikiName}.png`,
    `https://ark.wiki.gg/images/thumb/${wikiName}_PaintRegion0_ASA.png/400px-${wikiName}_PaintRegion0_ASA.png`,
    `https://ark.wiki.gg/images/thumb/${wikiName}_PaintRegion0.png/400px-${wikiName}_PaintRegion0.png`,
    `https://ark.wiki.gg/images/thumb/${wikiName}.png/128px-${wikiName}.png`,
  ];
}
