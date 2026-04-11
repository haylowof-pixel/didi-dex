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
const ASA_MAX_FOOD = {
  // ── Apex / Large carnivores ──────────────────────────────────────────────
  'Rex':                3000,
  'Giganotosaurus':     12000,
  'Spinosaurus':        3000,
  'Yutyrannus':         4000,
  'Carcharodontosaurus':8000,
  'Allosaurus':         4000,
  'Megalosaurus':       3500,
  'Baryonyx':           3000,
  'Carnotaurus':        3000,
  'Therizinosaur':      8000,  // herbivore but large
  'Therizinosaurus':    8000,

  // ── Medium carnivores ────────────────────────────────────────────────────
  'Raptor':             1500,
  'Dilophosaur':        1200,
  'Compy':              450,
  'Kaprosuchus':        2000,
  'Sarco':              3000,
  'Sabertooth':         2000,
  'Terror Bird':        2000,
  'Deinonychus':        1500,
  'Thylacoleo':         2500,
  'Megalania':          3000,
  'Direwolf':           2000,
  'Dire Bear':          6000,
  'Megatherium':        8000,
  'Purlovia':           2000,
  'Titanoboa':          2000,

  // ── Flying carnivores ────────────────────────────────────────────────────
  'Argentavis':         3000,
  'Pteranodon':         1500,
  'Quetzal':            8000,  // ASA Quetzal significantly higher
  'Quetzalcoatlus':     8000,
  'Tapejara':           2000,
  'Dimorphodon':        1000,
  'Griffin':            3000,
  'Royal Griffin':      3000,
  'Tropeognathus':      3000,

  // ── Aquatic ─────────────────────────────────────────────────────────────
  'Megalodon':          3000,
  'Mosasaurus':         14000,
  'Plesiosaur':         8000,
  'Tusoteuthis':        16000,
  'Anglerfish':         2000,
  'Beelzebufo':         3000,
  'Baryonyx':           3000,
  'Electrophorus':      2000,
  'Liopleurodon':       3000,
  'Dunkleosteus':       2500,
  'Basilosaurus':       10000,
  'Cnidaria':           1000,
  'Manta':              2000,

  // ── Large herbivores ─────────────────────────────────────────────────────
  'Brontosaurus':       8000,
  'Triceratops':        6000,
  'Stegosaurus':        6000,
  'Ankylosaurus':       6000,
  'Doedicurus':         4000,
  'Kentrosaurus':       6000,
  'Mammoth':            6000,
  'Woolly Mammoth':     6000,
  'Paraceratherium':    12000,
  'Woolly Rhino':       6000,
  'Megachelon':         16000,
  'Diplodocus':         8000,
  'Pachyrhinosaurus':   8000,
  'Chalicotherium':     8000,
  'Castoroides':        3000,
  'Megatherium':        8000,
  'Carbonemys':         6000,
  'Procoptodon':        4000,

  // ── Medium herbivores ────────────────────────────────────────────────────
  'Parasaur':           4000,
  'Iguanodon':          3000,
  'Trike':              6000,  // alias
  'Stego':              6000,  // alias
  'Morellatops':        5000,
  'Gallimimus':         3000,
  'Megaloceros':        2000,
  'Pachycephalosaurus': 1800,
  'Pachy':              1800,
  'Moschops':           3000,
  'Phiomia':            5000,
  'Ovis':               2500,
  'Equus':              3500,
  'Roll Rat':           3500,
  'Maewing':            3000,

  // ── Small / passive ──────────────────────────────────────────────────────
  'Lystrosaurus':       450,
  'Dodo':               450,
  'Mesopithecus':       500,
  'Kairuku':            1500,
  'Jerboa':             800,
  'Compsognathus':      450,
  'Dung Beetle':        1000,
  'Archaeopteryx':      800,
  'Achatina':           1000,
  'Hesperornis':        1500,
  'Ichthyornis':        1500,
  'Diplocaulus':        1500,
  'Vulture':            1000,
  'Pegomastax':         800,
  'Sinomacrops':        800,
  'Microraptor':        800,
  'Otter':              1200,
  'Bulbdog':            800,
  'Featherlight':       800,
  'Glowtail':           800,
  'Shinehorn':          800,

  // ── Special / Scorched Earth ─────────────────────────────────────────────
  'Thorny Dragon':      2000,
  'Lymantria':          2500,
  'Mantis':             3000,
  'Phoenix':            5000,

  // ── Aberration ───────────────────────────────────────────────────────────
  'Rock Drake':         5000,
  'Ravager':            2500,
  'Basilisk':           4000,
  'Reaper King':        12000,
  'Karkinos':           10000,
  'Nameless':           4000,
  'Meganeura':          800,

  // ── Extinction ───────────────────────────────────────────────────────────
  'Gacha':              8000,
  'Snow Owl':           3500,
  'Gasbags':            8000,
  'Velonasaur':         3000,
  'Managarmr':          3000,

  // ── Genesis / Lost Island / Fjordur ─────────────────────────────────────
  'Shadowmane':         6000,
  'Ferox':              2000,
  'Noglin':             800,
  'Astrodelphis':       3000,
  'Bloodstalker':       8000,
  'Maewing':            3000,
  'Fjordhawk':          2000,
  'Desmodus':           3000,
  'Andrewsarchus':      8000,
  'Amargasaurus':       12000,
  'Dinopithecus':       3500,
  'Rhyniognatha':       8000,

  // ── Misc ────────────────────────────────────────────────────────────────
  'Pelagornis':         2000,
  'Daeodon':            4000,
  'Gigantopithecus':    4000,
  'Giant Bee':          800,
  'Ichthyosaurus':      2000,
  'Sarcosuchus':        3000,
  'Araneo':             3000,
  'Arthropluera':       3000,
  'Piranha':            1000,
  'Pulmonoscorpius':    1800,
  'Kaprosuchus':        2000,
  'Dilophosaur':        1200,
  'Dimetrodon':         3000,
};

// Estimate max food based on fr tier when no explicit value is available.
// Thresholds calibrated for ASA food drain rates.
function estimateMaxFood(fr) {
  if (fr <= 0.001)     return 600;
  if (fr <= 0.001302)  return 1200;
  if (fr <= 0.001543)  return 2000;
  if (fr <= 0.001929)  return 3500;
  if (fr <= 0.002314)  return 4000;
  if (fr <= 0.003156)  return 6000;
  if (fr <= 0.005)     return 8000;
  if (fr <= 0.008)     return 10000;
  return 14000;
}

const FOOD_AFFINITY = {
  KIBBLE_EXTRAORDINARY: 1500,
  KIBBLE_EXCEPTIONAL: 1500,
  KIBBLE_SUPERIOR: 1500,
  KIBBLE_REGULAR: 1500,
  KIBBLE_SIMPLE: 1500,
  KIBBLE_BASIC: 1500,
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
  HONEY: 1500,
  SWEET_CAKE: 1500,
  SPOILED_MEAT: 200,
  BLACK_PEARL: 600,
  ANGLER_GEL: 400,
  BEER_JAR: 400,
  RARE_MUSHROOM: 400,
  ELEMENT: 3000,
  BLOOD_PACK: 300,
  MUTAGEL: 1200,
  DEATHWORM_HORN: 1500,
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
