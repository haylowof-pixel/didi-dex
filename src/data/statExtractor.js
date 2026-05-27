import asbValues from '../../asb-values.json';

export const STORAGE_KEY = 'overseer-stat-extractor-library-v2';
export const SETTINGS_KEY = 'overseer-stat-extractor-settings';
export const RAISING_TIMERS_KEY = 'overseer-stat-extractor-raising-timers';

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
  breedingMutationLimit: 40,
  breedingOnlyClean: false,
  breedingAllowSameParents: false,
  breedingWeights: {},
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

function getColorById(id) {
  const index = Number(id);
  if (!Number.isFinite(index)) return null;
  const palette = getColorPalette();
  return palette.find(c => c.id === index)?.name || palette[index]?.name || null;
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

export function createCreatureEntry({ name, species, sex, mode, values, result, notes, mutations, colors, serverName, owner, tribe, arkId, parents, imported }) {
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
    owner: owner || '',
    tribe: tribe || '',
    arkId: arkId || '',
    imported: imported || null,
    parents: { motherId: '', fatherId: '', motherName: '', fatherName: '', ...parents },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function updateCreatureEntry(existing, patch = {}) {
  return {
    ...existing,
    ...patch,
    mutations: { ...(existing.mutations || {}), ...(patch.mutations || {}) },
    parents: { ...(existing.parents || {}), ...(patch.parents || {}) },
    updatedAt: new Date().toISOString(),
  };
}

function speciesFromBlueprint(blueprintPath) {
  if (!blueprintPath) return '';
  const normalizedPath = String(blueprintPath).toLowerCase();
  const match = (asbValues.species || []).find(species =>
    species?.blueprintPath && normalizedPath.includes(String(species.blueprintPath).toLowerCase().split('.').pop())
  );
  return match?.name || '';
}

function normalizeSex(value, flags = 0) {
  const raw = String(value ?? '').toLowerCase();
  if (raw === 'female' || raw === 'f' || raw === 'w' || raw === '♀' || raw === '1') return 'female';
  if (raw === 'male' || raw === 'm' || raw === '♂' || raw === '2') return 'male';
  if (raw === 'neutered' || (Number(flags) & 1) !== 0) return 'neutered';
  return 'unknown';
}

function resultFromLevels(speciesName, wildLevels = [], domLevels = [], mode = 'tamed', options = {}) {
  const species = getSpeciesStats(speciesName);
  if (!species) return null;
  const rows = STAT_KEYS.map(stat => {
    const wild = Number(wildLevels[stat.asbIndex] ?? wildLevels[stat.key] ?? 0);
    const domestic = Number(domLevels[stat.asbIndex] ?? domLevels[stat.key] ?? 0);
    const raw = species.fullStatsRaw[stat.asbIndex];
    const expectedRaw = calculateStatValue(raw, stat, wild, domestic, { ...DEFAULT_SETTINGS, ...options, mode });
    const expected = Number.isFinite(expectedRaw) ? roundDisplayed(expectedRaw, stat.kind) : null;
    return {
      ...stat,
      input: expected ?? '',
      observed: expected,
      wild: Number.isFinite(wild) ? wild : 0,
      domestic: Number.isFinite(domestic) ? domestic : 0,
      points: Number.isFinite(wild) ? wild : 0,
      expected,
      delta: 0,
      rawDelta: 0,
      confidence: 100,
      score: 0,
      quality: qualityFor(Number.isFinite(wild) ? wild : 0, 0),
    };
  });
  const validRows = rows.filter(r => r.wild !== null);
  const breedingRows = validRows.filter(r => r.breedable);
  const topStats = [...breedingRows].sort((a, b) => b.wild - a.wild).slice(0, 4);
  const totalWild = validRows.reduce((sum, r) => sum + (r.wild || 0), 0);
  const totalDomestic = validRows.reduce((sum, r) => sum + (r.domestic || 0), 0);
  return {
    species,
    rows,
    topStats,
    totalWild,
    totalDomestic,
    confidence: 100,
    levelRead: totalWild + totalDomestic + 1,
    breedingScore: Math.round(topStats.reduce((sum, r) => sum + r.wild, 0) / Math.max(topStats.length, 1)),
    settings: { ...DEFAULT_SETTINGS, ...options, mode },
  };
}

function valuesFromLevels(speciesName, wildLevels = [], domLevels = [], mode = 'tamed', options = {}) {
  const result = resultFromLevels(speciesName, wildLevels, domLevels, mode, options);
  return Object.fromEntries((result?.rows || []).map(row => [row.key, row.expected ?? '']));
}

function colorsFromIds(species, ids = []) {
  const colors = {};
  const regions = getSpeciesColorRegions(species);
  for (let index = 0; index < 6; index += 1) {
    const colorName = getColorById(ids[index]);
    if (regions[index]?.enabled && colorName) colors[index] = colorName;
  }
  return normalizeCreatureColors(species, colors);
}

function exportGunValues(stats = []) {
  return Object.fromEntries(STAT_KEYS.map(stat => [stat.key, stats[stat.asbIndex]?.Value ?? stats[stat.asbIndex]?.value ?? '']));
}

function exportGunColors(species, colorSetIndices = []) {
  return colorsFromIds(species, colorSetIndices);
}

function entryFromExportGun(data) {
  const species = data.SpeciesName
    || data.speciesName
    || data.species
    || speciesFromBlueprint(data.BlueprintPath || data.blueprintPath || data.speciesBlueprint || data.dinoClass);
  if (!species) throw new Error('Import ASB invalide: espece manquante.');
  const stats = Array.isArray(data.Stats) ? data.Stats : [];
  const wildLevels = data.levelsWild || data.LevelsWild || data.wildLevels || [];
  const domLevels = data.levelsDom || data.LevelsDom || data.domLevels || [];
  const hasLevels = Array.isArray(wildLevels) || Object.keys(wildLevels || {}).length;
  const mode = (data.BabyAge || data.babyAge || data.isBred) > 0 ? 'bred' : 'tamed';
  const values = hasLevels
    ? valuesFromLevels(species, wildLevels, domLevels, mode, DEFAULT_SETTINGS)
    : exportGunValues(stats);
  const result = estimateWildPoints(species, values, {
    ...DEFAULT_SETTINGS,
    mode,
    tamingEffectiveness: data.TameEffectiveness != null ? Number(data.TameEffectiveness) * 100 : (data.tameEffectiveness != null ? Number(data.tameEffectiveness) * 100 : 100),
    imprintBonus: data.DinoImprintingQuality != null ? Number(data.DinoImprintingQuality) * 100 : (data.imprintingBonus != null ? Number(data.imprintingBonus) * 100 : 0),
    level: data.BaseCharacterLevel || data.level || '',
  });
  const sex = data.Neutered || data.neutered ? 'neutered' : (data.sex ? normalizeSex(data.sex) : (data.IsFemale || data.isFemale ? 'female' : 'male'));
  const colors = exportGunColors(species, data.ColorSetIndices || data.colorSetIndices || data.colors || []);
  const arkId = data.arkId || [data.DinoID1, data.DinoID2].filter(Boolean).join(':');
  const ancestry = data.Ancestry || data.ancestry || {};

  return createCreatureEntry({
    name: data.DinoName || data.name,
    species,
    sex,
    mode,
    values,
    result,
    colors,
    mutations: {
      maternal: data.RandomMutationsFemale ?? data.mutationsMaternal,
      paternal: data.RandomMutationsMale ?? data.mutationsPaternal,
    },
    owner: data.OwningPlayerName || data.TamerString || data.owner,
    tribe: data.TribeName || data.tribe,
    arkId,
    parents: {
      motherName: ancestry.FemaleName || '',
      fatherName: ancestry.MaleName || '',
      motherArkId: [ancestry.FemaleDinoId1, ancestry.FemaleDinoId2].filter(Boolean).join(':'),
      fatherArkId: [ancestry.MaleDinoId1, ancestry.MaleDinoId2].filter(Boolean).join(':'),
    },
    imported: {
      source: 'ASB export gun',
      importedAt: new Date().toISOString(),
      babyAge: data.BabyAge || data.babyAge || 0,
      nextAllowedMatingTimeDuration: data.NextAllowedMatingTimeDuration || data.nextAllowedMatingTimeDuration || 0,
      mutagenApplied: Boolean(data.MutagenApplied || data.mutagenApplied),
      traits: data.Traits || data.traits || [],
    },
    serverName: data.ServerName || data.serverName || '',
  });
}

export function importAsbJson(text, current = []) {
  const parsed = JSON.parse(text);
  const payloads = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.creatures) ? parsed.creatures : [parsed]);
  const imported = payloads.map(entryFromExportGun);
  const knownArkIds = new Set(current.map(c => c.arkId).filter(Boolean));
  return [
    ...imported.filter(c => !c.arkId || !knownArkIds.has(c.arkId)),
    ...current,
  ];
}

function entryFromAsbCreature(creature, collection = {}) {
  const species = speciesFromBlueprint(creature.speciesBlueprint) || creature.SpeciesName || creature.species || creature.nameSpecies;
  if (!species) return null;
  const mode = creature.isBred ? 'bred' : (creature.tamingEff === -3 ? 'wild' : 'tamed');
  const options = {
    mode,
    tamingEffectiveness: creature.tamingEff != null && creature.tamingEff >= 0 ? Number(creature.tamingEff) * 100 : 100,
    imprintBonus: creature.imprintingBonus != null ? Number(creature.imprintingBonus) * 100 : 0,
    maxWild: collection.maxWildLevel || DEFAULT_SETTINGS.maxWild,
    maxDomestic: collection.maxDomLevel || DEFAULT_SETTINGS.maxDomestic,
  };
  const result = resultFromLevels(species, creature.levelsWild || [], creature.levelsDom || [], mode, options);
  if (!result) return null;
  const values = creature.valuesCurrent
    ? Object.fromEntries(STAT_KEYS.map(stat => [stat.key, creature.valuesCurrent[stat.asbIndex] ?? '']))
    : valuesFromLevels(species, creature.levelsWild || [], creature.levelsDom || [], mode, options);

  return createCreatureEntry({
    name: creature.name,
    species,
    sex: normalizeSex(creature.sex, creature.flags),
    mode,
    values,
    result,
    notes: creature.note,
    colors: colorsFromIds(species, creature.colors || []),
    mutations: {
      maternal: creature.mutationsMaternal,
      paternal: creature.mutationsPaternal,
    },
    owner: creature.owner,
    tribe: creature.tribe,
    arkId: creature.ArkId ? String(creature.ArkId) : '',
    serverName: creature.server,
    parents: {
      motherGuid: creature.motherGuid || '',
      fatherGuid: creature.fatherGuid || '',
      motherName: creature.motherName || '',
      fatherName: creature.fatherName || '',
    },
    imported: {
      source: 'ASB library',
      asbGuid: creature.guid || '',
      status: creature.status,
      tags: creature.tags || [],
      traits: creature.traits || [],
      cooldownUntil: creature.cooldownUntil || null,
      growingUntil: creature.growingUntil || null,
      importedAt: new Date().toISOString(),
    },
  });
}

function linkImportedParents(entries) {
  const byGuid = new Map(entries.map(entry => [entry.imported?.asbGuid, entry]).filter(([guid]) => guid));
  return entries.map(entry => ({
    ...entry,
    parents: {
      ...(entry.parents || {}),
      motherId: byGuid.get(entry.parents?.motherGuid)?.id || entry.parents?.motherId || '',
      fatherId: byGuid.get(entry.parents?.fatherGuid)?.id || entry.parents?.fatherId || '',
    },
  }));
}

function importAsbLibraryObject(parsed, current = []) {
  const creatures = Array.isArray(parsed?.creatures) ? parsed.creatures : [];
  const entries = linkImportedParents(creatures.map(c => entryFromAsbCreature(c, parsed)).filter(Boolean));
  const known = new Set(current.map(c => c.imported?.asbGuid || c.arkId || c.id).filter(Boolean));
  const incoming = entries.filter(c => {
    const key = c.imported?.asbGuid || c.arkId || c.id;
    return !key || !known.has(key);
  });
  return [...incoming, ...current];
}

function importAsbTable(text, current = []) {
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const entries = [];
  for (const line of lines) {
    const cols = line.split('\t');
    if (cols.length < 51) continue;
    const species = speciesFromBlueprint(cols[1]) || cols[0];
    if (!getSpeciesStats(species)) continue;
    const mode = /^true|1|yes$/i.test(cols[10]) ? 'bred' : 'tamed';
    const wildStart = 17;
    const domStart = wildStart + 12;
    const colorStart = domStart + 12;
    const wildLevels = cols.slice(wildStart, wildStart + 12).map(v => Number(v) || 0);
    const domLevels = cols.slice(domStart, domStart + 12).map(v => Number(v) || 0);
    const options = {
      mode,
      tamingEffectiveness: Number(String(cols[13]).replace('%', '').replace(',', '.')) || 100,
      imprintBonus: Number(String(cols[14]).replace('%', '').replace(',', '.')) || 0,
    };
    const result = resultFromLevels(species, wildLevels, domLevels, mode, options);
    if (!result) continue;
    entries.push(createCreatureEntry({
      name: cols[2],
      species,
      sex: normalizeSex(cols[8]),
      mode,
      values: valuesFromLevels(species, wildLevels, domLevels, mode, options),
      result,
      owner: cols[3],
      tribe: cols[5],
      serverName: cols[6],
      notes: cols[7],
      mutations: { maternal: cols[15], paternal: cols[16] },
      colors: colorsFromIds(species, cols.slice(colorStart, colorStart + 6).map(v => Number(v) || 0)),
      imported: { source: 'ASB tab export', importedAt: new Date().toISOString() },
    }));
  }
  if (!entries.length) throw new Error('Aucune creature reconnue dans le tableau ASB.');
  return [...entries, ...current];
}

export function importAnyAsb(text, current = []) {
  const trimmed = String(text || '').trim();
  if (!trimmed) throw new Error('Import vide.');

  if (trimmed.includes('\t') && !trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    return importAsbTable(trimmed, current);
  }

  const parsed = JSON.parse(trimmed);
  if (parsed?.app === 'OVERSEER' || parsed?.type === 'stat-extractor-library') {
    return importLibraryJson(trimmed, current);
  }
  if (parsed?.FormatVersion && Array.isArray(parsed.creatures)) {
    return importAsbLibraryObject(parsed, current);
  }
  if (Array.isArray(parsed) && parsed.some(c => c?.levelsWild || c?.speciesBlueprint)) {
    return importAsbLibraryObject({ creatures: parsed }, current);
  }
  if (Array.isArray(parsed?.creatures) && parsed.creatures.some(c => c?.levelsWild || c?.speciesBlueprint)) {
    return importAsbLibraryObject(parsed, current);
  }
  if (parsed?.levelsWild || parsed?.speciesBlueprint) {
    return importAsbLibraryObject({ creatures: [parsed] }, current);
  }
  return importAsbJson(trimmed, current);
}

export function extractAsbRaisingTimers(text, library = []) {
  let parsed;
  try {
    parsed = JSON.parse(String(text || '').trim());
  } catch {
    return [];
  }
  const incubation = Array.isArray(parsed?.incubationListEntries) ? parsed.incubationListEntries : [];
  const growth = Array.isArray(parsed?.timerListEntries) ? parsed.timerListEntries : [];
  const byGuid = new Map(library.map(c => [c.imported?.asbGuid, c]).filter(([guid]) => guid));

  const incubationTimers = incubation.map(timer => {
    const mother = byGuid.get(timer.motherGuid);
    const father = byGuid.get(timer.fatherGuid);
    return {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      species: mother?.species || father?.species || 'Unknown',
      kind: timer.kind || 'Egg',
      motherId: mother?.id || '',
      fatherId: father?.id || '',
      motherName: mother?.name || 'Mother',
      fatherName: father?.name || 'Father',
      duration: 0,
      endAt: timer.incubationEnd ? new Date(timer.incubationEnd).getTime() : Date.now(),
      running: Boolean(timer.timerIsRunning),
      imported: { source: 'ASB incubation timer' },
      createdAt: new Date().toISOString(),
    };
  });

  const growthTimers = growth.map(timer => {
    const creature = byGuid.get(timer.CreatureGuid || timer.creatureGuid || timer.guid);
    return {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      species: creature?.species || timer.species || 'Unknown',
      kind: 'Growing',
      motherId: '',
      fatherId: '',
      motherName: creature?.name || timer.name || 'Baby',
      fatherName: '',
      duration: 0,
      endAt: timer.growingUntil ? new Date(timer.growingUntil).getTime() : Date.now(),
      running: !timer.growingPaused,
      imported: { source: 'ASB growth timer' },
      createdAt: new Date().toISOString(),
    };
  });

  return [...incubationTimers, ...growthTimers].filter(timer => Number.isFinite(timer.endAt));
}

export function resolveParents(creature, library) {
  const parents = creature?.parents || {};
  const mother = library.find(c =>
    c.id === parents.motherId
    || (parents.motherArkId && c.arkId === parents.motherArkId)
    || (parents.motherName && c.name === parents.motherName && c.sex === 'female')
  ) || null;
  const father = library.find(c =>
    c.id === parents.fatherId
    || (parents.fatherArkId && c.arkId === parents.fatherArkId)
    || (parents.fatherName && c.name === parents.fatherName && c.sex === 'male')
  ) || null;
  return { mother, father };
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

export function filterLibrary(library, filters = {}) {
  const q = String(filters.search || '').trim().toLowerCase();
  return [...library].filter(creature => {
    if (filters.species && creature.species !== filters.species) return false;
    if (filters.sex && creature.sex !== filters.sex) return false;
    if (filters.owner && creature.owner !== filters.owner) return false;
    if (filters.tribe && creature.tribe !== filters.tribe) return false;
    if (filters.serverName && creature.serverName !== filters.serverName) return false;
    if (filters.status && creature.imported?.status !== filters.status) return false;
    if (filters.tag && !(creature.imported?.tags || []).includes(filters.tag)) return false;
    if (filters.duplicatesOnly && !creature.duplicateKey) return false;
    if (q) {
      const haystack = [
        creature.name, creature.species, creature.owner, creature.tribe, creature.serverName,
        creature.arkId, creature.notes, ...(creature.imported?.tags || []),
      ].join(' ').toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

export function annotateDuplicates(library) {
  const counts = new Map();
  for (const creature of library) {
    const key = creature.arkId || creature.imported?.asbGuid || `${creature.species}:${creature.name}`;
    if (!key) continue;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return library.map(creature => {
    const key = creature.arkId || creature.imported?.asbGuid || `${creature.species}:${creature.name}`;
    return counts.get(key) > 1 ? { ...creature, duplicateKey: key } : { ...creature, duplicateKey: '' };
  });
}

export function mergeDuplicateCreatures(library) {
  const byKey = new Map();
  const merged = [];
  for (const creature of library) {
    const key = creature.arkId || creature.imported?.asbGuid || '';
    if (!key) {
      merged.push(creature);
      continue;
    }
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, creature);
      merged.push(creature);
      continue;
    }
    const richer = new Date(creature.updatedAt || creature.createdAt || 0) > new Date(existing.updatedAt || existing.createdAt || 0)
      ? creature
      : existing;
    Object.assign(existing, {
      ...existing,
      ...richer,
      notes: [existing.notes, creature.notes].filter(Boolean).join('\n'),
      imported: { ...(existing.imported || {}), ...(creature.imported || {}) },
      updatedAt: new Date().toISOString(),
    });
  }
  return annotateDuplicates(merged);
}

export function buildPedigreeTree(creature, library, depth = 3, seen = new Set()) {
  if (!creature || depth < 0 || seen.has(creature.id)) return null;
  seen.add(creature.id);
  const { mother, father } = resolveParents(creature, library);
  return {
    creature,
    mother: mother ? buildPedigreeTree(mother, library, depth - 1, new Set(seen)) : null,
    father: father ? buildPedigreeTree(father, library, depth - 1, new Set(seen)) : null,
  };
}

export function buildBreedingPlan(library, species, options = {}) {
  const candidates = library.filter(c => c.species === species);
  const males = candidates.filter(c => c.sex === 'male');
  const females = candidates.filter(c => c.sex === 'female');
  const pairs = [];
  const weights = { hp: 1, stam: 1, oxygen: 0.35, food: 0.4, weight: 1, melee: 1.2, ...(options.weights || {}) };
  const mutationLimit = Number(options.mutationLimit ?? DEFAULT_SETTINGS.breedingMutationLimit);

  for (const male of males) {
    for (const female of females) {
      if (!options.allowSameParents && male.id === female.id) continue;
      const mutationLoad = (male.mutations?.maternal || 0) + (male.mutations?.paternal || 0) + (female.mutations?.maternal || 0) + (female.mutations?.paternal || 0);
      if (options.onlyClean && mutationLoad >= mutationLimit) continue;
      const inheritedStats = STAT_KEYS.filter(s => s.breedable).map(stat => {
        const malePoints = male.stats?.[stat.key]?.wild ?? 0;
        const femalePoints = female.stats?.[stat.key]?.wild ?? 0;
        const best = Math.max(malePoints, femalePoints);
        const source = malePoints === femalePoints ? 'both' : malePoints > femalePoints ? 'male' : 'female';
        return { ...stat, malePoints, femalePoints, best, source };
      });

      const bestTotal = inheritedStats.reduce((sum, stat) => sum + stat.best * (weights[stat.key] ?? 1), 0);
      const cleanBonus = Math.max(0, 40 - mutationLoad) * 0.4;
      const mutationPenalty = Math.max(0, mutationLoad - mutationLimit) * 1.5;
      const score = Math.round(bestTotal + cleanBonus + ((male.confidence || 0) + (female.confidence || 0)) / 20 - mutationPenalty);
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

export function createRaisingTimer(pair, speciesName) {
  const info = getSpeciesBreedingInfo(speciesName);
  if (!info || !pair) return null;
  const duration = info.incubationTime || info.gestationTime || 0;
  const kind = info.incubationTime ? 'Egg' : 'Gestation';
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    species: speciesName,
    kind,
    motherId: pair.female.id,
    fatherId: pair.male.id,
    motherName: pair.female.name,
    fatherName: pair.male.name,
    duration,
    endAt: Date.now() + duration * 1000,
    running: true,
    createdAt: new Date().toISOString(),
  };
}

export function loadRaisingTimers() {
  try {
    const parsed = JSON.parse(localStorage.getItem(RAISING_TIMERS_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveRaisingTimers(timers) {
  const next = Array.isArray(timers) ? timers : [];
  localStorage.setItem(RAISING_TIMERS_KEY, JSON.stringify(next));
  return next;
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
