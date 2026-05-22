import asbValues from '../../asb-values.json';

export const STORAGE_KEY = 'overseer-stat-extractor-library-v2';
export const SETTINGS_KEY = 'overseer-stat-extractor-settings';

export const STAT_KEYS = [
  { key: 'hp', label: 'Health', short: 'HP', asbIndex: 0, kind: 'flat', breedable: true },
  { key: 'stam', label: 'Stamina', short: 'STA', asbIndex: 1, kind: 'flat', breedable: true },
  { key: 'oxygen', label: 'Oxygen', short: 'OXY', asbIndex: 3, kind: 'flat', breedable: true },
  { key: 'food', label: 'Food', short: 'FOOD', asbIndex: 4, kind: 'flat', breedable: true },
  { key: 'weight', label: 'Weight', short: 'WGT', asbIndex: 7, kind: 'flat', breedable: true },
  { key: 'melee', label: 'Melee', short: 'DMG', asbIndex: 8, kind: 'percent', breedable: true },
  { key: 'speed', label: 'Speed', short: 'SPD', asbIndex: 9, kind: 'percent', breedable: false },
  { key: 'torpor', label: 'Torpor', short: 'TOR', asbIndex: 2, kind: 'flat', breedable: false },
];

export const MODE_LABELS = {
  wild: 'Wild',
  tamed: 'Tamed',
  bred: 'Bred',
};

const DEFAULT_SETTINGS = {
  mode: 'tamed',
  maxWild: 254,
  maxDomestic: 88,
  tamingEffectiveness: 100,
  imprintBonus: 0,
  level: '',
  serverName: '',
  includeSpeed: false,
  libraryLimit: 400,
};

const SPECIES_BY_NAME = new Map();
const NORMALIZED_SPECIES = new Map();

for (const species of asbValues.species || []) {
  if (!species?.name || !Array.isArray(species.fullStatsRaw)) continue;
  if (!SPECIES_BY_NAME.has(species.name)) SPECIES_BY_NAME.set(species.name, species);
  const normalized = normalizeName(species.name);
  if (!NORMALIZED_SPECIES.has(normalized)) NORMALIZED_SPECIES.set(normalized, species);
}

export function normalizeName(name) {
  return String(name || '')
    .replace(/^Tek /, '')
    .replace(/^R-/, '')
    .replace(/^X-/, '')
    .replace(/^Aberrant /, '')
    .replace(/^Skeletal /, '')
    .replace(/^Corrupted /, '')
    .trim();
}

export function loadSettings() {
  try {
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...DEFAULT_SETTINGS, ...settings }));
}

export function loadLibrary() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLibrary(library, limit = DEFAULT_SETTINGS.libraryLimit) {
  const next = Array.isArray(library) ? library.slice(0, limit) : [];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function getExtractorSpecies() {
  return Array.from(SPECIES_BY_NAME.keys()).sort((a, b) => a.localeCompare(b));
}

export function getSpeciesStats(name) {
  return SPECIES_BY_NAME.get(name) || NORMALIZED_SPECIES.get(normalizeName(name)) || null;
}

export function getStatKeys() {
  return STAT_KEYS;
}

export function getSpeciesBreedingInfo(speciesName) {
  const species = getSpeciesStats(speciesName);
  return species?.breeding || null;
}

export function getColorPalette() {
  return (asbValues.colorDefinitions || []).map(([name, rgba], index) => ({
    id: index + 1,
    name,
    rgba,
    hex: rgbaToHex(rgba),
  }));
}

export function rgbaToHex(rgba = [0, 0, 0]) {
  const [r = 0, g = 0, b = 0] = rgba;
  const toByte = (v) => Math.max(0, Math.min(255, Math.round(v * 255)));
  return `#${[toByte(r), toByte(g), toByte(b)].map(v => v.toString(16).padStart(2, '0')).join('')}`;
}

export function getColorByName(name) {
  return getColorPalette().find(c => c.name === name) || null;
}

export function getSpeciesColorRegions(speciesName) {
  const species = getSpeciesStats(speciesName);
  const regions = species?.colors || [];
  return Array.from({ length: 6 }, (_, index) => {
    const region = regions[index];
    const colors = Array.isArray(region?.colors) ? region.colors : [];
    return {
      index,
      enabled: Boolean(region && colors.length),
      name: region?.name && region.name !== 'Unknown' ? region.name : `Region ${index}`,
      colors,
      palette: colors.map(colorName => getColorByName(colorName)).filter(Boolean),
    };
  });
}

export function normalizeCreatureColors(speciesName, colors = {}) {
  const regions = getSpeciesColorRegions(speciesName);
  return regions.reduce((acc, region) => {
    const current = colors?.[region.index];
    const fallback = region.palette[0]?.name || '';
    acc[region.index] = region.enabled ? (current || fallback) : '';
    return acc;
  }, {});
}

export function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '-';
  const total = Math.round(seconds);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const mins = Math.floor((total % 3600) / 60);
  if (days) return `${days}j ${hours}h`;
  if (hours) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function roundDisplayed(value, kind) {
  const scaled = kind === 'percent' ? value * 100 : value;
  return Math.round(scaled * 10) / 10;
}

function normalizeInput(value, kind) {
  const input = Number(value);
  if (!Number.isFinite(input) || input <= 0) return null;
  return kind === 'percent' && input > 3 ? input / 100 : input;
}

function imprintMultiplier(stat, imprintBonus) {
  if (!stat.breedable) return 1;
  const imprint = Math.max(0, Math.min(100, Number(imprintBonus) || 0)) / 100;
  return 1 + imprint * 0.2;
}

export function calculateStatValue(raw, stat, wildPoints = 0, domesticPoints = 0, options = {}) {
  if (!raw) return null;
  const [base, incWild = 0, incDom = 0, tameAdd = 0, tameMult = 0] = raw;
  const mode = options.mode || 'wild';
  const te = Math.max(0, Math.min(100, Number(options.tamingEffectiveness) || 0)) / 100;
  const wildValue = base * (1 + wildPoints * incWild);

  if (mode === 'wild') return wildValue;

  const add = mode === 'bred' ? 0 : tameAdd * te;
  const mult = mode === 'bred' ? 0 : tameMult * te;
  const domesticated = (wildValue + add) * (1 + mult);
  const leveled = domesticated * (1 + domesticPoints * incDom);
  return leveled * imprintMultiplier(stat, options.imprintBonus);
}

function qualityFor(points, score) {
  if (points == null) return 'empty';
  if (score < 0.002) return points >= 50 ? 'mythic' : points >= 42 ? 'legendary' : points >= 32 ? 'strong' : points >= 22 ? 'ok' : 'low';
  if (score < 0.01) return 'uncertain';
  return 'conflict';
}

function extractionConfidence(delta, observed) {
  if (!Number.isFinite(delta) || !Number.isFinite(observed) || observed === 0) return 0;
  const pct = Math.abs(delta) / Math.abs(observed);
  return Math.max(0, Math.min(100, Math.round((1 - pct * 18) * 100)));
}

function extractStat(species, stat, value, options) {
  const raw = species.fullStatsRaw[stat.asbIndex];
  const observed = normalizeInput(value, stat.kind);
  if (!raw || observed === null) {
    return { ...stat, input: value || '', wild: null, domestic: null, expected: null, delta: null, confidence: 0, quality: 'empty' };
  }

  const maxWild = Math.max(1, Number(options.maxWild) || DEFAULT_SETTINGS.maxWild);
  const maxDomestic = options.mode === 'wild' ? 0 : Math.max(0, Number(options.maxDomestic) || DEFAULT_SETTINGS.maxDomestic);
  let best = null;

  for (let wild = 0; wild <= maxWild; wild += 1) {
    const domesticLimit = maxDomestic;
    for (let domestic = 0; domestic <= domesticLimit; domestic += 1) {
      const expectedRaw = calculateStatValue(raw, stat, wild, domestic, options);
      if (!Number.isFinite(expectedRaw)) continue;
      const delta = observed - expectedRaw;
      const relative = Math.abs(delta) / Math.max(Math.abs(observed), 1);
      const levelPenalty = options.level
        ? Math.abs((wild + domestic) - Number(options.level)) * 0.000002
        : 0;
      const score = relative + levelPenalty;
      if (!best || score < best.score) {
        best = { wild, domestic, expectedRaw, delta, score };
      }
    }
  }

  if (!best) return { ...stat, input: value || '', wild: null, domestic: null, expected: null, delta: null, confidence: 0, quality: 'empty' };

  const displayedObserved = roundDisplayed(observed, stat.kind);
  const displayedExpected = roundDisplayed(best.expectedRaw, stat.kind);
  const displayedDelta = Math.round((displayedObserved - displayedExpected) * 10) / 10;

  return {
    ...stat,
    input: value,
    observed: displayedObserved,
    wild: best.wild,
    domestic: best.domestic,
    points: best.wild,
    expected: displayedExpected,
    delta: displayedDelta,
    rawDelta: best.delta,
    confidence: extractionConfidence(best.delta, observed),
    score: best.score,
    quality: qualityFor(best.wild, best.score),
  };
}

export function estimateWildPoints(speciesName, statValues, options = {}) {
  const species = getSpeciesStats(speciesName);
  if (!species) return null;
  const merged = { ...DEFAULT_SETTINGS, ...options };

  const rows = STAT_KEYS.map(stat => extractStat(species, stat, statValues?.[stat.key], merged));
  const validRows = rows.filter(r => r.wild !== null);
  const breedingRows = validRows.filter(r => r.breedable);
  const topStats = breedingRows
    .sort((a, b) => b.wild - a.wild)
    .slice(0, 4);
  const totalWild = validRows.reduce((sum, r) => sum + (r.wild || 0), 0);
  const totalDomestic = validRows.reduce((sum, r) => sum + (r.domestic || 0), 0);
  const confidence = validRows.length
    ? Math.round(validRows.reduce((sum, r) => sum + r.confidence, 0) / validRows.length)
    : 0;

  return {
    species,
    rows,
    topStats,
    totalWild,
    totalDomestic,
    confidence,
    levelRead: totalWild + totalDomestic + 1,
    breedingScore: Math.round(topStats.reduce((sum, r) => sum + r.wild, 0) / Math.max(topStats.length, 1)),
    settings: merged,
  };
}

export function createCreatureEntry({ name, species, sex, mode, values, result, notes, mutations, colors, serverName }) {
  const statMap = {};
  for (const row of result?.rows || []) {
    statMap[row.key] = {
      wild: row.wild,
      domestic: row.domestic,
      observed: row.observed,
      expected: row.expected,
      confidence: row.confidence,
      quality: row.quality,
    };
  }

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: String(name || '').trim() || species,
    species,
    sex: sex || 'unknown',
    mode,
    values: { ...values },
    stats: statMap,
    totalWild: result?.totalWild || 0,
    totalDomestic: result?.totalDomestic || 0,
    levelRead: result?.levelRead || 1,
    breedingScore: result?.breedingScore || 0,
    confidence: result?.confidence || 0,
    topStats: (result?.topStats || []).map(s => ({ key: s.key, label: s.label, wild: s.wild })),
    mutations: {
      maternal: Math.max(0, Number(mutations?.maternal) || 0),
      paternal: Math.max(0, Number(mutations?.paternal) || 0),
    },
    colors: normalizeCreatureColors(species, colors),
    notes: notes || '',
    serverName: serverName || '',
    parents: { motherId: '', fatherId: '' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function rankCreatures(library, species, statKey = 'breedingScore') {
  return [...library]
    .filter(c => !species || c.species === species)
    .sort((a, b) => {
      const av = statKey === 'breedingScore' ? a.breedingScore : (a.stats?.[statKey]?.wild ?? -1);
      const bv = statKey === 'breedingScore' ? b.breedingScore : (b.stats?.[statKey]?.wild ?? -1);
      return bv - av;
    });
}

export function buildBreedingPlan(library, species) {
  const candidates = library.filter(c => c.species === species);
  const males = candidates.filter(c => c.sex === 'male');
  const females = candidates.filter(c => c.sex === 'female');
  const pairs = [];

  for (const male of males) {
    for (const female of females) {
      const inheritedStats = STAT_KEYS.filter(s => s.breedable).map(stat => {
        const malePoints = male.stats?.[stat.key]?.wild ?? 0;
        const femalePoints = female.stats?.[stat.key]?.wild ?? 0;
        const best = Math.max(malePoints, femalePoints);
        const source = malePoints === femalePoints ? 'both' : malePoints > femalePoints ? 'male' : 'female';
        return { ...stat, malePoints, femalePoints, best, source };
      });

      const bestTotal = inheritedStats.reduce((sum, stat) => sum + stat.best, 0);
      const mutationLoad = (male.mutations?.maternal || 0) + (male.mutations?.paternal || 0) + (female.mutations?.maternal || 0) + (female.mutations?.paternal || 0);
      const cleanBonus = Math.max(0, 40 - mutationLoad) * 0.4;
      const score = Math.round(bestTotal + cleanBonus + ((male.confidence || 0) + (female.confidence || 0)) / 20);
      const highStatChance = inheritedStats.reduce((chance, stat) => chance * (stat.source === 'both' ? 1 : 0.55), 1);

      pairs.push({
        id: `${male.id}:${female.id}`,
        male,
        female,
        inheritedStats,
        bestTotal,
        mutationLoad,
        score,
        highStatChance: Math.round(highStatChance * 1000) / 10,
      });
    }
  }

  return pairs.sort((a, b) => b.score - a.score).slice(0, 24);
}

export function exportLibrary(library) {
  return JSON.stringify({
    app: 'OVERSEER',
    type: 'stat-extractor-library',
    version: 2,
    exportedAt: new Date().toISOString(),
    creatures: library,
  }, null, 2);
}

export function importLibraryJson(text, current = []) {
  const parsed = JSON.parse(text);
  const incoming = Array.isArray(parsed) ? parsed : parsed.creatures;
  if (!Array.isArray(incoming)) throw new Error('Fichier invalide: aucune liste de creatures.');
  const known = new Set(current.map(c => c.id));
  return [...incoming.filter(c => c?.id && !known.has(c.id)), ...current];
}
