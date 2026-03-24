import { FOOD_TYPES, NARCOTICS } from './dinosaurs';
import { ASB_TAMING } from './asbTaming';

/**
 * ARK Taming Calculator — Using ASB affinity data
 *
 * Food affinity values calibrated from wiki/Dododex:
 *   Rex 150: 17 Exceptional Kibble → 25950/17 ≈ 1526 per kibble
 *   Griffin 150: 11 Extraordinary Kibble → 17200/11 ≈ 1563 per kibble
 *   Raptor 150: 7 Simple Kibble → 10200/7 ≈ 1457 per kibble
 *   All kibble ≈ 1500 affinity per item
 *   Raw Meat ≈ 200, Mutton ≈ 750, Prime ≈ 600
 */

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
  // Try direct match
  if (ASB_TAMING[dinoName]) return ASB_TAMING[dinoName];
  // Try name mapping
  if (NAME_TO_ASB[dinoName] && ASB_TAMING[NAME_TO_ASB[dinoName]]) {
    return ASB_TAMING[NAME_TO_ASB[dinoName]];
  }
  // Try removing common prefixes for variants
  const prefixes = ['Aberrant ', 'X-', 'R-', 'Tek ', 'Corrupted ', 'Skeletal '];
  for (const p of prefixes) {
    if (dinoName.startsWith(p)) {
      const base = dinoName.slice(p.length);
      const asbName = p + (NAME_TO_ASB[base] || base);
      if (ASB_TAMING[asbName]) return ASB_TAMING[asbName];
      // Also try the base name directly (variants often share stats)
      const baseAsb = NAME_TO_ASB[base] || base;
      if (ASB_TAMING[baseAsb]) return ASB_TAMING[baseAsb];
    }
  }
  return null;
}

export function calculateTaming(dino, level, foodKey, tamingMultiplier = 1) {
  if (!dino || !foodKey) return null;

  const foodData = dino.tamingFoods.find(f => f.food === foodKey);
  if (!foodData) return null;

  const affinityPerItem = FOOD_AFFINITY[foodKey] || (foodData.affinityPerItem * 12.5);

  // Use ASB data for accurate affinity if available, otherwise fallback to dino data
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
  const foodDrainPerSec = Math.max(foodRate * 100, 0.05);
  const foodPerItem = foodData.foodPerItem || 50;
  const secondsPerFood = foodPerItem / foodDrainPerSec;
  const totalTimeSeconds = Math.ceil(foodNeeded * secondsPerFood);

  // --- Starve time ---
  const totalFoodPointsNeeded = foodNeeded * foodPerItem;
  const starveTimeSeconds = Math.ceil(totalFoodPointsNeeded / foodDrainPerSec);

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
