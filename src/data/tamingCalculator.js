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
const ASA_MAX_FOOD = {
  // ── Apex / Large carnivores ──────────────────────────────────────────────
  'Rex':                2500,   // ASA wiki: slightly below ASE 3000
  'Giganotosaurus':     8000,
  'Spinosaurus':        2500,
  'Yutyrannus':         3000,
  'Carcharodontosaurus':6000,
  'Allosaurus':         3000,
  'Megalosaurus':       2500,
  'Baryonyx':           2000,
  'Carnotaurus':        2000,
  'Therizinosaur':      6000,
  'Therizinosaurus':    6000,

  // ── Medium carnivores ────────────────────────────────────────────────────
  'Raptor':             1000,   // ASA reduced from 1500
  'Dilophosaur':        800,
  'Compy':              350,
  'Kaprosuchus':        1500,
  'Sarco':              2000,
  'Sabertooth':         1500,
  'Terror Bird':        1500,
  'Deinonychus':        1000,
  'Thylacoleo':         1800,
  'Megalania':          2000,
  'Direwolf':           1500,
  'Dire Bear':          4000,
  'Megatherium':        6000,
  'Purlovia':           1500,
  'Titanoboa':          1500,

  // ── Flying carnivores (ASA notably reduced flyer food stats) ────────────
  'Argentavis':         1500,   // ASA wiki: 1500 (was 3000 in ASE)
  'Pteranodon':         900,    // ASA: reduced from 1500
  'Quetzal':            5000,
  'Quetzalcoatlus':     5000,
  'Tapejara':           1500,
  'Dimorphodon':        700,
  'Griffin':            2000,
  'Royal Griffin':      2000,
  'Tropeognathus':      2000,

  // ── Aquatic ─────────────────────────────────────────────────────────────
  'Megalodon':          2000,
  'Mosasaurus':         10000,
  'Plesiosaur':         6000,
  'Tusoteuthis':        12000,
  'Anglerfish':         1500,
  'Beelzebufo':         2000,
  'Electrophorus':      1500,
  'Liopleurodon':       2000,
  'Dunkleosteus':       1800,
  'Basilosaurus':       7000,
  'Cnidaria':           700,
  'Manta':              1500,

  // ── Large herbivores ─────────────────────────────────────────────────────
  'Brontosaurus':       7000,
  'Triceratops':        5000,
  'Stegosaurus':        5000,
  'Ankylosaurus':       5000,
  'Doedicurus':         3000,
  'Kentrosaurus':       5000,
  'Mammoth':            4500,
  'Woolly Mammoth':     4500,
  'Paraceratherium':    9000,
  'Woolly Rhino':       4500,
  'Megachelon':         12000,
  'Diplodocus':         6000,
  'Pachyrhinosaurus':   6000,
  'Chalicotherium':     6000,
  'Castoroides':        2200,
  'Megatherium':        6000,
  'Carbonemys':         4500,
  'Procoptodon':        3000,

  // ── Medium herbivores ────────────────────────────────────────────────────
  'Parasaur':           3000,
  'Iguanodon':          2200,
  'Trike':              5000,
  'Stego':              5000,
  'Morellatops':        3500,
  'Gallimimus':         2200,
  'Megaloceros':        1500,
  'Pachycephalosaurus': 1300,
  'Pachy':              1300,
  'Moschops':           2200,
  'Phiomia':            3500,
  'Ovis':               1800,
  'Equus':              2500,
  'Roll Rat':           2500,
  'Maewing':            2200,

  // ── Small / passive ──────────────────────────────────────────────────────
  'Lystrosaurus':       350,
  'Dodo':               350,
  'Mesopithecus':       400,
  'Kairuku':            1000,
  'Jerboa':             600,
  'Compsognathus':      350,
  'Dung Beetle':        700,
  'Archaeopteryx':      600,
  'Achatina':           700,
  'Hesperornis':        1000,
  'Ichthyornis':        1000,
  'Diplocaulus':        1000,
  'Vulture':            700,
  'Pegomastax':         600,
  'Sinomacrops':        600,
  'Microraptor':        600,
  'Otter':              900,
  'Bulbdog':            600,
  'Featherlight':       600,
  'Glowtail':           600,
  'Shinehorn':          600,

  // ── Special / Scorched Earth ─────────────────────────────────────────────
  'Thorny Dragon':      1500,
  'Lymantria':          1800,
  'Mantis':             2200,
  'Phoenix':            3500,

  // ── Aberration ───────────────────────────────────────────────────────────
  'Rock Drake':         3500,
  'Ravager':            1800,
  'Basilisk':           3000,
  'Reaper King':        9000,
  'Karkinos':           7000,
  'Nameless':           3000,
  'Meganeura':          600,

  // ── Extinction ───────────────────────────────────────────────────────────
  'Gacha':              6000,
  'Snow Owl':           2500,
  'Gasbags':            6000,
  'Velonasaur':         2200,
  'Managarmr':          2200,

  // ── Genesis / Lost Island / Fjordur ─────────────────────────────────────
  'Shadowmane':         4500,
  'Ferox':              1500,
  'Noglin':             600,
  'Astrodelphis':       2200,
  'Bloodstalker':       6000,
  'Fjordhawk':          1500,
  'Desmodus':           2200,
  'Andrewsarchus':      6000,
  'Amargasaurus':       9000,
  'Dinopithecus':       2500,
  'Rhyniognatha':       6000,

  // ── Misc ────────────────────────────────────────────────────────────────
  'Pelagornis':         1500,
  'Daeodon':            3000,
  'Gigantopithecus':    3000,
  'Giant Bee':          600,
  'Ichthyosaurus':      1500,
  'Sarcosuchus':        2000,
  'Araneo':             2200,
  'Arthropluera':       2000,
  'Piranha':            700,
  'Pulmonoscorpius':    1300,
  'Dimetrodon':         2200,
};

// Estimate max food based on fr tier when no explicit value is available.
// Thresholds calibrated for ASA food drain rates (reduced vs ASE).
function estimateMaxFood(fr) {
  if (fr <= 0.001)     return 400;
  if (fr <= 0.001302)  return 800;
  if (fr <= 0.001543)  return 1400;
  if (fr <= 0.001929)  return 2200;
  if (fr <= 0.002314)  return 2800;
  if (fr <= 0.003156)  return 4000;
  if (fr <= 0.005)     return 5500;
  if (fr <= 0.008)     return 7000;
  return 10000;
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
  CHITIN: 150,
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

  // --- Starve time (ASA corrected maxFood) ---
  const totalFoodPointsNeeded = foodNeeded * foodPerItem;
  const maxFood = getMaxFood(dino, foodRate);
  const starveTimeSeconds = maxFood > totalFoodPointsNeeded
    ? Math.ceil((maxFood - totalFoodPointsNeeded) / foodDrainPerSec)
    : 0;

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
