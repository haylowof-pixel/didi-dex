import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { dinosaurs } from '../data/dinosaurs';
import {
  MODE_LABELS,
  STAT_KEYS,
  buildBreedingPlan,
  createCreatureEntry,
  estimateWildPoints,
  exportLibrary,
  formatDuration,
  getColorByName,
  getColorPalette,
  getExtractorSpecies,
  getSpeciesBreedingInfo,
  getSpeciesColorRegions,
  importLibraryJson,
  loadLibrary,
  loadSettings,
  normalizeCreatureColors,
  rankCreatures,
  saveLibrary,
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

function LibraryRow({ creature, active, onSelect, onRemove }) {
  const top = creature.topStats?.slice(0, 3) || [];
  return (
    <div className={`ase-library-row ${active ? 'active' : ''}`} onClick={() => onSelect(creature.id)} role="button" tabIndex={0}>
      <div className="ase-library-main">
        <strong>{creature.name}</strong>
        <span>{creature.species} · L{creature.levelRead} · {creature.sex}</span>
      </div>
      <div className="ase-library-stats">
        {top.map(stat => <span key={stat.key}>{stat.label.slice(0, 3)} {stat.wild}</span>)}
      </div>
      <div className="ase-library-score">{creature.breedingScore}</div>
      <button className="ase-row-remove" onClick={e => { e.stopPropagation(); onRemove(creature.id); }}>x</button>
    </div>
  );
}

function PlannerPair({ pair }) {
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
  const [tab, setTab] = useState(() => window.location.hash.includes(':appearance') ? 'appearance' : 'extract');
  const [settings, setSettingsState] = useState(initialSettings);
  const [species, setSpecies] = useState('Rex');
  const [name, setName] = useState('');
  const [sex, setSex] = useState('unknown');
  const [values, setValues] = useState({});
  const [library, setLibrary] = useState(loadLibrary);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('breedingScore');
  const [notes, setNotes] = useState('');
  const [colors, setColors] = useState(() => normalizeCreatureColors('Rex'));
  const [modelUrl, setModelUrl] = useState('');
  const [modelManifest, setModelManifest] = useState({});
  const [mutations, setMutations] = useState({ maternal: 0, paternal: 0 });
  const [importText, setImportText] = useState('');
  const exportRef = useRef(null);

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
  const visibleLibrary = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rankCreatures(library, species, sortKey).filter(c =>
      !q || c.name.toLowerCase().includes(q) || c.species.toLowerCase().includes(q)
    );
  }, [library, search, sortKey, species]);
  const selectedCreature = library.find(c => c.id === selectedId) || visibleLibrary[0] || null;
  const breedingPairs = useMemo(() => buildBreedingPlan(library, species), [library, species]);
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
    const entry = createCreatureEntry({
      name,
      species,
      sex,
      mode: settings.mode,
      values,
      result,
      notes,
      mutations,
      colors,
      serverName: settings.serverName,
    });
    const next = saveLibrary([entry, ...library], settings.libraryLimit);
    setLibrary(next);
    setSelectedId(entry.id);
    setTab('library');
  };

  const loadCreature = (creature) => {
    setSelectedId(creature.id);
    setSpecies(creature.species);
    setName(creature.name);
    setSex(creature.sex || 'unknown');
    setValues(creature.values || {});
    setNotes(creature.notes || '');
    setColors(normalizeCreatureColors(creature.species, creature.colors));
    setMutations(creature.mutations || { maternal: 0, paternal: 0 });
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
    const next = saveLibrary(importLibraryJson(importText, library), settings.libraryLimit);
    setLibrary(next);
    setImportText('');
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
          <h1>ARK Smart Extractor</h1>
          <p>Extraction locale des points, bibliothèque, comparaison, plan de breeding et pedigree pour tes lignes ASA/ASE.</p>
        </div>
        <div className="ase-header-actions">
          <button onClick={loadDemo}><ZapIcon size={14} /> Demo</button>
          <button onClick={clearValues}><ResetIcon size={14} /> Reset</button>
          <button className="primary" onClick={saveCreature}><PlusIcon size={14} /> Save creature</button>
        </div>
      </header>

      <nav className="ase-tabs">
        {TABS.map(item => (
          <button key={item.key} className={tab === item.key ? 'active' : ''} onClick={() => setTab(item.key)}>
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
              </div>
              <div className="ase-library-list">
                {visibleLibrary.length ? visibleLibrary.map(creature => (
                  <LibraryRow
                    key={creature.id}
                    creature={creature}
                    active={selectedCreature?.id === creature.id}
                    onSelect={setSelectedId}
                    onRemove={removeCreature}
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
              <div className="ase-pair-list">
                {breedingPairs.length ? breedingPairs.map(pair => <PlannerPair key={pair.id} pair={pair} />) : (
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
                <div className="ase-pedigree-board">
                  <div className="ase-node parent muted">Mother<br /><span>assign in library export</span></div>
                  <div className="ase-node current">
                    <strong>{selectedCreature.name}</strong>
                    <span>{selectedCreature.species}</span>
                    <em>L{selectedCreature.levelRead} · score {selectedCreature.breedingScore}</em>
                  </div>
                  <div className="ase-node parent muted">Father<br /><span>assign in library export</span></div>
                </div>
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
            <textarea ref={exportRef} readOnly placeholder="Export appears here after copy." />
            <textarea value={importText} onChange={e => setImportText(e.target.value)} placeholder="Paste OVERSEER library JSON..." />
            <button onClick={importLibrary} disabled={!importText.trim()}>Import library</button>
          </div>
        </aside>
      </main>
    </motion.div>
  );
}
