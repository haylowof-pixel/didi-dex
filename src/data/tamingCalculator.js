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
  'Giganotosaurus':     1108,  // Dododex ASA L150 ✓
  'Spinosaurus':        1449,  // Dododex L150: starve=1h17m56s → 4676s × 0.3099/s = 1449 ✓
  'Yutyrannus':         1193,  // Dododex ASA L150 ✓
  'Carcharodontosaurus':3250,
  'Allosaurus':         682,   // Dododex ASA L150 ✓
  'Megalosaurus':       1734,  // Dododex ASA L150 ✓
  'Baryonyx':           681,   // Dododex ASA L150 ✓
  'Carnotaurus':        681,   // Dododex ASA L150 ✓
  'Therizinosaur':      1193,  // Dododex ASA L150 ✓
  'Therizinosaurus':    1193,  // Dododex ASA L150 ✓

  // ── Medium carnivores ────────────────────────────────────────────────────
  'Raptor':             550,
  'Dilophosaur':        239,   // Dododex L150: starve=2m39s → 159s × 1.5/s = 239 ✓
  'Compy':              200,
  'Kaprosuchus':        511,   // Dododex ASA L150 ✓
  'Sarco':              511,   // Dododex ASA L150 ✓
  'Sabertooth':         426,  // Dododex ASA L150: starve=15m59s → 959s × 0.4443/s = 426 ✓
  'Terror Bird':        597,  // Dododex ASA L150 x1 starve calibrated
  'Deinonychus':        550,
  'Thylacoleo':         426,  // Dododex ASA L150 x1 starve calibrated
  'Megalania':          1100,
  'Direwolf':           426,   // Dododex ASA L150 ✓
  'Dire Bear':          852,   // Dododex ASA L150 x1 starve calibrated
  'Megatherium':        937,  // Dododex ASA L150 x1 starve calibrated
  'Purlovia':           682,  // Dododex ASA L150 x1 starve calibrated
  'Titanoboa':          800,

  // ── Flying carnivores ───────────────────────────────────────────────────
  'Argentavis':         937,   // Dododex L150: starve=42m11s → 2531s × 0.3703/s = 937 ✓
  'Pteranodon':         426,   // Dododex ASA L150 ✓
  'Quetzal':            1961,  // Dododex ASA L150 ✓
  'Quetzalcoatlus':     1961,  // Dododex ASA L150 ✓
  'Tapejara':           682,   // Dododex ASA L150 ✓
  'Dimorphodon':        400,
  'Griffin':            682,   // Dododex ASA L150 ✓
  'Royal Griffin':      682,   // Dododex ASA L150 ✓
  'Tropeognathus':      1100,

  // ── Aquatic ─────────────────────────────────────────────────────────────
  'Megalodon':          681,   // Dododex ASA L150 ✓
  'Mosasaurus':         2813,  // Dododex ASA L150 ✓
  'Plesiosaur':         1619,  // Dododex ASA L150 ✓
  'Tusoteuthis':        6500,
  'Anglerfish':         800,
  'Beelzebufo':         511,  // Dododex ASA L150 x1 starve calibrated
  'Electrophorus':      800,
  'Liopleurodon':       1100,
  'Dunkleosteus':       599,   // Dododex ASA L150 ✓
  'Basilosaurus':       3800,
  'Cnidaria':           400,
  'Manta':              800,

  // ── Large herbivores ─────────────────────────────────────────────────────
  'Brontosaurus':       3237,  // Dododex ASA L150 ✓
  'Triceratops':        2667,  // Dododex L150: starve=40m00s → 2400s × 1.1111/s = 2667 ✓
  'Stegosaurus':        2728,  // Dododex L150: starve=40m56s → 2456s × 1.1111/s = 2729 ✓
  'Ankylosaurus':       1364,  // Dododex L150: starve=40m56s → 2456s × 0.5556/s = 1364 ✓
  'Doedicurus':         1449,  // Dododex L150: starve=43m28s → 2608s × 0.5556/s = 1449 ✓
  'Kentrosaurus':       1874,  // Dododex ASA L150 ✓
  'Mammoth':            1619,  // Dododex ASA L150 ✓
  'Woolly Mammoth':     1619,  // Dododex ASA L150 ✓
  'Paraceratherium':    3000,  // Dododex ASA L150 ✓
  'Woolly Rhino':       852,   // Dododex ASA L150 ✓
  'Megachelon':         6550,
  'Diplodocus':         3494,  // Dododex ASA L150 ✓
  'Pachyrhinosaurus':   3250,
  'Chalicotherium':     3250,
  'Castoroides':        682,  // Dododex ASA L150 x1 starve calibrated
  'Carbonemys':         1022,  // Dododex ASA L150 ✓
  'Procoptodon':        1650,

  // ── Medium herbivores ────────────────────────────────────────────────────
  'Parasaur':           510,   // Dododex ASA L150 ✓
  'Iguanodon':          936,   // Dododex ASA L150 ✓
  'Trike':              2667,
  'Stego':              2728,
  'Morellatops':        959,   // Dododex ASA L150 ✓
  'Gallimimus':         879,   // Dododex L150: starve=17m35s → 1055s × 0.8333/s = 879 ✓
  'Megaloceros':        426,   // Dododex ASA L150 ✓
  'Pachycephalosaurus': 700,
  'Pachy':              700,
  'Moschops':           1200,
  'Phiomia':            955,  // Dododex ASA L150 x1 starve calibrated
  'Ovis':               1000,
  'Equus':              719,  // Dododex ASA L150 x1 starve calibrated
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
  'Snow Owl':           719,   // Dododex ASA L150 ✓
  'Gasbags':            3250,
  'Velonasaur':         1200,
  'Managarmr':          682,   // Dododex ASA L150 ✓

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
  'Daeodon':            1619, // Dododex ASA L150: starve=9m22s → 562s × 2.880/s = 1619 ✓
  'Gigantopithecus':    1650,
  'Giant Bee':          350,
  'Ichthyosaurus':      800,
  'Sarcosuchus':        511,   // Dododex ASA L150 ✓
  'Araneo':             1200,
  'Arthropluera':       1100,
  'Piranha':            400,
  'Pulmonoscorpius':    511,  // Dododex ASA L150 x1 starve calibrated
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
  MEJOBERRY: 120,  // calibrated: Trike L150 → 213 mejos = ceil(25500/120) ✓ (Dododex confirmed)
  BERRIES: 80,     // berries = mejoberry / 1.5 (ARK wiki: mejos 50% more effective)
  CROPS: 160,      // calibrated: Trike L150 → 160 crops = ceil(25500/160) ✓ (Dododex confirmed)
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

// Per-creature food affinity overrides for creatures with special food preferences.
// These override the global FOOD_AFFINITY table. Used for fish-preferring carnivores
// where raw fish > raw meat in terms of taming affinity, and creatures where
// standard affinity values don't match Dododex ASA data.
// Calibrated from Dododex ASA L150 x1 food counts.
const CREATURE_FOOD_AFFINITY = {
  // Spinosaurus: prefers fish. Raw fish = 200, raw meat = 160 (inverted vs default).
  // Dododex L150: raw meat=161 → ceil(25700/160)=161 ✓, raw fish=129 → ceil(25700/200)=129 ✓
  'Spinosaurus': {
    RAW_MEAT: 160, COOKED_MEAT: 80,
    RAW_FISH: 200, COOKED_FISH: 100,
    RAW_PRIME: 480, COOKED_PRIME: 240,
    RAW_PRIME_FISH_MEAT: 600, COOKED_PRIME_FISH: 300, COOKED_PRIME_FISH_MEAT: 300,
    RAW_MUTTON: 600, COOKED_LAMB: 300,
  },
  'Spino': {
    RAW_MEAT: 160, COOKED_MEAT: 80,
    RAW_FISH: 200, COOKED_FISH: 100,
    RAW_PRIME: 480, COOKED_PRIME: 240,
    RAW_PRIME_FISH_MEAT: 600, COOKED_PRIME_FISH: 300, COOKED_PRIME_FISH_MEAT: 300,
    RAW_MUTTON: 600, COOKED_LAMB: 300,
  },
  // Thylacoleo: ALL meats have drastically reduced affinity in ASA (prefers kibble only).
  // Dododex ASA L150: kibble=5 ✓, mutton=79 → 88/item, prime=99 → 70/item, meat=197 → 35/item.
  'Thylacoleo': {
    RAW_MEAT: 35, COOKED_MEAT: 17,
    RAW_PRIME: 70, COOKED_PRIME: 35,
    RAW_MUTTON: 88, COOKED_LAMB: 44,
  },
  // Daeodon: omnivore, all meats have reduced affinity in ASA (prefers kibble).
  // Dododex ASA L150: kibble=19, mutton=197 → 150/item, prime=211 → 140/item, meat=738 → 40/item.
  'Daeodon': {
    RAW_MEAT: 40, COOKED_MEAT: 20,
    RAW_PRIME: 140, COOKED_PRIME: 70,
    RAW_MUTTON: 150, COOKED_LAMB: 75,
    SWEET_CAKE: 1600,
  },
  // Pulmonoscorpius: eats spoiled meat (high affinity) and raw meat (low affinity).
  // Dododex ASA L150: kibble=6, spoiled=23 → 400/item, meat=149 → 62/item.
  'Pulmonoscorpius': {
    SPOILED_MEAT: 400, RAW_MEAT: 62, COOKED_MEAT: 31,
  },
  // Equus: crops have higher affinity than global value; mejoberry is very low.
  // Dododex ASA L150: kibble=9, crops=67 → 200/item, mejoberry=419 → 32/item.
  'Equus': {
    CROPS: 200, MEJOBERRY: 32, BERRIES: 16,
  },
  // Kentrosaurus: strong preference for crops; mejoberry ~4× less efficient than crops.
  // Dododex ASA L150: kibble=22, crops=212, mejoberry=845, berries=1207.
  // Standard CROPS=160 gives correct kibble/crop counts; override mejo/berries only.
  'Kentrosaurus': {
    MEJOBERRY: 40, BERRIES: 28,
  },
  // Griffin/Royal Griffin: reduced per-item affinity vs global table in ASA.
  // totalAffinity at L150 = 12040. Dododex ASA L150: kibble=8 ✓, mutton=22 → 550/item,
  // prime=28 → 430/item, meat=121 → 100/item.
  'Griffin': {
    RAW_MUTTON: 550, COOKED_LAMB: 275,
    RAW_PRIME: 430, COOKED_PRIME: 215,
    RAW_MEAT: 100, COOKED_MEAT: 50,
  },
  'Royal Griffin': {
    RAW_MUTTON: 550, COOKED_LAMB: 275,
    RAW_PRIME: 430, COOKED_PRIME: 215,
    RAW_MEAT: 100, COOKED_MEAT: 50,
  },
};

// ASA-specific taming affinity overrides (a0, aL) for creatures where ASB has ASE-era values.
// Formula: totalAffinity = a0 + aL × level (at x1 taming speed)
// foodNeeded = ceil(totalAffinity / affinityPerItem)
// Source: Dododex ASA tab calibration at L150 x1.
const ASA_TAMING_AFFINITY = {
  // Calibrated from Dododex ASA L150 x1 food counts.
  // Formula: totalAffinity = a0 + aL × level; foodNeeded = ceil(totalAffinity / affinityPerItem)
  'Sabertooth':      { a0: 450,  aL: 45  },  // ASB was 1200/60 (ASE). Dododex L150: meat=36 ✓, kibble=5 ✓
  'Terror Bird':     { a0: 1200, aL: 60  },  // ASB was 1600/85 (ASE). Dododex L150: meat=51 ✓, kibble=7 ✓
  'Dire Bear':       { a0: 1000, aL: 100 },  // ASB was 4000/125 (ASE). Dododex L150: meat=80 ✓, kibble=10 ✓
  'Megatherium':     { a0: 2200, aL: 100 },  // ASB was 5000/130 (ASE)
  'Thylacoleo':      { a0: 895,  aL: 40  },  // ASB was 2250/60 (ASE). Dododex L150: kibble=5 ✓, meat=197 ✓
  'Purlovia':        { a0: 1200, aL: 73  },  // ASB was 2250/100 (ASE). Dododex L150: meat=61 ✓, kibble=8 ✓
  'Castoroides':     { a0: 1120, aL: 72  },  // ASB was 2000/100 (ASE). Dododex L150: crops=75 ✓, mejoberry=100 ✓
  'Phiomia':         { a0: 760,  aL: 114 },  // ASB was 3000/150 (ASE). Dododex L150: crops=112 ✓, mejoberry=149 ✓
  'Pulmonoscorpius': { a0: 500,  aL: 58  },  // ASB was 1500/75 (ASE). Dododex L150: kibble=6 ✓, spoiled=23 ✓
  'Equus':           { a0: 1400, aL: 80  },  // ASB was 3600/180 (ASE). Dododex L150: kibble=9 ✓, crops=67 ✓
  'Daeodon':         { a0: 1020, aL: 190 },  // ASB was 4500/245 (ASE). Dododex L150: kibble=19 ✓, meat=738 ✓
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

export function calculateTaming(dino, level, foodKey, tamingMultiplier = 1, sanguineElixir = false) {
  if (!dino || !foodKey) return null;

  const foodData = dino.tamingFoods.find(f => f.food === foodKey);
  if (!foodData) return null;

  // Check per-creature affinity override first (e.g. fish-preferring Spino), then global table
  const creatureOverride = CREATURE_FOOD_AFFINITY[dino.name] || CREATURE_FOOD_AFFINITY[NAME_TO_ASB[dino.name]] || {};
  const affinityPerItem = creatureOverride[foodKey] !== undefined
    ? creatureOverride[foodKey]
    : (FOOD_AFFINITY[foodKey] ?? (foodData.affinityPerItem * 12.5));

  const asb = getASBData(dino.name);
  // ASA_TAMING_AFFINITY overrides ASB for creatures where ASB has ASE-era (wrong) values.
  const asaOverride = ASA_TAMING_AFFINITY[dino.name] || ASA_TAMING_AFFINITY[NAME_TO_ASB[dino.name]];
  // ASB affinity values are used directly for ASA — NO reduction factor.
  // All FOOD_AFFINITY / CREATURE_FOOD_AFFINITY values were calibrated from Dododex ASA
  // against raw ASB affinity (factor = 1.0). Applying a 0.7 factor here while keeping
  // the food affinity values unchanged caused counts to be ~30% too low.
  // Evidence: Spino L150 raw meat: ceil(25700/160)=161 (Dododex ✓) requires factor=1.0.
  const ASA_AFFINITY_FACTOR = 1.0;
  let totalAffinity;
  if (asaOverride) {
    // ASA_TAMING_AFFINITY entries are calibrated from Dododex ASA — no factor needed.
    totalAffinity = (asaOverride.a0 + asaOverride.aL * level) / tamingMultiplier;
  } else if (asb && asb.a0 > 0) {
    totalAffinity = (asb.a0 + asb.aL * level) * ASA_AFFINITY_FACTOR / tamingMultiplier;
  } else {
    totalAffinity = (dino.baseTamingAffinity + dino.affinityPerLevel * level) / tamingMultiplier;
  }

  // Sanguine Elixir: +30% taming affinity per item → fewer items needed
  const effectiveAffinity = sanguineElixir ? affinityPerItem * 1.3 : affinityPerItem;
  const foodNeeded = Math.max(1, Math.ceil(totalAffinity / effectiveAffinity));

  // --- Taming time ---
  const foodRate = (asb && asb.fr > 0) ? asb.fr : dino.foodDrainBase;
  const foodConsumptionMult = (asb && asb.fm > 0) ? asb.fm : 150;
  const foodDrainPerSec = Math.max(foodRate * foodConsumptionMult, 0.05);
  const foodPerItem = foodData.foodPerItem || 50;
  const secondsPerFood = foodPerItem / foodDrainPerSec;
  const totalTimeSeconds = Math.ceil(foodNeeded * secondsPerFood);

  // --- Starve time = time from full food until the creature is hungry enough to eat its first item ---
  // Formula: (maxFood - foodPerItem) / (drain × tamingMult)
  // The creature eats when its food drops below (maxFood - foodPerItem).
  // This is food-type dependent via foodPerItem:
  //   - kibble (foodPerItem ≈ 79.98): creature needs to drop more → slightly shorter wait
  //   - meat  (foodPerItem ≈ 50):    creature eats sooner (lower threshold) → slightly longer wait
  // At x2 the creature's food drains 2× faster, so starve is halved.
  const maxFood = getMaxFood(dino, foodRate);
  // Starve timer = total taming duration for the selected food (matches Dododex display)
  const starveTimeSeconds = totalTimeSeconds;

  // --- Torpor ---
  // Per-creature ASA torpor drain values (torpor/sec), calibrated from Dododex at L150 x1.
  // Confirmed: Rex=2.5/s (timer 1h42m38s), Trike=1.035/s (timer 40m00s), Raptor=1.035/s (timer 28m48s).
  // All others estimated by size/category; fallback = depletion * 4.5.
  const ASA_TORPOR_DRAIN = {
    // ── Apex / Mega ──────────────────────────────────────────────────────────
    'Giganotosaurus': 414.05, // Dododex ASA L150 ✓ (rapid drain, requires Bio Toxin)
    'Carcharodontosaurus': 5.0,
    'Brontosaurus': 1.0351,  // Dododex ASA L150 ✓
    'Mosasaurus': 44.165,    // Dododex ASA L150 ✓
    'Plesiosaur': 7.361,     // Dododex ASA L150 ✓
    'Quetzalcoatlus': 11.731, 'Quetzal': 11.731,  // Dododex ASA L150 ✓
    'Paraceratherium': 3.114, // Dododex ASA L150 ✓
    'Rex': 2.5,         // Dododex confirmed: 15407 / 2.5 = 6163s ≈ 1h42m38s ✓
    'Spinosaurus': 7.36, 'Spino': 7.36,  // Dododex confirmed: 8449 / 7.36 = 1147s ≈ 19m07s ✓
    'Therizinosaurus': 9.776, 'Therizinosaur': 9.776,  // Dododex ASA L150 ✓
    'Yutyrannus': 2.502,     // Dododex ASA L150 ✓
    'Megatherium': 2.2,
    'Allosaurus': 2.760,     // Dododex ASA L150 ✓
    'Megalosaurus': 1.0351,  // Dododex ASA L150 ✓
    'Diplodocus': 2.5878,    // Dododex ASA L150 ✓
    'Titanosaur': 10.0,

    // ── Large / Heavily armored ───────────────────────────────────────────────
    'Ankylosaurus': 1.035,  // Dododex confirmed: 4175 / 1.035 = 4034s ≈ 1h07m ✓
    'Doedicurus': 2.59,    // Dododex confirmed: 7952 / 2.59 = 3070s ≈ 51m10s ✓
    'Mammoth': 1.0351, 'Woolly Mammoth': 1.0351,  // Dododex ASA L150 ✓
    'Argentavis': 1.035,   // Dododex confirmed: 5964 / 1.035 = 5762s ≈ 1h36m ✓
    'Dire Bear': 3.106,  // Dododex ASA confirmed
    'Daeodon': 6.213,  // Dododex ASA confirmed
    'Kentrosaurus': 1.0351,  // Dododex ASA L150 ✓
    'Stegosaurus': 1.035, 'Stego': 1.035,  // Dododex confirmed: 4970 / 1.035 = 4802s ≈ 1h20m ✓
    'Baryonyx': 1.0351,      // Dododex ASA L150 ✓
    'Sarcosuchus': 1.0351, 'Sarco': 1.0351,  // Dododex ASA L150 ✓
    'Kaprosuchus': 1.0351,   // Dododex ASA L150 ✓
    'Thylacoleo': 6.383, 'Thylacosmilus': 6.383,  // Dododex ASA confirmed
    'Carnotaurus': 1.0351,   // Dododex ASA L150 ✓
    'Direwolf': 1.7252,      // Dododex ASA L150 ✓
    'Megalodon': 1.0351,     // Dododex ASA L150 ✓
    'Woolly Rhino': 3.1054,  // Dododex ASA L150 ✓
    'Castoroides': 5.666,  // Dododex ASA confirmed
    'Carbonemys': 1.0351,    // Dododex ASA L150 ✓

    // ── Medium ───────────────────────────────────────────────────────────────
    'Triceratops': 1.035, // Dododex confirmed: 2485 / 1.035 = 2401s ≈ 40m00s ✓
    'Raptor': 1.035,      // Dododex confirmed: 1789 / 1.035 = 1729s ≈ 28m48s ✓
    'Sabertooth': 1.035, 'Sabertooth Salmon': 1.035,  // Dododex ASA confirmed
    'Terror Bird': 7.766,  // Dododex ASA confirmed
    'Deinonychus': 1.0,
    'Purlovia': 1.035,  // Dododex ASA confirmed
    'Dimetrodon': 1.1,
    'Moschops': 1.0,
    'Procoptodon': 1.0,
    'Morellatops': 1.0351,   // Dododex ASA L150 ✓
    'Gallimimus': 4.13,    // Dododex confirmed: 1192.8 / 4.13 = 289s ≈ 4m49s ✓
    'Megaloceros': 1.0058,   // Dododex ASA L150 ✓
    'Beelzebufo': 2.301,  // Dododex ASA confirmed
    'Thorny Dragon': 0.9,
    'Iguanodon': 1.0351,     // Dododex ASA L150 ✓
    'Pachycephalosaurus': 0.8, 'Pachy': 0.8,
    'Tapejara': 1.0351,      // Dododex ASA L150 ✓
    'Maewing': 1.0,
    'Pulmonoscorpius': 1.035,  // Dododex ASA confirmed
    'Araneo': 0.8,
    'Arthropluera': 1.0,
    'Mantis': 1.2,

    // ── Small / Flyers ────────────────────────────────────────────────────────
    'Parasaur': 1.0351,      // Dododex ASA L150 ✓
    'Pteranodon': 1.0351,    // Dododex ASA L150 ✓
    'Dimorphodon': 0.5,
    'Diplocaulus': 0.6,
    'Ichthyornis': 0.6,
    'Pelagornis': 0.7,
    'Kairuku': 0.6,
    'Dilophosaur': 1.035,  // Dododex confirmed: 745.5 / 1.035 = 720s ≈ 12m00s ✓
    'Phiomia': 1.035,  // Dododex ASA confirmed
    'Lymantria': 0.6,
    'Ovis': 0.6,
    'Equus': 1.035,  // Dododex ASA confirmed
    'Vulture': 0.5,
    'Anglerfish': 1.0,
    'Dodo': 0.3,
    'Lystrosaurus': 0.3,
    'Compy': 0.3, 'Compsognathus': 0.3,
    'Mesopithecus': 0.4,
    'Archaeopteryx': 0.4,
    'Jerboa': 0.3,
    'Pegomastax': 0.4,
    'Microraptor': 0.4,
    'Sinomacrops': 0.4,
    'Otter': 0.5,

    // ── Tek / Special ────────────────────────────────────────────────────────
    'Managarmr': 1.0351,     // Dododex ASA L150 ✓
    'Snow Owl': 1.0351,      // Dododex ASA L150 ✓
    'Velonasaur': 1.2,
    'Gasbags': 1.0,
    'Gacha': 1.8,
    'Griffin': 7.361, 'Royal Griffin': 7.361,  // Dododex ASA L150 ✓
    'Tropeognathus': 1.2,
    'Shadowmane': 2.0,
    'Rock Drake': 1.5,
    'Ravager': 1.0,
    'Basilisk': 2.0,
    'Andrewsarchus': 1.8,
    'Amargasaurus': 3.0,
    'Dinopithecus': 1.2,
    'Desmodus': 1.2,
    'Fjordhawk': 0.7,
    'Astrodelphis': 1.0,
    'Bloodstalker': 2.0,
    // ── Tek variants ─────────────────────────────────────────────────────────
    'Tek Rex': 2.5,
    'Tek Raptor': 1.035,
    'Tek Quetzal': 11.731,   // same as Quetzal ✓
    'Tek Stego': 1.035,
    'Tek Parasaur': 1.0351,  // Dododex ASA L150 ✓
    // ── New / Uncatalogued creatures ─────────────────────────────────────────
    'Karkinos': 2.0,
    'Dunkleosteus': 3.450,   // Dododex ASA L150 ✓
    'Megalania': 1.8,
    'Ceratosaurus': 1.8,
    'Shastasaurus': 3.5,
    'Rock Elemental': 3.0,
    'Deinosuchus': 2.0,
    'Fasolasuchus': 2.0,
    'Yi Ling': 2.0,
    'Archelon': 1.8,
    'Gigantoraptor': 1.8,
    'Pachyrhinosaurus': 1.2,
    'Hyaenodon': 0.5,
    'Fenrir': 2.5,
    // ── DLC / custom creatures (old torpor format, estimated drain) ──────────
    'Cryolophosaurus': 2.0,   // ~Rex tier, baseHealth 1100
    'Xiphactinus': 2.5,       // large aquatic, baseHealth 1800
    'Maeguana': 1.5,          // medium, baseHealth 600
    'Grand Tortugar': 2.0,    // large, baseHealth 4000
    'Bison': 1.035,           // herbivore, baseHealth 800
    'Megaraptor': 1.5,        // medium carnivore, baseHealth 1000
  };

  // Support both old format (torpor: number) and new format (torpor: { base, perLevel, depletion })
  const torporObj = (dino.torpor && typeof dino.torpor === 'object')
    ? dino.torpor
    : { base: dino.torpor || 500, perLevel: (dino.torpor || 500) * 0.06, depletion: 0.3 };
  // ARK uses (level - 1) wild level-ups for torpor: verified Rex 1550+93×149=15407 ✓, Trike 250+15×149=2485 ✓
  const maxTorpor = torporObj.base + torporObj.perLevel * Math.max(0, level - 1);
  // Look up confirmed ASA drain; fallback = depletion * 4.5 for unknown creatures
  const torporDrainPerSec = ASA_TORPOR_DRAIN[dino.name] ?? (torporObj.depletion * 4.5);

  let torporDrainCategory = 'Low';
  if (torporDrainPerSec >= 4.0) torporDrainCategory = 'Very High';
  else if (torporDrainPerSec >= 2.0) torporDrainCategory = 'High';
  else if (torporDrainPerSec >= 1.2) torporDrainCategory = 'Medium';

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
    sanguineElixir,
  };
}

// ── Knockout weapon data ─────────────────────────────────────────────────────
// baseDamage / baseTorpor at 100% weapon quality, primitive grade.
// Torpor from tranq arrow = damage × 2. Headshot = 3× damage & torpor for most creatures.
const WW = (name, size = 40) => `https://ark.wiki.gg/images/thumb/${name}.png/${size}px-${name}.png`;
export const WEAPONS = [
  { key: 'slingshot',      name: 'Fronde',       ammo: 'Pierre',          img: WW('Slingshot'),        ammoImg: WW('Stone', 28),                        baseDamage: 14,  baseTorpor: 7.5,  headMult: 3 },
  { key: 'bow',            name: 'Arc',          ammo: 'Flèche Tranq',    img: WW('Bow'),              ammoImg: WW('Tranq_Arrow', 28),           baseDamage: 20,  baseTorpor: 40,   headMult: 3 },
  { key: 'crossbow',       name: 'Arbalète',     ammo: 'Flèche Tranq',    img: WW('Crossbow'),         ammoImg: WW('Tranq_Arrow', 28),           baseDamage: 35,  baseTorpor: 70,   headMult: 3 },
  { key: 'compound_bow',   name: 'Arc Compound', ammo: 'Flèche Tranq',    img: WW('Compound_Bow'),     ammoImg: WW('Tranq_Arrow', 28),           baseDamage: 27,  baseTorpor: 54,   headMult: 3 },
  { key: 'fab_crossbow',   name: 'Arbalète Fab.', ammo: 'Flèche Tranq',    img: WW('Fabricated_Crossbow'), ammoImg: WW('Tranq_Arrow', 28),               baseDamage: 70,  baseTorpor: 140,  headMult: 3 },
  { key: 'longneck_dart',  name: 'Longneck',     ammo: 'Dart Tranq',      img: WW('Longneck_Rifle'),   ammoImg: WW('Tranquilizer_Dart', 28),            baseDamage: 26,  baseTorpor: 40,   headMult: 3 },
  { key: 'longneck_shock', name: 'Longneck',     ammo: 'Dart Électrique', img: WW('Longneck_Rifle'),   ammoImg: WW('Shocking_Tranquilizer_Dart', 28),   baseDamage: 26,  baseTorpor: 221,  headMult: 3 },
  { key: 'sniper_shock',   name: 'Sniper Fab.',  ammo: 'Dart Électrique', img: WW('Fabricated_Sniper_Rifle'), ammoImg: WW('Shocking_Tranquilizer_Dart', 28), baseDamage: 97, baseTorpor: 826, headMult: 3 },
  { key: 'harpoon',        name: 'Harpoon',      ammo: 'Bolt Tranq',      img: WW('Harpoon_Launcher'), ammoImg: WW('Tranq_Spear_Bolt', 28),             baseDamage: 105, baseTorpor: 300,  headMult: 3 },
  { key: 'ballista',       name: 'Balliste',     ammo: 'Bolt Tranq',      img: WW('Ballista_Turret'),  ammoImg: WW('Spear_Bolt', 28),            baseDamage: 75,  baseTorpor: 2000, headMult: 1 },
];

/**
 * Calculate shots to KO and kill risk for each weapon.
 * @param {Object} dino  - dinosaur object with torpor + baseHealth
 * @param {number} level - wild level
 * @param {number} qualityPct - weapon damage % (100 = primitive, 200 = apprentice…)
 */
export function calculateKnockout(dino, level, qualityPct = 100) {
  const maxTorpor = dino.torpor.base + dino.torpor.perLevel * Math.max(0, level - 1);
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
