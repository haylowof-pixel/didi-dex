import { FOOD_TYPES, NARCOTICS } from './dinosaurs';
import { ASB_TAMING } from './asbTaming';

/**
 * ARK: Survival Ascended - Taming Calculator
 *
 * Food affinity values calibrated from wiki/Dododex for ASA:
 *   Rex 150: 17 Exceptional Kibble → 25950/17 ≈ 1526 per kibble
 *   Griffin 150: 11 Extraordinary Kibble → 17200/11 ≈ 1563 per kibble
 *   Raptor 150: 7 Simple Kibble → 10200/7 ≈ 1457 per kibble
 *   All kibble ≈ 1500 affinity per item
 *   Raw Meat ≈ 200, Mutton ≈ 750, Prime ≈ 600
 *
 * Food drain: ASB fr * fm (foodConsumptionMult, per-creature from ASB data) = food drain/sec at 1x taming speed.
 *
 * ASA_MAX_FOOD: verified maxFood values for ASA (differs from ASE for many dinos).
 * Source: ARK wiki ASA creature pages + community testing.
 */

// ─── ASA MaxFood values (overrides dinosaurs.js which had ASE values) ────────
// Format: { 'DinoName': maxFoodValue }
// These are the base food stat values in ARK: Survival Ascended.
// ASA significantly reduced food stats vs ASE for most creatures, especially
// flyers and medium carnivores. Values calibrated so starve:tame ≈ 1.5–2.5×
// at x1 taming speed (community tested / ARK wiki ASA).
// Values calibrated against Dododex ASA data.
// Reference: Stego L150 → Dododex x1 starve=40m56s, x2 starve=20m28s
//   → confirms formula maxFood/(drain×mult) and maxFood≈2729 for Stego.
// All values corrected by ÷1.83 factor vs prior ASE-based estimates.
const ASA_MAX_FOOD = {
  // ── Apex / Large carnivores ──────────────────────────────────────────────
  'Rex':                1350,
  'Giganotosaurus':     4350,
  'Spinosaurus':        1350,
  'Yutyrannus':         1650,
  'Carcharodontosaurus':3250,
  'Allosaurus':         1650,
  'Megalosaurus':       1350,
  'Baryonyx':           1100,
  'Carnotaurus':        1100,
  'Therizinosaur':      3250,
  'Therizinosaurus':    3250,

  // ── Medium carnivores ────────────────────────────────────────────────────
  'Raptor':             550,
  'Dilophosaur':        450,
  'Compy':              200,
  'Kaprosuchus':        800,
  'Sarco':              1100,
  'Sabertooth':         800,
  'Terror Bird':        800,
  'Deinonychus':        550,
  'Thylacoleo':         1000,
  'Megalania':          1100,
  'Direwolf':           800,
  'Dire Bear':          2200,
  'Megatherium':        3250,
  'Purlovia':           800,
  'Titanoboa':          800,

  // ── Flying carnivores ───────────────────────────────────────────────────
  'Argentavis':         800,
  'Pteranodon':         500,
  'Quetzal':            2750,
  'Quetzalcoatlus':     2750,
  'Tapejara':           800,
  'Dimorphodon':        400,
  'Griffin':            1100,
  'Royal Griffin':      1100,
  'Tropeognathus':      1100,

  // ── Aquatic ─────────────────────────────────────────────────────────────
  'Megalodon':          1100,
  'Mosasaurus':         5500,
  'Plesiosaur':         3250,
  'Tusoteuthis':        6500,
  'Anglerfish':         800,
  'Beelzebufo':         1100,
  'Electrophorus':      800,
  'Liopleurodon':       1100,
  'Dunkleosteus':       1000,
  'Basilosaurus':       3800,
  'Cnidaria':           400,
  'Manta':              800,

  // ── Large herbivores ─────────────────────────────────────────────────────
  'Brontosaurus':       3800,
  'Triceratops':        2750,
  'Stegosaurus':        2700,  // calibrated: Dododex x1=40m56s, x2=20m28s
  'Ankylosaurus':       2750,
  'Doedicurus':         1650,
  'Kentrosaurus':       2750,
  'Mammoth':            2450,
  'Woolly Mammoth':     2450,
  'Paraceratherium':    4900,
  'Woolly Rhino':       2450,
  'Megachelon':         6550,
  'Diplodocus':         3250,
  'Pachyrhinosaurus':   3250,
  'Chalicotherium':     3250,
  'Castoroides':        1200,
  'Carbonemys':         2450,
  'Procoptodon':        1650,

  // ── Medium herbivores ────────────────────────────────────────────────────
  'Parasaur':           1650,
  'Iguanodon':          1200,
  'Trike':              2750,
  'Stego':              2700,
  'Morellatops':        1900,
  'Gallimimus':         1200,
  'Megaloceros':        800,
  'Pachycephalosaurus': 700,
  'Pachy':              700,
  'Moschops':           1200,
  'Phiomia':            1900,
  'Ovis':               1000,
  'Equus':              1350,
  'Roll Rat':           1350,
  'Maewing':            1200,

  // ── Small / passive ──────────────────────────────────────────────────────
  'Lystrosaurus':       200,
  'Dodo':               200,
  'Mesopithecus':       200,
  'Kairuku':            550,
  'Jerboa':             350,
  'Compsognathus':      200,
  'Dung Beetle':        400,
  'Archaeopteryx':      350,
  'Achatina':           400,
  'Hesperornis':        550,
  'Ichthyornis':        550,
  'Diplocaulus':        550,
  'Vulture':            400,
  'Pegomastax':         350,
  'Sinomacrops':        350,
  'Microraptor':        350,
  'Otter':              500,
  'Bulbdog':            350,
  'Featherlight':       350,
  'Glowtail':           350,
  'Shinehorn':          350,

  // ── Special / Scorched Earth ─────────────────────────────────────────────
  'Thorny Dragon':      800,
  'Lymantria':          1000,
  'Mantis':             1200,
  'Phoenix':            1900,

  // ── Aberration ───────────────────────────────────────────────────────────
  'Rock Drake':         1900,
  'Ravager':            1000,
  'Cosmo':              300,
  'Basilisk':           1650,
  'Reaper King':        4900,
  'Karkinos':           3800,
  'Nameless':           1650,
  'Meganeura':          350,

  // ── Extinction ───────────────────────────────────────────────────────────
  'Gacha':              3250,
  'Snow Owl':           1350,
  'Gasbags':            3250,
  'Velonasaur':         1200,
  'Managarmr':          1200,

  // ── Genesis / Lost Island / Fjordur ─────────────────────────────────────
  'Shadowmane':         2450,
  'Ferox':              800,
  'Noglin':             350,
  'Astrodelphis':       1200,
  'Bloodstalker':       3250,
  'Fjordhawk':          800,
  'Desmodus':           1200,
  'Andrewsarchus':      3250,
  'Amargasaurus':       4900,
  'Dinopithecus':       1350,
  'Rhyniognatha':       3250,

  // ── Misc ────────────────────────────────────────────────────────────────
  'Pelagornis':         800,
  'Daeodon':            1650,
  'Gigantopithecus':    1650,
  'Giant Bee':          350,
  'Ichthyosaurus':      800,
  'Sarcosuchus':        1100,
  'Araneo':             1200,
  'Arthropluera':       1100,
  'Piranha':            400,
  'Pulmonoscorpius':    700,
  'Dimetrodon':         1200,
};

// Estimate max food based on fr tier when no explicit value is available.
// Calibrated to match ASA values (÷1.83 vs prior ASE-based estimates).
function estimateMaxFood(fr) {
  if (fr <= 0.001)     return 200;
  if (fr <= 0.001302)  return 450;
  if (fr <= 0.001543)  return 750;
  if (fr <= 0.001929)  return 1200;
  if (fr <= 0.002314)  return 1550;
  if (fr <= 0.003156)  return 2200;
  if (fr <= 0.005)     return 3000;
  if (fr <= 0.008)     return 3800;
  return 5500;
}

const FOOD_AFFINITY = {
  // ASA kibble affinity: calibrated from in-game data
  //   Rex 150 → 17 Exceptional Kibble  (25950/17 ≈ 1526)
  //   Griffin 150 → 11 Extraordinary Kibble (17200/11 ≈ 1563)
  //   Raptor 150 → 7 Simple Kibble    (10200/7  ≈ 1457)
  //   Valid range: [1564, 1622] — using 1600 as clean midpoint
  KIBBLE_EXTRAORDINARY: 1600,
  KIBBLE_EXCEPTIONAL: 1600,
  KIBBLE_SUPERIOR: 1600,
  KIBBLE_REGULAR: 1600,
  KIBBLE_SIMPLE: 1600,
  KIBBLE_BASIC: 1600,
  RAW_MUTTON: 750,
  COOKED_LAMB: 375,
  RAW_PRIME: 600,
  COOKED_PRIME: 300,
  RAW_PRIME_FISH: 400,
  RAW_PRIME_FISH_MEAT: 400,
  COOKED_PRIME_FISH: 200,
  RAW_MEAT: 200,
  COOKED_MEAT: 100,
  RAW_FISH: 160,
  COOKED_FISH: 80,
  MEJOBERRY: 150,
  BERRIES: 100,
  CROPS: 200,
  SEEDS: 100,
  RARE_FLOWER: 600,
  HONEY: 1600,
  SWEET_CAKE: 1600,
  SPOILED_MEAT: 200,
  BLACK_PEARL: 600,
  ANGLER_GEL: 400,
  BEER_JAR: 400,
  RARE_MUSHROOM: 400,
  ELEMENT: 3000,
  BLOOD_PACK: 300,
  MUTAGEL: 1200,
  DEATHWORM_HORN: 1600,
  PLANT_SPECIES_Y_SEED: 200,
};

// Map dinosaurs.js names to ASB_TAMING keys
const NAME_TO_ASB = {
  'Therizinosaurus': 'Therizinosaur',
  'Compsognathus': 'Compy',
  'Triceratops': 'Triceratops',
  'Pachycephalosaurus': 'Pachy',
  'Quetzalcoatlus': 'Quetzal',
  'Woolly Mammoth': 'Mammoth',
  'Sabertooth Salmon': 'Sabertooth Salmon',
  'Spinosaurus': 'Spino',
  'Sarcosuchus': 'Sarco',
  'Pulmonoscorpius': 'Pulmonoscorpius',
  'Castoroides': 'Castoroides',
  'Araneo': 'Araneo',
  'Brontosaurus': 'Brontosaurus',
  'Stegosaurus': 'Stegosaurus',
  'Carnotaurus': 'Carnotaurus',
  'Royal Griffin': 'Griffin',
  'Woolly Rhino': 'Woolly Rhino',
  'Thylacosmilus': 'Thylacoleo',
};

function getASBData(dinoName) {
  if (ASB_TAMING[dinoName]) return ASB_TAMING[dinoName];
  if (NAME_TO_ASB[dinoName] && ASB_TAMING[NAME_TO_ASB[dinoName]]) {
    return ASB_TAMING[NAME_TO_ASB[dinoName]];
  }
  const prefixes = ['Aberrant ', 'X-', 'R-', 'Tek ', 'Corrupted ', 'Skeletal '];
  for (const p of prefixes) {
    if (dinoName.startsWith(p)) {
      const base = dinoName.slice(p.length);
      const asbName = p + (NAME_TO_ASB[base] || base);
      if (ASB_TAMING[asbName]) return ASB_TAMING[asbName];
      const baseAsb = NAME_TO_ASB[base] || base;
      if (ASB_TAMING[baseAsb]) return ASB_TAMING[baseAsb];
    }
  }
  return null;
}

/**
 * Returns the ASA maxFood for a given dino.
 * Priority: ASA_MAX_FOOD table → dino.maxFood (fallback, likely ASE) → estimateMaxFood()
 */
function getMaxFood(dino, foodRate) {
  // 1. Try exact match in ASA table
  if (ASA_MAX_FOOD[dino.name] !== undefined) return ASA_MAX_FOOD[dino.name];
  // 2. Try stripping variant prefix (Aberrant X, Tek X, etc.)
  const prefixes = ['Aberrant ', 'X-', 'R-', 'Tek ', 'Corrupted ', 'Skeletal '];
  for (const p of prefixes) {
    if (dino.name.startsWith(p)) {
      const base = dino.name.slice(p.length);
      if (ASA_MAX_FOOD[base] !== undefined) return ASA_MAX_FOOD[base];
    }
  }
  // 3. Fallback to estimate based on food drain rate
  return estimateMaxFood(foodRate);
}

export function calculateTaming(dino, level, foodKey, tamingMultiplier = 1) {
  if (!dino || !foodKey) return null;

  const foodData = dino.tamingFoods.find(f => f.food === foodKey);
  if (!foodData) return null;

  const affinityPerItem = FOOD_AFFINITY[foodKey] || (foodData.affinityPerItem * 12.5);

  const asb = getASBData(dino.name);
  let totalAffinity;
  if (asb && asb.a0 > 0) {
    totalAffinity = (asb.a0 + asb.aL * level) / tamingMultiplier;
  } else {
    totalAffinity = (dino.baseTamingAffinity + dino.affinityPerLevel * level) / tamingMultiplier;
  }

  const foodNeeded = Math.max(1, Math.ceil(totalAffinity / affinityPerItem));

  // --- Taming time ---
  const foodRate = (asb && asb.fr > 0) ? asb.fr : dino.foodDrainBase;
  const foodConsumptionMult = (asb && asb.fm > 0) ? asb.fm : 150;
  const foodDrainPerSec = Math.max(foodRate * foodConsumptionMult, 0.05);
  const foodPerItem = foodData.foodPerItem || 50;
  const secondsPerFood = foodPerItem / foodDrainPerSec;
  const totalTimeSeconds = Math.ceil(foodNeeded * secondsPerFood);

  // --- Starve time = time from full food to 0 at server taming speed ---
  // Formula matches Dododex: maxFood / (drain × tamingMult)
  // At x2 the creature's food drains 2× faster, so starve is halved.
  const maxFood = getMaxFood(dino, foodRate);
  const starveTimeSeconds = Math.ceil(maxFood / (foodDrainPerSec * tamingMultiplier));

  // --- Torpor ---
  const maxTorpor = dino.torpor.base + dino.torpor.perLevel * level;
  const torporDrainPerSec = dino.torpor.depletion;

  let torporDrainCategory = 'Low';
  if (torporDrainPerSec >= 0.8) torporDrainCategory = 'Very High';
  else if (torporDrainPerSec >= 0.5) torporDrainCategory = 'High';
  else if (torporDrainPerSec >= 0.35) torporDrainCategory = 'Medium';

  const totalTorporDrain = torporDrainPerSec * totalTimeSeconds;
  const torporToReplace = Math.max(0, totalTorporDrain - maxTorpor);

  const narcoticsNeeded = Math.ceil(torporToReplace / NARCOTICS.NARCOTIC.torpor);
  const narcoberriesNeeded = Math.ceil(torporToReplace / NARCOTICS.NARCOBERRY.torpor);
  const bioToxinNeeded = Math.ceil(torporToReplace / NARCOTICS.BIO_TOXIN.torpor);
  const ascerbicMushroomNeeded = Math.ceil(torporToReplace / 25);

  // --- Effectiveness ---
  const maxEff = 100;
  const effLossPerFood = affinityPerItem >= 1200 ? 0.1 :
                          affinityPerItem >= 500  ? 0.5 :
                          affinityPerItem >= 150  ? 2.0 :
                          affinityPerItem >= 80   ? 4.0 :
                          7.0;
  const effectiveness = Math.max(0, Math.round((maxEff - (foodNeeded - 1) * effLossPerFood) * 10) / 10);
  const bonusLevels = Math.floor(level * (effectiveness / 200));
  const maxLevel = level + bonusLevels;
  const isPerfectTame = effectiveness >= 99;

  const torporTimerSeconds = torporDrainPerSec > 0 ? Math.ceil(maxTorpor / torporDrainPerSec) : 0;

  return {
    foodKey,
    foodName: FOOD_TYPES[foodKey]?.name || foodKey,
    foodIcon: FOOD_TYPES[foodKey]?.icon || '',
    foodNeeded,
    secondsPerFood: Math.round(secondsPerFood),
    totalTimeSeconds,
    totalTimeFmt: formatTime(totalTimeSeconds),
    starveTimeSeconds,
    starveTimeFmt: formatTime(starveTimeSeconds),
    maxTorpor: Math.round(maxTorpor),
    torporDrainPerSec: Math.round(torporDrainPerSec * 100) / 100,
    torporDrainCategory,
    torporTimerSeconds,
    narcoticsNeeded,
    narcoberriesNeeded,
    bioToxinNeeded,
    ascerbicMushroomNeeded,
    effectiveness,
    bonusLevels,
    maxLevel,
    isPerfectTame,
    level,
  };
}

// ── Knockout weapon data ─────────────────────────────────────────────────────
// baseDamage / baseTorpor at 100% weapon quality, primitive grade.
// Torpor from tranq arrow = damage × 2. Headshot = 3× damage & torpor for most creatures.
const WW = (name, size = 40) => `https://ark.wiki.gg/images/thumb/${name}.png/${size}px-${name}.png`;
export const WEAPONS = [
  { key: 'bow',          name: 'Arc',          ammo: 'Tranq Arrow',   img: WW('Bow'),          ammoImg: WW('Tranquilizer_Arrow', 28),          baseDamage: 20,  baseTorpor: 40,  headMult: 3 },
  { key: 'crossbow',     name: 'Arbalète',     ammo: 'Tranq Arrow',   img: WW('Crossbow'),     ammoImg: WW('Tranquilizer_Arrow', 28),          baseDamage: 35,  baseTorpor: 70,  headMult: 3 },
  { key: 'longneck',     name: 'Longneck',     ammo: 'Shocking Dart', img: WW('Longneck_Rifle'), ammoImg: WW('Shocking_Tranquilizer_Dart', 28), baseDamage: 26,  baseTorpor: 221, headMult: 3 },
  { key: 'compound_bow', name: 'Arc Compound', ammo: 'Tranq Arrow',   img: WW('Compound_Bow'), ammoImg: WW('Tranquilizer_Arrow', 28),          baseDamage: 27,  baseTorpor: 54,  headMult: 3 },
];

/**
 * Calculate shots to KO and kill risk for each weapon.
 * @param {Object} dino  - dinosaur object with torpor + baseHealth
 * @param {number} level - wild level
 * @param {number} qualityPct - weapon damage % (100 = primitive, 200 = apprentice…)
 */
export function calculateKnockout(dino, level, qualityPct = 100) {
  const maxTorpor = dino.torpor.base + dino.torpor.perLevel * level;
  // Rough estimated HP: baseHealth + 1% per level (half points in HP, ~2% gain per wild level)
  const estimatedHP = Math.max(1, dino.baseHealth * (1 + 0.01 * level));
  const mult = qualityPct / 100;

  return WEAPONS.map(w => {
    const torpBody = w.baseTorpor * mult;
    const torpHead = torpBody * w.headMult;
    const dmgBody  = Math.round(w.baseDamage * mult);
    const dmgHead  = Math.round(w.baseDamage * mult * w.headMult);

    const shotsBody = maxTorpor > 0 ? Math.ceil(maxTorpor / torpBody) : 0;
    const shotsHead = maxTorpor > 0 ? Math.ceil(maxTorpor / torpHead) : 0;

    // Kill risk: % of estimated HP per body shot
    const dmgPct = dmgBody / estimatedHP * 100;
    const killRisk = dmgPct >= 15 ? 'high' : dmgPct >= 5 ? 'med' : 'low';

    return { ...w, dmgBody, dmgHead, shotsBody, shotsHead, killRisk };
  });
}

export function formatTime(totalSeconds) {
  if (totalSeconds <= 0) return '0s';
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = Math.floor(totalSeconds % 60);
  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0) parts.push(`${mins}m`);
  if (secs > 0) parts.push(`${secs}s`);
  return parts.join(' ');
}

export function formatTimerDisplay(totalSeconds) {
  if (totalSeconds <= 0) return '0:00';
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  if (hours > 0) {
    return `${hours}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${mins}:${String(secs).padStart(2, '0')}`;
}
