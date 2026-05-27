import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { dinosaurs } from '../data/dinosaurs';
import {
  MODE_LABELS,
  STAT_KEYS,
  annotateDuplicates,
  buildBreedingPlan,
  buildPedigreeTree,
  createCreatureEntry,
  createRaisingTimer,
  estimateWildPoints,
  exportLibrary,
  extractAsbRaisingTimers,
  formatDuration,
  getColorByName,
  getColorPalette,
  getExtractorSpecies,
  getSpeciesBreedingInfo,
  getSpeciesColorRegions,
  filterLibrary,
  importAnyAsb,
  importLibraryJson,
  importAsbJson,
  loadLibrary,
  loadRaisingTimers,
  loadSettings,
  normalizeCreatureColors,
  rankCreatures,
  resolveParents,
  mergeDuplicateCreatures,
  saveLibrary,
  saveRaisingTimers,
  saveSettings,
} from '../data/statExtractor';
import CreatureModelViewer from './CreatureModelViewer';
import CreatureColorImageViewer from './CreatureColorImageViewer';
import {
  AlertIcon,
  CalculatorIcon,
  CheckIcon,
  ClipboardIcon,
  DnaIcon,
  InfoIcon,
  PlusIcon,
  ResetIcon,
  ShieldIcon,
  SparklesIcon,
  TimerIcon,
  ZapIcon,
} from './Icons';

const TABS = [
  { key: 'extract', label: 'Extract', Icon: CalculatorIcon },
  { key: 'appearance', label: '3D / Colors', Icon: SparklesIcon },
  { key: 'library', label: 'Library', Icon: ClipboardIcon },
  { key: 'planner', label: 'Breeding', Icon: DnaIcon },
  { key: 'pedigree', label: 'Pedigree', Icon: ShieldIcon },
];

function getTabFromHash() {
  const hash = window.location.hash.replace(/^#/, '');
  const [, section] = hash.split(':');
  if (hash === 'breeding') return 'planner';
  if (TABS.some(tab => tab.key === section)) return section;
  return 'extract';
}

const DEMO_PRESETS = {
  Rex: { hp: 9900, stam: 2100, oxygen: 525, food: 9000, weight: 850, melee: 442.5, speed: 100, torpor: 15500 },
  Argentavis: { hp: 3212, stam: 1800, oxygen: 720, food: 5400, weight: 780, melee: 381, speed: 100, torpor: 5400 },
  Maewing: { hp: 4900, stam: 1575, oxygen: 250, food: 6200, weight: 760, melee: 302, speed: 100, torpor: 5200 },
};

function slugSpecies(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function Field({ label, children, compact }) {
  return (
    <label className={`ase-field ${compact ? 'compact' : ''}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function StatPill({ value, label, tone = 'neutral' }) {
  return (
    <div className={`ase-pill ${tone}`}>
      <strong>{value ?? '-'}</strong>
      <span>{label}</span>
    </div>
  );
}

function BreedingInfo({ species }) {
  const info = getSpeciesBreedingInfo(species);
  if (!info) return null;
  return (
    <div className="ase-breeding-strip">
      <div><TimerIcon size={13} /><span>Incubation</span><strong>{formatDuration(info.incubationTime)}</strong></div>
      <div><TimerIcon size={13} /><span>Gestation</span><strong>{formatDuration(info.gestationTime)}</strong></div>
      <div><SparklesIcon size={13} /><span>Maturation</span><strong>{formatDuration(info.maturationTime)}</strong></div>
      <div><InfoIcon size={13} /><span>Temp egg</span><strong>{info.eggTempMin != null ? `${info.eggTempMin}-${info.eggTempMax}C` : '-'}</strong></div>
    </div>
  );
}

function StatInputCard({ stat, row, value, onChange }) {
  return (
    <div className={`ase-stat-card ${row?.quality || 'empty'}`}>
      <div className="ase-stat-top">
        <div>
          <span>{stat.short}</span>
          <strong>{stat.label}</strong>
        </div>
        <div className="ase-confidence">{row?.confidence || 0}%</div>
      </div>
      <input
        type="number"
        min="0"
        step={stat.kind === 'percent' ? '0.1' : '1'}
        value={value || ''}
        onChange={e => onChange(stat.key, e.target.value)}
        placeholder={stat.kind === 'percent' ? '100.0' : '0'}
      />
      <div className="ase-stat-metrics">
        <div><span>Wild</span><strong>{row?.wild ?? '-'}</strong></div>
        <div><span>Dom</span><strong>{row?.domestic ?? '-'}</strong></div>
        <div><span>Expected</span><strong>{row?.expected ?? '-'}</strong></div>
      </div>
      <div className="ase-stat-delta">
        Delta <strong>{row?.delta ?? '-'}</strong>
      </div>
    </div>
  );
}

function LibraryRow({ creature, active, onSelect, onRemove, onEdit }) {
  const top = creature.topStats?.slice(0, 3) || [];
  return (
    <div className={`ase-library-row ${active ? 'active' : ''}`} onClick={() => onSelect(creature.id)} role="button" tabIndex={0}>
      <div className="ase-library-main">
        <strong>{creature.name}</strong>
        <span>{creature.species} · L{creature.levelRead} · {creature.sex}{creature.owner ? ` · ${creature.owner}` : ''}</span>
      </div>
      <div className="ase-library-stats">
        {top.map(stat => <span key={stat.key}>{stat.label.slice(0, 3)} {stat.wild}</span>)}
      </div>
      <div className="ase-library-score">{creature.breedingScore}</div>
      <button className="ase-row-remove" onClick={e => { e.stopPropagation(); onEdit(creature); }}>edit</button>
      <button className="ase-row-remove" onClick={e => { e.stopPropagation(); onRemove(creature.id); }}>x</button>
    </div>
  );
}

function PlannerPair({ pair, onTimer }) {
  return (
    <div className="ase-pair-card">
      <div className="ase-pair-head">
        <div>
          <span>Score pair</span>
          <strong>{pair.score}</strong>
        </div>
        <div>
          <span>Best stat chance</span>
          <strong>{pair.highStatChance}%</strong>
        </div>
        <div>
          <span>Mut load</span>
          <strong>{pair.mutationLoad}</strong>
        </div>
      </div>
      <div className="ase-pair-parents">
        <span>M {pair.male.name}</span>
        <span>F {pair.female.name}</span>
      </div>
      <div className="ase-inherit-grid">
        {pair.inheritedStats.map(stat => (
          <div key={stat.key} className={stat.source}>
            <span>{stat.short}</span>
            <strong>{stat.best}</strong>
            <em>{stat.source}</em>
          </div>
        ))}
      </div>
      <button className="ase-pair-action" onClick={() => onTimer(pair)}>Create baby timer</button>
    </div>
  );
}

function RaisingTimerList({ timers, onRemove }) {
  if (!timers.length) return <div className="ase-empty">Aucun timer de bebe.</div>;
  return (
    <div className="ase-raising-list">
      {timers.map(timer => {
        const left = Math.max(0, Math.ceil((timer.endAt - Date.now()) / 1000));
        return (
          <div key={timer.id} className="ase-raising-row">
            <div>
              <strong>{timer.species} {timer.kind}</strong>
              <span>{timer.fatherName} x {timer.motherName}</span>
            </div>
            <em>{formatDuration(left)}</em>
            <button onClick={() => onRemove(timer.id)}>x</button>
          </div>
        );
      })}
    </div>
  );
}

function PedigreeNode({ node, depth = 0 }) {
  if (!node?.creature) return <div className="ase-node muted">n/a</div>;
  const creature = node.creature;
  return (
    <div className={`ase-pedigree-tree-node depth-${depth}`}>
      <div className="ase-node current">
        <strong>{creature.name}</strong>
        <span>{creature.species} · {creature.sex}</span>
        <em>L{creature.levelRead} · score {creature.breedingScore}</em>
      </div>
      {(node.mother || node.father) && (
        <div className="ase-pedigree-parents">
          <PedigreeNode node={node.mother} depth={depth + 1} />
          <PedigreeNode node={node.father} depth={depth + 1} />
        </div>
      )}
    </div>
  );
}

function ColorRegionEditor({ species, colors, onChange }) {
  const regions = useMemo(() => getSpeciesColorRegions(species), [species]);
  const allColors = useMemo(() => getColorPalette(), []);
  const normalized = useMemo(() => normalizeCreatureColors(species, colors), [species, colors]);

  return (
    <div className="ase-color-region-grid">
      {regions.map(region => {
        const selected = normalized[region.index] || '';
        const selectedColor = getColorByName(selected);
        return (
          <div key={region.index} className={`ase-color-region ${region.enabled ? '' : 'disabled'}`}>
            <div className="ase-color-region-head">
              <span>Region {region.index}</span>
              <strong>{region.name}</strong>
            </div>
            {region.enabled ? (
              <>
                <select value={selected} onChange={e => onChange(region.index, e.target.value)}>
                  <optgroup label="Natural for this region">
                    {region.palette.map(color => (
                      <option key={`natural-${color.name}`} value={color.name}>{color.id} - {color.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="All ARK dino colors">
                    {allColors.map(color => (
                      <option key={`all-${color.name}`} value={color.name}>{color.id} - {color.name}</option>
                    ))}
                  </optgroup>
                </select>
                <div className="ase-swatch-line">
                  <i style={{ background: selectedColor?.hex || '#111' }} />
                  <span>{selected || 'No color'}</span>
                </div>
                <div className="ase-region-subtitle">Natural colors</div>
                <div className="ase-swatch-grid compact">
                  {region.palette.map(color => (
                    <button
                      key={`natural-swatch-${color.name}`}
                      type="button"
                      className={selected === color.name ? 'active' : ''}
                      style={{ background: color.hex }}
                      title={`${color.id} - ${color.name}`}
                      onClick={() => onChange(region.index, color.name)}
                    />
                  ))}
                </div>
                <div className="ase-region-subtitle">All dino colors</div>
                <div className="ase-swatch-grid">
                  {allColors.map(color => (
                    <button
                      key={color.name}
                      type="button"
                      className={selected === color.name ? 'active' : ''}
                      style={{ background: color.hex }}
                      title={`${color.id} - ${color.name}`}
                      onClick={() => onChange(region.index, color.name)}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="ase-region-empty">No color channel</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function StatsExtractor() {
  const initialSettings = useMemo(() => loadSettings(), []);
  const [tab, setTab] = useState(getTabFromHash);
  const [settings, setSettingsState] = useState(initialSettings);
  const [species, setSpecies] = useState('Rex');
  const [name, setName] = useState('');
  const [sex, setSex] = useState('unknown');
  const [owner, setOwner] = useState('');
  const [tribe, setTribe] = useState('');
  const [arkId, setArkId] = useState('');
  const [values, setValues] = useState({});
  const [library, setLibrary] = useState(loadLibrary);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('breedingScore');
  const [libraryFilters, setLibraryFilters] = useState({ sex: '', owner: '', tribe: '', status: '', duplicatesOnly: false });
  const [notes, setNotes] = useState('');
  const [colors, setColors] = useState(() => normalizeCreatureColors('Rex'));
  const [modelUrl, setModelUrl] = useState('');
  const [modelManifest, setModelManifest] = useState({});
  const [mutations, setMutations] = useState({ maternal: 0, paternal: 0 });
  const [parentIds, setParentIds] = useState({ motherId: '', fatherId: '' });
  const [raisingTimers, setRaisingTimers] = useState(loadRaisingTimers);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [importStatus, setImportStatus] = useState('');
  const [watchStatus, setWatchStatus] = useState({ active: false, folder: '' });
  const [receiverStatus, setReceiverStatus] = useState({ running: false, port: 39777 });
  const [breedingOptions, setBreedingOptions] = useState({
    onlyClean: Boolean(initialSettings.breedingOnlyClean),
    mutationLimit: initialSettings.breedingMutationLimit || 40,
    allowSameParents: Boolean(initialSettings.breedingAllowSameParents),
  });
  const exportRef = useRef(null);
  const fileInputRef = useRef(null);

  const appSpecies = useMemo(() => dinosaurs.map(d => d.name), []);
  const speciesOptions = useMemo(() => {
    const set = new Set([...appSpecies, ...getExtractorSpecies()]);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [appSpecies]);

  const result = useMemo(() => estimateWildPoints(species, values, settings), [species, values, settings]);
  const colorHexes = useMemo(() => {
    const normalized = normalizeCreatureColors(species, colors);
    return Object.fromEntries(Object.entries(normalized).map(([region, colorName]) => [region, getColorByName(colorName)?.hex || '']));
  }, [species, colors]);
  const annotatedLibrary = useMemo(() => annotateDuplicates(library), [library]);
  const owners = useMemo(() => Array.from(new Set(library.map(c => c.owner).filter(Boolean))).sort(), [library]);
  const tribes = useMemo(() => Array.from(new Set(library.map(c => c.tribe).filter(Boolean))).sort(), [library]);
  const statuses = useMemo(() => Array.from(new Set(library.map(c => c.imported?.status).filter(Boolean))).sort(), [library]);
  const visibleLibrary = useMemo(() => {
    const filtered = filterLibrary(annotatedLibrary, { ...libraryFilters, search, species });
    return rankCreatures(filtered, '', sortKey);
  }, [annotatedLibrary, libraryFilters, search, sortKey, species]);
  const selectedCreature = annotatedLibrary.find(c => c.id === selectedId) || visibleLibrary[0] || null;
  const breedingPairs = useMemo(() => buildBreedingPlan(annotatedLibrary, species, breedingOptions), [annotatedLibrary, species, breedingOptions]);
  const sameSpeciesParents = useMemo(() => annotatedLibrary.filter(c => c.species === species), [annotatedLibrary, species]);
  const resolvedParents = selectedCreature ? resolveParents(selectedCreature, annotatedLibrary) : { mother: null, father: null };
  const pedigreeTree = useMemo(() => selectedCreature ? buildPedigreeTree(selectedCreature, annotatedLibrary, 3) : null, [selectedCreature, annotatedLibrary]);
  const installedModel = modelManifest[species] || modelManifest[slugSpecies(species)] || null;
  const resolvedModelUrl = modelUrl || installedModel?.url || '';

  useEffect(() => {
    let alive = true;
    fetch('/models/creatures/manifest.json')
      .then(res => res.ok ? res.json() : {})
      .then(data => {
        if (!alive) return;
        setModelManifest(data?.species || {});
      })
      .catch(() => {
        if (alive) setModelManifest({});
      });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const syncTabFromHash = () => setTab(getTabFromHash());
    window.addEventListener('hashchange', syncTabFromHash);
    return () => window.removeEventListener('hashchange', syncTabFromHash);
  }, []);

  const selectTab = (nextTab) => {
    setTab(nextTab);
    const nextHash = nextTab === 'extract' ? 'extractor' : `extractor:${nextTab}`;
    if (window.location.hash !== `#${nextHash}`) window.location.hash = nextHash;
  };

  const importTexts = (items = [], source = 'batch') => {
    let nextLibrary = library;
    let nextTimers = raisingTimers;
    let importedFiles = 0;
    for (const item of items) {
      try {
        nextLibrary = importAnyAsb(item.text, nextLibrary);
        const timers = extractAsbRaisingTimers(item.text, nextLibrary);
        if (timers.length) nextTimers = [...timers, ...nextTimers];
        importedFiles += 1;
      } catch (e) {}
    }
    if (!importedFiles) {
      setImportStatus(`${source}: aucun fichier reconnu.`);
      return;
    }
    nextLibrary = saveLibrary(nextLibrary, settings.libraryLimit);
    nextTimers = saveRaisingTimers(nextTimers);
    setLibrary(nextLibrary);
    setRaisingTimers(nextTimers);
    setImportError('');
    setImportStatus(`${source}: ${importedFiles}/${items.length} fichiers, ${nextLibrary.length} creatures.`);
  };

  useEffect(() => {
    if (!window.api?.onAsbImportFiles) return undefined;
    return window.api.onAsbImportFiles(payload => {
      importTexts(payload?.files || [], payload?.source || 'auto');
    });
  }, [library, raisingTimers, settings.libraryLimit]);

  const setSettings = (patch) => {
    setSettingsState(prev => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  };

  const changeSpecies = (nextSpecies) => {
    setSpecies(nextSpecies);
    setColors(prev => normalizeCreatureColors(nextSpecies, prev));
    setModelUrl('');
  };

  const updateValue = (key, value) => setValues(prev => ({ ...prev, [key]: value }));
  const updateColor = (regionIndex, colorName) => setColors(prev => ({ ...normalizeCreatureColors(species, prev), [regionIndex]: colorName }));
  const clearValues = () => setValues({});
  const loadDemo = () => setValues(DEMO_PRESETS[species] || DEMO_PRESETS.Rex);

  const saveCreature = () => {
    if (!result) return;
    const payload = {
      name,
      species,
      sex,
      mode: settings.mode,
      values,
      result,
      notes,
      mutations,
      colors,
      owner,
      tribe,
      arkId,
      parents: parentIds,
      serverName: settings.serverName,
    };
    const selected = library.find(c => c.id === selectedId);
    const freshEntry = createCreatureEntry(payload);
    const entry = selected
      ? { ...freshEntry, id: selected.id, createdAt: selected.createdAt, updatedAt: new Date().toISOString() }
      : freshEntry;
    const next = selected
      ? saveLibrary(library.map(c => c.id === selected.id ? entry : c), settings.libraryLimit)
      : saveLibrary([entry, ...library], settings.libraryLimit);
    setLibrary(next);
    setSelectedId(entry.id);
    setTab('library');
  };

  const loadCreature = (creature) => {
    setSelectedId(creature.id);
    setSpecies(creature.species);
    setName(creature.name);
    setSex(creature.sex || 'unknown');
    setOwner(creature.owner || '');
    setTribe(creature.tribe || '');
    setArkId(creature.arkId || '');
    setValues(creature.values || {});
    setNotes(creature.notes || '');
    setColors(normalizeCreatureColors(creature.species, creature.colors));
    setMutations(creature.mutations || { maternal: 0, paternal: 0 });
    setParentIds({
      motherId: creature.parents?.motherId || '',
      fatherId: creature.parents?.fatherId || '',
    });
    setSettings({ mode: creature.mode || settings.mode });
    setTab('extract');
  };

  const removeCreature = (id) => {
    const next = saveLibrary(library.filter(c => c.id !== id), settings.libraryLimit);
    setLibrary(next);
    if (selectedId === id) setSelectedId(null);
  };

  const copyExport = async () => {
    const text = exportLibrary(library);
    if (navigator.clipboard) await navigator.clipboard.writeText(text);
    if (exportRef.current) exportRef.current.value = text;
  };

  const importLibrary = () => {
    try {
      const next = saveLibrary(importLibraryJson(importText, library), settings.libraryLimit);
      setLibrary(next);
      setImportText('');
      setImportError('');
      setImportStatus(`Import OVERSEER OK: ${next.length} creatures en bibliothèque.`);
    } catch (error) {
      setImportError(error.message || 'Import invalide.');
    }
  };

  const importAsbExport = () => {
    try {
      const next = saveLibrary(importAsbJson(importText, library), settings.libraryLimit);
      setLibrary(next);
      setImportText('');
      setImportError('');
      setImportStatus(`Import ASB export gun OK: ${next.length} creatures en bibliothèque.`);
      setTab('library');
    } catch (error) {
      setImportError(error.message || 'Import ASB invalide.');
    }
  };

  const importAuto = (text = importText) => {
    try {
      const next = saveLibrary(importAnyAsb(text, library), settings.libraryLimit);
      setLibrary(next);
      const importedTimers = extractAsbRaisingTimers(text, next);
      if (importedTimers.length) {
        setRaisingTimers(saveRaisingTimers([...importedTimers, ...raisingTimers]));
      }
      setImportText('');
      setImportError('');
      setImportStatus(`Import Auto OK: ${next.length} creatures, ${importedTimers.length} timers importés.`);
      setTab('library');
    } catch (error) {
      setImportError(error.message || 'Import auto invalide.');
    }
  };

  const importFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      importAuto(text);
    } finally {
      event.target.value = '';
    }
  };

  const importAsbFolder = async () => {
    if (!window.api?.selectAsbImportFolder) {
      setImportError('Import dossier disponible dans l’app Electron, pas dans le navigateur dev.');
      return;
    }
    const result = await window.api.selectAsbImportFolder();
    if (result?.canceled) return;
    importTexts(result.files || [], 'Dossier importé');
    setTab('library');
  };

  const startWatchFolder = async () => {
    if (!window.api?.watchAsbImportFolder) {
      setImportError('Watcher disponible dans l’app Electron, pas dans le navigateur dev.');
      return;
    }
    const result = await window.api.watchAsbImportFolder();
    if (result?.canceled) return;
    if (result?.watching) {
      setWatchStatus({ active: true, folder: result.folder || '' });
      setImportStatus(`Watcher actif: ${result.folder}`);
    } else {
      setImportError(result?.error || 'Impossible de surveiller ce dossier.');
    }
  };

  const stopWatchFolder = async () => {
    await window.api?.stopAsbImportWatch?.();
    setWatchStatus({ active: false, folder: '' });
    setImportStatus('Watcher arrêté.');
  };

  const startReceiver = async () => {
    if (!window.api?.startAsbExportServer) {
      setImportError('Receiver disponible dans l’app Electron, pas dans le navigateur dev.');
      return;
    }
    const result = await window.api.startAsbExportServer(receiverStatus.port);
    if (result?.running) {
      setReceiverStatus({ running: true, port: result.port });
      setImportStatus(`Export-gun receiver actif: http://127.0.0.1:${result.port}`);
    } else {
      setImportError(result?.error || 'Impossible de démarrer le receiver.');
    }
  };

  const stopReceiver = async () => {
    await window.api?.stopAsbExportServer?.();
    setReceiverStatus(prev => ({ ...prev, running: false }));
    setImportStatus('Export-gun receiver arrêté.');
  };

  const mergeDuplicates = () => {
    const next = saveLibrary(mergeDuplicateCreatures(library), settings.libraryLimit);
    setLibrary(next);
  };

  const addRaisingTimer = (pair) => {
    const timer = createRaisingTimer(pair, species);
    if (!timer) return;
    const next = saveRaisingTimers([timer, ...raisingTimers]);
    setRaisingTimers(next);
  };

  const removeRaisingTimer = (id) => {
    const next = saveRaisingTimers(raisingTimers.filter(timer => timer.id !== id));
    setRaisingTimers(next);
  };

  return (
    <motion.div
      className="ase-page"
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16 }}
    >
      <header className="ase-header">
        <div>
          <h1>ARK Smart Breeding Suite</h1>
          <p>Module ASB unifié : extraction des points, couleurs, bibliothèque, plan de breeding et pedigree pour tes lignes ASA/ASE.</p>
        </div>
        <div className="ase-header-actions">
          <button onClick={loadDemo}><ZapIcon size={14} /> Demo</button>
          <button onClick={clearValues}><ResetIcon size={14} /> Reset</button>
          <button className="primary" onClick={saveCreature}><PlusIcon size={14} /> {selectedId ? 'Save changes' : 'Save creature'}</button>
        </div>
      </header>

      <nav className="ase-tabs">
        {TABS.map(item => (
          <button key={item.key} className={tab === item.key ? 'active' : ''} onClick={() => selectTab(item.key)}>
            <item.Icon size={14} />
            {item.label}
          </button>
        ))}
      </nav>

      <main className="ase-workspace">
        <section className="ase-left">
          <div className="ase-panel ase-identity">
            <Field label="Creature">
              <select value={species} onChange={e => changeSpecies(e.target.value)}>
                {speciesOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Name">
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Nom du dino" />
            </Field>
            <Field label="Sex">
              <select value={sex} onChange={e => setSex(e.target.value)}>
                <option value="unknown">Unknown</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="neutered">Neutered</option>
              </select>
            </Field>
            <Field label="Owner">
              <input value={owner} onChange={e => setOwner(e.target.value)} placeholder="Joueur / owner" />
            </Field>
            <Field label="Tribe">
              <input value={tribe} onChange={e => setTribe(e.target.value)} placeholder="Tribe" />
            </Field>
            <Field label="ARK ID">
              <input value={arkId} onChange={e => setArkId(e.target.value)} placeholder="id1:id2" />
            </Field>
            <Field label="Mother">
              <select value={parentIds.motherId} onChange={e => setParentIds(p => ({ ...p, motherId: e.target.value }))}>
                <option value="">Mother n/a</option>
                {sameSpeciesParents.filter(c => c.sex === 'female' && c.id !== selectedId).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Father">
              <select value={parentIds.fatherId} onChange={e => setParentIds(p => ({ ...p, fatherId: e.target.value }))}>
                <option value="">Father n/a</option>
                {sameSpeciesParents.filter(c => c.sex === 'male' && c.id !== selectedId).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <div className="ase-mode-switch">
              {Object.entries(MODE_LABELS).map(([key, label]) => (
                <button key={key} className={settings.mode === key ? 'active' : ''} onClick={() => setSettings({ mode: key })}>{label}</button>
              ))}
            </div>
          </div>

          {tab === 'extract' && (
            <>
              <div className="ase-panel">
                <div className="ase-panel-title">
                  <div><CalculatorIcon size={15} /> Visible stats</div>
                  <span>{result?.confidence || 0}% confidence</span>
                </div>
                <div className="ase-stat-grid">
                  {STAT_KEYS.map(stat => (
                    <StatInputCard
                      key={stat.key}
                      stat={stat}
                      row={result?.rows.find(r => r.key === stat.key)}
                      value={values[stat.key]}
                      onChange={updateValue}
                    />
                  ))}
                </div>
              </div>

              <div className="ase-panel ase-settings-grid">
                <Field label="Level hint" compact>
                  <input value={settings.level} onChange={e => setSettings({ level: e.target.value })} type="number" min="1" placeholder="optional" />
                </Field>
                <Field label="Max wild" compact>
                  <input value={settings.maxWild} onChange={e => setSettings({ maxWild: e.target.value })} type="number" min="1" />
                </Field>
                <Field label="Max domestic" compact>
                  <input value={settings.maxDomestic} onChange={e => setSettings({ maxDomestic: e.target.value })} type="number" min="0" />
                </Field>
                <Field label="Taming eff %" compact>
                  <input value={settings.tamingEffectiveness} onChange={e => setSettings({ tamingEffectiveness: e.target.value })} type="number" min="0" max="100" />
                </Field>
                <Field label="Imprint %" compact>
                  <input value={settings.imprintBonus} onChange={e => setSettings({ imprintBonus: e.target.value })} type="number" min="0" max="100" />
                </Field>
                <Field label="Server" compact>
                  <input value={settings.serverName} onChange={e => setSettings({ serverName: e.target.value })} placeholder="optional" />
                </Field>
              </div>
            </>
          )}

          {tab === 'appearance' && (
            <div className="ase-panel ase-appearance">
              <div className="ase-panel-title">
                <div><SparklesIcon size={15} /> Creature image and color regions</div>
                <span>ASB image pack + color mask</span>
              </div>
              <div className="ase-appearance-layout asb-image-first">
                <CreatureColorImageViewer species={species} colors={colors} />
                <ColorRegionEditor species={species} colors={colors} onChange={updateColor} />
              </div>
              <div className="ase-panel-title ase-subpanel-title">
                <div><SparklesIcon size={15} /> Optional GLB/GLTF viewer</div>
                <span>only if you provide real model files</span>
              </div>
              <div className="ase-appearance-layout ase-model-secondary">
                <CreatureModelViewer
                  species={species}
                  colorHexes={colorHexes}
                  modelUrl={resolvedModelUrl}
                  modelSource={modelUrl ? 'manual model' : installedModel?.name}
                  materialRegions={installedModel?.materialRegions || []}
                  onModelUrl={setModelUrl}
                />
                <div className="ase-model-help">
                  <strong>Why this is optional</strong>
                  <p>ASB's default creature preview is image-mask based. Real 3D meshes are not shipped in this repo; add legal `.glb`/`.gltf` files only if you want a separate 3D viewer.</p>
                </div>
              </div>
              <div className="ase-model-source">
                {installedModel ? (
                  <span>Installed game model: <strong>{installedModel.name || installedModel.url}</strong></span>
                ) : (
                  <span>No installed game model for <strong>{species}</strong>. Add a legal `.glb`/`.gltf` and register it in `public/models/creatures/manifest.json`.</span>
                )}
              </div>
            </div>
          )}

          {tab === 'library' && (
            <div className="ase-panel">
              <div className="ase-panel-title">
                <div><ClipboardIcon size={15} /> Library</div>
                <span>{library.length} creatures</span>
              </div>
              <div className="ase-library-tools">
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search library" />
                <select value={sortKey} onChange={e => setSortKey(e.target.value)}>
                  <option value="breedingScore">Breeding score</option>
                  {STAT_KEYS.map(stat => <option key={stat.key} value={stat.key}>{stat.label}</option>)}
                </select>
                <select value={libraryFilters.sex} onChange={e => setLibraryFilters(f => ({ ...f, sex: e.target.value }))}>
                  <option value="">All sex</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="neutered">Neutered</option>
                  <option value="unknown">Unknown</option>
                </select>
                <select value={libraryFilters.owner} onChange={e => setLibraryFilters(f => ({ ...f, owner: e.target.value }))}>
                  <option value="">All owners</option>
                  {owners.map(ownerName => <option key={ownerName} value={ownerName}>{ownerName}</option>)}
                </select>
                <select value={libraryFilters.tribe} onChange={e => setLibraryFilters(f => ({ ...f, tribe: e.target.value }))}>
                  <option value="">All tribes</option>
                  {tribes.map(tribeName => <option key={tribeName} value={tribeName}>{tribeName}</option>)}
                </select>
                <select value={libraryFilters.status} onChange={e => setLibraryFilters(f => ({ ...f, status: e.target.value }))}>
                  <option value="">All status</option>
                  {statuses.map(status => <option key={status} value={status}>{status}</option>)}
                </select>
                <button onClick={() => setLibraryFilters(f => ({ ...f, duplicatesOnly: !f.duplicatesOnly }))}>
                  {libraryFilters.duplicatesOnly ? 'All' : 'Duplicates'}
                </button>
                <button onClick={mergeDuplicates}>Merge dupes</button>
              </div>
              <div className="ase-library-list">
                {visibleLibrary.length ? visibleLibrary.map(creature => (
                  <LibraryRow
                    key={creature.id}
                    creature={creature}
                    active={selectedCreature?.id === creature.id}
                    onSelect={setSelectedId}
                    onRemove={removeCreature}
                    onEdit={loadCreature}
                  />
                )) : <div className="ase-empty">Aucune creature sauvegardee pour cette espece.</div>}
              </div>
            </div>
          )}

          {tab === 'planner' && (
            <div className="ase-panel">
              <div className="ase-panel-title">
                <div><DnaIcon size={15} /> Best pairs</div>
                <span>{breedingPairs.length} pairs</span>
              </div>
              <div className="ase-library-tools">
                <label className="ase-inline-check">
                  <input
                    type="checkbox"
                    checked={breedingOptions.onlyClean}
                    onChange={e => setBreedingOptions(o => ({ ...o, onlyClean: e.target.checked }))}
                  />
                  Clean mutations
                </label>
                <Field label="Mutation cap" compact>
                  <input
                    type="number"
                    min="0"
                    value={breedingOptions.mutationLimit}
                    onChange={e => setBreedingOptions(o => ({ ...o, mutationLimit: e.target.value }))}
                  />
                </Field>
                <label className="ase-inline-check">
                  <input
                    type="checkbox"
                    checked={breedingOptions.allowSameParents}
                    onChange={e => setBreedingOptions(o => ({ ...o, allowSameParents: e.target.checked }))}
                  />
                  Include risky pairs
                </label>
              </div>
              <div className="ase-pair-list">
                {breedingPairs.length ? breedingPairs.map(pair => <PlannerPair key={pair.id} pair={pair} onTimer={addRaisingTimer} />) : (
                  <div className="ase-empty">Sauvegarde au moins un male et une femelle de cette espece.</div>
                )}
              </div>
            </div>
          )}

          {tab === 'pedigree' && (
            <div className="ase-panel ase-pedigree">
              <div className="ase-panel-title">
                <div><ShieldIcon size={15} /> Pedigree board</div>
                <span>{selectedCreature ? selectedCreature.name : 'no selection'}</span>
              </div>
              {selectedCreature ? (
                <>
                  <div className="ase-pedigree-board">
                    <div className={`ase-node parent ${resolvedParents.mother ? '' : 'muted'}`}>
                      Mother<br />
                      <strong>{resolvedParents.mother?.name || selectedCreature.parents?.motherName || 'n/a'}</strong>
                      {resolvedParents.mother && <span>L{resolvedParents.mother.levelRead} · score {resolvedParents.mother.breedingScore}</span>}
                    </div>
                    <div className="ase-node current">
                      <strong>{selectedCreature.name}</strong>
                      <span>{selectedCreature.species}</span>
                      <em>L{selectedCreature.levelRead} · score {selectedCreature.breedingScore}</em>
                      {selectedCreature.arkId && <span>ARK {selectedCreature.arkId}</span>}
                    </div>
                    <div className={`ase-node parent ${resolvedParents.father ? '' : 'muted'}`}>
                      Father<br />
                      <strong>{resolvedParents.father?.name || selectedCreature.parents?.fatherName || 'n/a'}</strong>
                      {resolvedParents.father && <span>L{resolvedParents.father.levelRead} · score {resolvedParents.father.breedingScore}</span>}
                    </div>
                  </div>
                  <div className="ase-pedigree-tree">
                    <PedigreeNode node={pedigreeTree} />
                  </div>
                </>
              ) : <div className="ase-empty">Selectionne une creature dans la library.</div>}
            </div>
          )}
        </section>

        <aside className="ase-right">
          <div className="ase-panel ase-summary">
            <div className="ase-score-ring">
              <strong>{result?.breedingScore || 0}</strong>
              <span>breeding score</span>
            </div>
            <div className="ase-pill-grid">
              <StatPill value={result?.totalWild} label="wild pts" tone="green" />
              <StatPill value={result?.totalDomestic} label="dom pts" tone="blue" />
              <StatPill value={result?.levelRead} label="read level" tone="violet" />
              <StatPill value={result?.confidence} label="confidence" tone="orange" />
            </div>
          </div>

          <div className="ase-panel">
            <div className="ase-panel-title">
              <div><SparklesIcon size={15} /> Top inherited stats</div>
            </div>
            <div className="ase-top-list">
              {result?.topStats.length ? result.topStats.map(stat => (
                <div key={stat.key} className={`ase-top-stat ${stat.quality}`}>
                  <span>{stat.label}</span>
                  <strong>{stat.wild}</strong>
                  <em>{stat.confidence}%</em>
                </div>
              )) : <div className="ase-empty">Entre les stats visibles pour classer les meilleurs points.</div>}
            </div>
          </div>

          <BreedingInfo species={species} />

          <div className="ase-panel">
            <div className="ase-panel-title">
              <div><TimerIcon size={15} /> Baby timers</div>
              <span>{raisingTimers.length} timers</span>
            </div>
            <RaisingTimerList timers={raisingTimers} onRemove={removeRaisingTimer} />
          </div>

          <div className="ase-panel ase-meta">
            <div className="ase-panel-title"><div><InfoIcon size={15} /> Creature notes</div></div>
            <div className="ase-mutation-row">
              <Field label="Mat muts" compact>
                <input value={mutations.maternal} onChange={e => setMutations(m => ({ ...m, maternal: e.target.value }))} type="number" min="0" />
              </Field>
              <Field label="Pat muts" compact>
                <input value={mutations.paternal} onChange={e => setMutations(m => ({ ...m, paternal: e.target.value }))} type="number" min="0" />
              </Field>
            </div>
            <div className="ase-color-summary">
              {Object.entries(normalizeCreatureColors(species, colors)).map(([region, colorName]) => colorName && (
                <span key={region}>
                  <i style={{ background: getColorByName(colorName)?.hex || '#111' }} />
                  R{region} {colorName}
                </span>
              ))}
            </div>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes, owner, cryo location..." />
          </div>

          <div className="ase-panel ase-selected">
            <div className="ase-panel-title">
              <div><CheckIcon size={15} /> Selected</div>
              {selectedCreature && <button onClick={() => loadCreature(selectedCreature)}>Load</button>}
            </div>
            {selectedCreature ? (
              <>
                <strong>{selectedCreature.name}</strong>
                <span>{selectedCreature.species} · {selectedCreature.sex} · score {selectedCreature.breedingScore}</span>
                <div className="ase-mini-stat-row">
                  {STAT_KEYS.filter(s => s.breedable).map(stat => (
                    <div key={stat.key}><span>{stat.short}</span><strong>{selectedCreature.stats?.[stat.key]?.wild ?? '-'}</strong></div>
                  ))}
                </div>
              </>
            ) : <div className="ase-empty">Aucune selection.</div>}
          </div>

          <div className="ase-panel ase-import">
            <div className="ase-panel-title"><div><AlertIcon size={15} /> Import / Export</div></div>
            <button onClick={copyExport}>Copy export JSON</button>
            <button onClick={importAsbFolder}>Import DinoExports folder</button>
            <button onClick={watchStatus.active ? stopWatchFolder : startWatchFolder}>
              {watchStatus.active ? 'Stop DinoExports watch' : 'Watch DinoExports folder'}
            </button>
            <div className="ase-import-server-row">
              <input
                type="number"
                min="1024"
                max="65535"
                value={receiverStatus.port}
                onChange={e => setReceiverStatus(s => ({ ...s, port: e.target.value }))}
                disabled={receiverStatus.running}
              />
              <button onClick={receiverStatus.running ? stopReceiver : startReceiver}>
                {receiverStatus.running ? 'Stop receiver' : 'Start export-gun receiver'}
              </button>
            </div>
            <button onClick={() => fileInputRef.current?.click()}>Import file auto</button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.txt,.tsv,.csv,.asb,*/*"
              onChange={importFile}
              style={{ display: 'none' }}
            />
            <textarea ref={exportRef} readOnly placeholder="Export appears here after copy." />
            <textarea value={importText} onChange={e => setImportText(e.target.value)} placeholder="Paste OVERSEER, ASB library, ASB export-gun, or ASB tab import..." />
            {importError && <div className="ase-import-error">{importError}</div>}
            {importStatus && <div className="ase-import-status">{importStatus}</div>}
            {watchStatus.active && <div className="ase-import-status">Watching: {watchStatus.folder}</div>}
            {receiverStatus.running && <div className="ase-import-status">Receiver URL: http://127.0.0.1:{receiverStatus.port}</div>}
            <button onClick={() => importAuto()} disabled={!importText.trim()}>Import Auto / Total</button>
            <button onClick={importLibrary} disabled={!importText.trim()}>Import OVERSEER library</button>
            <button onClick={importAsbExport} disabled={!importText.trim()}>Import ASB export gun</button>
          </div>
        </aside>
      </main>
    </motion.div>
  );
}
