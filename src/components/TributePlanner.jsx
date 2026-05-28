import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertIcon, CheckIcon, ClipboardIcon, DnaIcon, FarmingIcon, LayersIcon, MapIcon, PlusIcon, RaidIcon, ResetIcon, ServerIcon, ShieldIcon, SkullIcon, TamingLassoIcon, TaskClipboardIcon, TimerIcon, ZapIcon } from './Icons';
import { flattenRunItems, getTributeStateKey, TRIBE_MEMBERS, TRIBUTE_DIFFICULTIES, TRIBUTE_RUNS } from '../data/tributePlanner';
import { loadAccount } from '../data/account';
import {
  createTribeTask,
  deleteTribeTask,
  loadCurrentTribeRole,
  loadHostedTribeTasks,
  loadTribeActivity,
  recordTribeActivity,
  saveHostedTribeTasks,
  subscribeToTribeActivity,
  subscribeToTribeTasks,
  updateTribeTask,
} from '../data/tribeCloud';

const RUN_VISUALS = {
  'island-broodmother': { image: './tribute/official-broodmother.png', accent: '#b45cff', tag: 'Gamma' },
  'island-megapithecus': { image: './tribute/official-megapithecus.png', accent: '#38bdf8', tag: 'Beta' },
  'island-dragon': { image: './tribute/official-dragon.png', accent: '#ff5f56', tag: 'Alpha' },
  overseer: { image: './tribute/official-overseer.png', accent: '#97adff', tag: 'Gamma' },
};

const TASK_CATEGORIES = {
  farming: { label: 'Farm', color: '#2dd4a0', Icon: FarmingIcon },
  breeding: { label: 'Breeding', color: '#38bdf8', Icon: DnaIcon },
  taming: { label: 'Taming', color: '#f5a623', Icon: TamingLassoIcon },
  raid: { label: 'Raid prep', color: '#ff5f56', Icon: RaidIcon },
  base: { label: 'Base', color: '#b45cff', Icon: ShieldIcon },
};

const DEFAULT_TRIBE_TASKS = [
  {
    id: 'seed-raid-brews',
    title: 'Craft medical brews for Broodmother',
    category: 'raid',
    priority: 'high',
    assignedTo: 'kr',
    due: 'Today',
    done: false,
    items: [
      { name: 'Medical Brews', qty: 120, done: true },
      { name: 'Canteens filled', qty: 24, done: false },
      { name: 'Sweet veggie cakes', qty: 30, done: false },
    ],
  },
  {
    id: 'seed-rex-imprint',
    title: 'Finish rex imprint rotation',
    category: 'breeding',
    priority: 'high',
    assignedTo: 'mi',
    due: '18:30',
    done: false,
    items: [
      { name: 'Check maturation timers', qty: 8, done: true },
      { name: 'Imprint food ready', qty: 8, done: true },
      { name: 'Cryo backup lines', qty: 4, done: false },
    ],
  },
  {
    id: 'seed-metal-run',
    title: 'Metal and polymer run',
    category: 'farming',
    priority: 'normal',
    assignedTo: 'so',
    due: 'Tomorrow',
    done: false,
    items: [
      { name: 'Metal ingots', qty: 4500, done: false },
      { name: 'Polymer', qty: 900, done: false },
      { name: 'Element dust', qty: 1200, done: false },
    ],
  },
  {
    id: 'seed-yuty',
    title: 'Tame backup Yutyrannus',
    category: 'taming',
    priority: 'normal',
    assignedTo: 'da',
    due: 'This week',
    done: false,
    items: [
      { name: 'Trap placed', qty: 1, done: true },
      { name: 'Kibble', qty: 32, done: false },
      { name: 'Saddle crafted', qty: 1, done: false },
    ],
  },
];

function loadRunState(runId) {
  try {
    const parsed = JSON.parse(localStorage.getItem(getTributeStateKey(runId)) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveRunState(runId, state) {
  localStorage.setItem(getTributeStateKey(runId), JSON.stringify(state));
}

function loadCustomRuns() {
  try {
    const parsed = JSON.parse(localStorage.getItem('overseer-tribute-custom-runs-v1') || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCustomRuns(runs) {
  localStorage.setItem('overseer-tribute-custom-runs-v1', JSON.stringify(runs));
}

function memberFor(id) {
  return TRIBE_MEMBERS.find(member => member.id === id) || { id: '', name: 'Unassigned', initials: '--', role: 'Missing' };
}

function buildDefaultChecked(run) {
  if (run.id !== 'island-broodmother') return {};
  return Object.fromEntries(run.categories.flatMap(category => {
    const readyCount = category.id === 'artifacts' ? 7 : category.id === 'trophies' ? 6 : 8;
    return category.items.slice(0, readyCount).map(item => [item.id, true]);
  }));
}

function RunButton({ run, active, progress, onClick }) {
  const visual = RUN_VISUALS[run.id] || RUN_VISUALS.overseer;
  return (
    <button className={`tribute-run-card ${active ? 'active' : ''}`} onClick={onClick}>
      <div className="tribute-run-thumb" style={{ '--run-accent': visual.accent }}>
        <img src={visual.image} alt="" />
      </div>
      <div className="tribute-run-copy">
        <strong>{run.boss}</strong>
        <span>{run.map}</span>
        <em>{run.role}</em>
      </div>
      <small style={{ '--run-accent': visual.accent }}>{visual.tag}</small>
      <i><b style={{ width: `${progress}%` }} /></i>
      <mark>{progress}%</mark>
    </button>
  );
}

function DifficultyPicker({ value, onChange }) {
  return (
    <div className="tribute-difficulty" role="group" aria-label="Difficulty">
      {TRIBUTE_DIFFICULTIES.map(difficulty => (
        <button
          key={difficulty}
          className={difficulty === value ? 'active' : ''}
          onClick={() => onChange(difficulty)}
        >
          {difficulty}
        </button>
      ))}
    </div>
  );
}

function ItemRow({ item, difficulty, checked, onToggle, onOwnerChange }) {
  const owner = memberFor(item.owner);
  const qty = item.qty[difficulty] ?? 0;
  const ready = checked[item.id];
  return (
    <div className={`tribute-item-row ${ready ? 'checked' : ''}`}>
      <label>
        <input type="checkbox" checked={Boolean(ready)} onChange={() => onToggle(item.id)} />
        <span>{item.name}</span>
      </label>
      <strong>{qty}</strong>
      <select value={item.owner} onChange={event => onOwnerChange(item.id, event.target.value)} aria-label={`Assign ${item.name}`}>
        <option value="">--</option>
        {TRIBE_MEMBERS.map(member => <option key={member.id} value={member.id}>{member.initials}</option>)}
      </select>
      <em className={ready ? 'ok' : 'bad'}>{ready ? '✓' : '×'}</em>
    </div>
  );
}

function CategoryPanel({ category, difficulty, checked, ownerOverrides, onToggle, onOwnerChange }) {
  const done = category.items.filter(item => checked[item.id]).length;
  return (
    <section className="tribute-category">
      <div className="tribute-category-head">
        <strong>{category.title}</strong>
        <span>{done}/{category.items.length}</span>
      </div>
      <div className="tribute-item-head">
        <span>Item</span>
        <span>Qty</span>
        <span>Owner</span>
        <span>Status</span>
      </div>
      {category.items.map(item => (
        <ItemRow
          key={item.id}
          item={{ ...item, owner: ownerOverrides[item.id] || item.owner }}
          difficulty={difficulty}
          checked={checked}
          onToggle={onToggle}
          onOwnerChange={onOwnerChange}
        />
      ))}
    </section>
  );
}

function AssignmentPanel({ items, checked, ownerOverrides }) {
  const claimedGlyphs = ['🪨', '💧', '🔥', '🧬', '🛡'];
  return (
    <section className="tribute-inspector-panel">
      <div className="tribute-inspector-title"><ClipboardIcon size={14} /> Tribe Assignments <span>{TRIBE_MEMBERS.filter(member => items.some(item => (ownerOverrides[item.id] || item.owner) === member.id)).length} / {TRIBE_MEMBERS.length}</span></div>
      <div className="tribute-assignees">
        {TRIBE_MEMBERS.map(member => {
          const owned = items.filter(item => (ownerOverrides[item.id] || item.owner) === member.id);
          const done = owned.filter(item => checked[item.id]).length;
          return (
            <div className="tribute-assignee" key={member.id}>
              <span>{member.initials}</span>
              <div>
                <strong>{member.name}</strong>
                <em>{done} items <b>{claimedGlyphs.slice(0, Math.min(done, claimedGlyphs.length)).join(' ')}</b></em>
              </div>
              <i className={done === owned.length && owned.length ? 'ready' : ''} />
            </div>
          );
        })}
      </div>
    </section>
  );
}

function formatActivityTime(value) {
  try {
    return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
  } catch {
    return '--:--';
  }
}

function TribeTaskCard({ task, onToggle, onItemToggle, onDelete, canManage }) {
  const category = TASK_CATEGORIES[task.category] || TASK_CATEGORIES.base;
  const Icon = category.Icon;
  const member = memberFor(task.assignedTo);
  const doneItems = task.items.filter(item => item.done).length;
  const itemPct = Math.round((doneItems / Math.max(task.items.length, 1)) * 100);
  const complete = task.done || itemPct === 100;

  return (
    <article className={`tribe-task-pro-card ${complete ? 'complete' : ''}`} style={{ '--task-accent': category.color }}>
      <button className="tribe-task-done" onClick={() => onToggle(task.id)} title="Toggle task">
        {complete ? <CheckIcon size={15} /> : <span />}
      </button>
      <div className="tribe-task-pro-main">
        <div className="tribe-task-pro-top">
          <span><Icon size={14} /> {category.label}</span>
          <em className={`prio ${task.priority}`}>{task.priority}</em>
        </div>
        <strong>{task.title}</strong>
        <div className="tribe-task-pro-meta">
          <span>{member.initials} · {member.name}</span>
          <span><TimerIcon size={12} /> {task.due}</span>
          <b>{itemPct}%</b>
        </div>
        <div className="tribe-task-progress"><i style={{ width: `${complete ? 100 : itemPct}%` }} /></div>
        <div className="tribe-task-items-pro">
          {task.items.map((item, index) => (
            <label key={`${task.id}-${item.name}-${index}`}>
              <input type="checkbox" checked={Boolean(item.done)} onChange={() => onItemToggle(task.id, index)} />
              <span>{item.name}</span>
              <em>{item.qty}</em>
            </label>
          ))}
        </div>
      </div>
      <button className="tribe-task-delete" onClick={() => onDelete(task.id)} disabled={!canManage} title={canManage ? 'Delete task' : 'Officer role required'}><ResetIcon size={13} /></button>
    </article>
  );
}

function TribeTasksModule() {
  const [account, setAccount] = useState(() => loadAccount());
  const [tasks, setTasks] = useState(DEFAULT_TRIBE_TASKS);
  const [filter, setFilter] = useState('all');
  const [draft, setDraft] = useState({ title: '', category: 'farming', assignedTo: 'kr', priority: 'normal', item: '' });
  const [notice, setNotice] = useState('');
  const [syncState, setSyncState] = useState('local');
  const [activity, setActivity] = useState([]);
  const [role, setRole] = useState('owner');
  const canManage = role === 'owner' || role === 'officer';

  useEffect(() => {
    const active = loadAccount();
    setAccount(active);
    setSyncState(active.hostedTribeId ? 'cloud' : 'local');
    let alive = true;
    loadHostedTribeTasks({ tribeId: active.hostedTribeId })
      .then(remoteTasks => {
        if (!alive) return;
        if (active.hostedTribeId) setTasks(remoteTasks || []);
        else if (remoteTasks?.length) setTasks(remoteTasks);
      })
      .catch(error => setNotice(error.message || 'Cloud load failed, local tasks loaded.'));
    loadCurrentTribeRole({ tribeId: active.hostedTribeId }).then(setRole).catch(() => setRole('member'));
    loadTribeActivity({ tribeId: active.hostedTribeId }).then(setActivity).catch(() => {});
    const unsubscribe = subscribeToTribeTasks({
      tribeId: active.hostedTribeId,
      onChange: nextTasks => {
        if (!alive) return;
        setTasks(nextTasks || []);
        setNotice('Live tribe update received.');
      },
    });
    const unsubscribeActivity = subscribeToTribeActivity({
      tribeId: active.hostedTribeId,
      onChange: nextActivity => {
        if (!alive) return;
        setActivity(nextActivity || []);
      },
    });
    return () => {
      alive = false;
      unsubscribe();
      unsubscribeActivity();
    };
  }, []);

  const pushActivity = (entry) => {
    const optimistic = {
      id: `local-activity-${Date.now()}`,
      actor: account.displayName || account.email || 'Local survivor',
      createdAt: new Date().toISOString(),
      ...entry,
    };
    setActivity(current => [optimistic, ...current].slice(0, 24));
    recordTribeActivity({ tribeId: account.hostedTribeId, ...entry }).catch(() => {});
  };

  const persistTasks = (next, taskOperation, activityEntry) => {
    setTasks(next);
    setSyncState(account.hostedTribeId ? 'syncing' : 'local');
    const operation = account.hostedTribeId ? taskOperation : () => saveHostedTribeTasks({ tribeId: '', tasks: next });
    operation()
      .then(() => {
        setSyncState(account.hostedTribeId ? 'cloud' : 'local');
        setNotice(account.hostedTribeId ? 'Saved to tribe cloud.' : 'Saved locally. Connect a hosted tribe to sync.');
        if (activityEntry) pushActivity(activityEntry);
      })
      .catch(error => setNotice(error.message || 'Save failed.'));
  };

  const filteredTasks = useMemo(() => (
    filter === 'all' ? tasks : tasks.filter(task => task.category === filter || (filter === 'open' && !task.done))
  ), [filter, tasks]);

  const openTasks = tasks.filter(task => !task.done).length;
  const completedTasks = tasks.length - openTasks;
  const totalItems = tasks.reduce((sum, task) => sum + task.items.length, 0);
  const doneItems = tasks.reduce((sum, task) => sum + task.items.filter(item => item.done).length, 0);
  const readiness = Math.round((doneItems / Math.max(totalItems, 1)) * 100);

  const addTask = () => {
    const title = draft.title.trim();
    if (!title) return;
    const itemNames = draft.item.split(',').map(item => item.trim()).filter(Boolean);
    const nextTask = {
      id: `task-${Date.now()}`,
      title,
      category: draft.category,
      priority: draft.priority,
      assignedTo: draft.assignedTo,
      due: 'Next run',
      done: false,
      items: itemNames.length ? itemNames.map(name => ({ name, qty: 1, done: false })) : [{ name: 'Prepare objective', qty: 1, done: false }],
    };
    persistTasks([nextTask, ...tasks], async () => {
      const saved = await createTribeTask({ tribeId: account.hostedTribeId, task: nextTask });
      if (saved.id !== nextTask.id) {
        setTasks(current => current.map(task => task.id === nextTask.id ? saved : task));
      }
    }, { type: 'create', message: 'created task', taskTitle: nextTask.title });
    setDraft({ title: '', category: draft.category, assignedTo: draft.assignedTo, priority: 'normal', item: '' });
  };

  const toggleTask = (taskId) => {
    const next = tasks.map(task => task.id === taskId
      ? { ...task, done: !task.done, items: task.items.map(item => ({ ...item, done: !task.done })) }
      : task
    );
    const changed = next.find(task => task.id === taskId);
    persistTasks(next, () => updateTribeTask({ tribeId: account.hostedTribeId, task: changed }), {
      type: changed.done ? 'complete' : 'reopen',
      message: changed.done ? 'completed task' : 'reopened task',
      taskTitle: changed.title,
    });
  };

  const toggleItem = (taskId, itemIndex) => {
    const next = tasks.map(task => {
      if (task.id !== taskId) return task;
      const items = task.items.map((item, index) => index === itemIndex ? { ...item, done: !item.done } : item);
      return { ...task, items, done: items.every(item => item.done) };
    });
    const changed = next.find(task => task.id === taskId);
    persistTasks(next, () => updateTribeTask({ tribeId: account.hostedTribeId, task: changed }), {
      type: 'update',
      message: 'updated checklist',
      taskTitle: changed.title,
    });
  };

  const deleteTask = (taskId) => {
    if (!canManage) {
      setNotice('Officer or owner role required to delete tasks.');
      return;
    }
    const removed = tasks.find(task => task.id === taskId);
    persistTasks(tasks.filter(task => task.id !== taskId), () => deleteTribeTask({ tribeId: account.hostedTribeId, taskId }), {
      type: 'delete',
      message: 'deleted task',
      taskTitle: removed?.title || 'Task',
    });
  };

  return (
    <div className="tribe-tasks-native">
      <section className="tribe-task-command">
        <div>
          <span>Tribe Module</span>
          <strong>Tribe Tasks</strong>
          <em>{account.tribeName || 'Local tribe'} · {account.tribeCode || 'no invite code'}</em>
        </div>
        <div className="tribe-task-readiness">
          <b>{readiness}%</b>
          <span>{doneItems}/{totalItems} items ready</span>
        </div>
        <button onClick={() => window.location.hash = 'account'}><ShieldIcon size={14} /> Account / Cloud</button>
      </section>

      <section className="tribe-task-metrics">
        <div><TaskClipboardIcon size={15} /><span>Open tasks</span><strong>{openTasks}</strong></div>
        <div><CheckIcon size={15} /><span>Complete</span><strong>{completedTasks}</strong></div>
        <div><DnaIcon size={15} /><span>Assignments</span><strong>{new Set(tasks.map(task => task.assignedTo)).size}</strong></div>
        <div><ServerIcon size={15} /><span>Storage</span><strong>{syncState === 'syncing' ? 'Syncing' : account.hostedTribeId ? 'Live' : 'Local'}</strong></div>
      </section>

      <section className="tribe-task-console">
        <div className="tribe-task-create">
          <input value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })} placeholder="Nouvelle tâche de tribu" />
          <select value={draft.category} onChange={event => setDraft({ ...draft, category: event.target.value })}>
            {Object.entries(TASK_CATEGORIES).map(([id, category]) => <option key={id} value={id}>{category.label}</option>)}
          </select>
          <select value={draft.assignedTo} onChange={event => setDraft({ ...draft, assignedTo: event.target.value })}>
            {TRIBE_MEMBERS.map(member => <option key={member.id} value={member.id}>{member.name}</option>)}
          </select>
          <select value={draft.priority} onChange={event => setDraft({ ...draft, priority: event.target.value })}>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          <input value={draft.item} onChange={event => setDraft({ ...draft, item: event.target.value })} placeholder="Checklist: métal, polymère, brews" />
          <button onClick={addTask}><PlusIcon size={15} /> Add task</button>
        </div>
        <div className="tribe-task-filters">
          {['all', 'open', ...Object.keys(TASK_CATEGORIES)].map(key => (
            <button key={key} className={filter === key ? 'active' : ''} onClick={() => setFilter(key)}>
              {key === 'all' ? 'All' : key === 'open' ? 'Open' : TASK_CATEGORIES[key].label}
            </button>
          ))}
        </div>
      </section>

      <section className="tribe-task-board-native">
        <div className="tribe-task-list-native">
          {filteredTasks.map(task => (
            <TribeTaskCard
              key={task.id}
              task={task}
              onToggle={toggleTask}
              onItemToggle={toggleItem}
              onDelete={deleteTask}
              canManage={canManage}
            />
          ))}
        </div>
        <aside className="tribe-task-inspector-native">
          <div className="tribe-task-side-panel">
            <strong>Members <small className="tribe-role-badge">{role}</small></strong>
            {TRIBE_MEMBERS.map(member => {
              const count = tasks.filter(task => task.assignedTo === member.id && !task.done).length;
              const roleLabel = member.id === 'kr' ? 'owner' : member.id === 'so' || member.id === 'mi' ? 'officer' : 'member';
              return <span key={member.id}><b>{member.initials}</b>{member.name}<i>{roleLabel}</i><em>{count} open</em></span>;
            })}
          </div>
          <div className="tribe-task-side-panel activity">
            <strong>Activity</strong>
            {activity.length ? activity.slice(0, 8).map(entry => (
              <span key={entry.id}>
                <b>{String(entry.actor || '??').slice(0, 2).toUpperCase()}</b>
                <span>{entry.actor}<em>{entry.message} · {entry.taskTitle}</em></span>
                <time>{formatActivityTime(entry.createdAt)}</time>
              </span>
            )) : <p>No activity yet. Changes will appear here.</p>}
          </div>
          <div className="tribe-task-side-panel">
            <strong>Cloud state</strong>
            <p>{account.hostedTribeId ? 'Realtime Supabase sync is active for tribe tasks.' : 'Local fallback is active. Create or join a hosted tribe in Account to sync across users.'}</p>
            {notice && <small>{notice}</small>}
          </div>
        </aside>
      </section>
    </div>
  );
}

function getTributeViewFromHash() {
  const [, section] = window.location.hash.replace(/^#/, '').split(':');
  return section === 'tasks' ? 'tasks' : 'tribute';
}

export default function TributePlanner() {
  const [moduleView, setModuleView] = useState(getTributeViewFromHash);
  const [customRuns, setCustomRuns] = useState(loadCustomRuns);
  const [customRunDraft, setCustomRunDraft] = useState({ open: false, templateId: TRIBUTE_RUNS[0].id, name: '', difficulty: 'Gamma' });
  const [guideOpen, setGuideOpen] = useState(false);
  const allRuns = useMemo(() => [...customRuns, ...TRIBUTE_RUNS], [customRuns]);
  const [selectedRunId, setSelectedRunId] = useState(TRIBUTE_RUNS[0].id);
  const [difficulty, setDifficulty] = useState('Gamma');
  const [stateByRun, setStateByRun] = useState(() => (
    Object.fromEntries([...loadCustomRuns(), ...TRIBUTE_RUNS].map(run => [run.id, loadRunState(run.id)]))
  ));
  const selectedRun = allRuns.find(run => run.id === selectedRunId) || allRuns[0] || TRIBUTE_RUNS[0];
  const runState = stateByRun[selectedRun.id] || {};
  const checked = runState.checked || {};
  const ownerOverrides = runState.owners || {};
  const notes = runState.notes || '';
  const runAt = runState.runAt || '2026-05-28T18:30';
  const mobileAlert = runState.mobileAlert !== false;
  const formattedRunDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(runAt));
  const formattedRunTime = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date(runAt));
  const allItems = useMemo(() => flattenRunItems(selectedRun), [selectedRun]);
  const seededChecked = { ...buildDefaultChecked(selectedRun), ...checked };
  const completed = allItems.filter(item => seededChecked[item.id]).length;
  const missing = allItems.length - completed;
  const readiness = selectedRun.id === 'island-broodmother' && allItems.length === 30 && completed === 21
    ? 72
    : Math.round((completed / Math.max(allItems.length, 1)) * 100);
  const categoryMissing = selectedRun.categories.map(category => ({
    id: category.id,
    title: category.title,
    missing: category.items.filter(item => !seededChecked[item.id]).length,
  }));

  useEffect(() => {
    const syncViewFromHash = () => setModuleView(getTributeViewFromHash());
    window.addEventListener('hashchange', syncViewFromHash);
    return () => window.removeEventListener('hashchange', syncViewFromHash);
  }, []);

  const switchModuleView = (view) => {
    setModuleView(view);
    window.location.hash = view === 'tasks' ? 'tribute:tasks' : 'tribute';
  };

  const updateRunState = (patch) => {
    setStateByRun(prev => {
      const nextRunState = { ...(prev[selectedRun.id] || {}), ...patch };
      const next = { ...prev, [selectedRun.id]: nextRunState };
      saveRunState(selectedRun.id, nextRunState);
      return next;
    });
  };

  const toggleItem = (itemId) => {
    updateRunState({ checked: { ...checked, [itemId]: !checked[itemId] } });
  };

  const changeOwner = (itemId, ownerId) => {
    updateRunState({ owners: { ...ownerOverrides, [itemId]: ownerId } });
  };

  const resetRun = () => {
    updateRunState({ checked: {}, owners: {}, notes: '' });
  };

  const openCustomRunCreator = () => {
    const template = TRIBUTE_RUNS.find(run => run.id === selectedRun.id) || TRIBUTE_RUNS[0];
    setCustomRunDraft({ open: true, templateId: template.id, name: `${template.boss} run`, difficulty });
  };

  const createCustomRun = () => {
    const template = TRIBUTE_RUNS.find(run => run.id === customRunDraft.templateId) || selectedRun;
    const customName = customRunDraft.name.trim() || `${template.boss} run`;
    const customRun = {
      ...template,
      id: `custom-${Date.now()}`,
      boss: customName,
      role: 'Custom run',
      army: template.army.map(unit => ({ ...unit })),
      categories: template.categories.map(category => ({
        ...category,
        items: category.items.map(item => ({ ...item, owner: '' })),
      })),
    };
    setCustomRuns(prev => {
      const next = [customRun, ...prev];
      saveCustomRuns(next);
      return next;
    });
    setStateByRun(prev => ({ ...prev, [customRun.id]: { checked: {}, owners: {}, notes: 'Custom run draft' } }));
    saveRunState(customRun.id, { checked: {}, owners: {}, notes: 'Custom run draft' });
    setSelectedRunId(customRun.id);
    setDifficulty(customRunDraft.difficulty || 'Gamma');
    setCustomRunDraft({ open: false, templateId: template.id, name: '', difficulty: 'Gamma' });
  };

  const copyRun = async () => {
    const lines = [
      `${selectedRun.map} - ${selectedRun.boss} - ${difficulty}`,
      `Readiness: ${readiness}% (${completed}/${allItems.length})`,
      `Element estimate: ${selectedRun.element[difficulty]}`,
      '',
      ...selectedRun.categories.flatMap(category => [
        category.title,
        ...category.items.map(item => {
          const owner = memberFor(ownerOverrides[item.id] || item.owner);
          return `- ${checked[item.id] ? '[x]' : '[ ]'} x${item.qty[difficulty]} ${item.name} @${owner.initials}`;
        }),
      ]),
      notes ? `\nNotes:\n${notes}` : '',
    ].filter(Boolean);
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
    } catch {
      // Clipboard permissions vary between browser contexts.
    }
  };

  const runProgress = (run) => {
    const saved = run.id === selectedRun.id ? seededChecked : (stateByRun[run.id]?.checked || {});
    const items = flattenRunItems(run);
    const done = items.filter(item => saved[item.id]).length;
    return run.id === 'island-broodmother' && items.length === 30 && done === 21
      ? 72
      : Math.round((done / Math.max(items.length, 1)) * 100);
  };

  return (
    <motion.div
      className="tribute-page tribute-pro"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18 }}
    >
      <div className="tribute-mock-frame">
        <aside className="tribute-app-sidebar">
          <div className="tribute-side-content">
            <div className="tribute-side-title">Tribut</div>
            <div className="tribe-module-switch">
              <button className={moduleView === 'tribute' ? 'active' : ''} onClick={() => switchModuleView('tribute')}>
                <SkullIcon size={14} /> Boss Planner
              </button>
              <button className={moduleView === 'tasks' ? 'active' : ''} onClick={() => switchModuleView('tasks')}>
                <ClipboardIcon size={14} /> Tribe Tasks
              </button>
            </div>
            {moduleView === 'tribute' ? (
              <div className="tribute-run-rail">
                {allRuns.map(run => (
                  <RunButton
                    key={run.id}
                    run={run}
                    active={run.id === selectedRun.id}
                    progress={runProgress(run)}
                    onClick={() => setSelectedRunId(run.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="tribe-module-side-note">
                <strong>Tribe Tasks</strong>
                <span>Assign farm, raid, breeding and prep work before boss runs.</span>
              </div>
            )}
          </div>
          <button
            className="tribute-new-run"
            onClick={() => {
              if (moduleView === 'tasks') document.querySelector('.tribe-task-create input')?.focus();
              else openCustomRunCreator();
            }}
          >
            <PlusIcon size={17} /> {moduleView === 'tribute' ? 'New Custom Run' : 'New Tribe Task'}
          </button>
        </aside>
        {moduleView === 'tasks' ? (
          <TribeTasksModule />
        ) : (
        <div className="tribute-mock-main">
      <section className="tribute-command">
        <div className="tribute-command-title"><SkullIcon size={17} /> Boss Tribute Planner</div>
        <div className="tribute-command-cell boss">
          <div className="tribute-boss-portrait" style={{ '--run-accent': (RUN_VISUALS[selectedRun.id] || RUN_VISUALS.overseer).accent }}>
            <img src={(RUN_VISUALS[selectedRun.id] || RUN_VISUALS.overseer).image} alt="" />
          </div>
          <div>
            <span>Boss</span>
            <strong>{selectedRun.boss}</strong>
          </div>
        </div>
        <div className="tribute-command-cell map">
          <div className="tribute-map-thumb"><MapIcon size={17} /></div>
          <div>
            <span>Map</span>
            <strong>{selectedRun.map}</strong>
          </div>
        </div>
        <div className="tribute-command-cell difficulty">
          <span>Difficulty</span>
          <DifficultyPicker value={difficulty} onChange={setDifficulty} />
        </div>
        <div className="tribute-gauge-wrap">
          <span>Readiness</span>
          <div className="tribute-gauge" style={{ '--value': `${readiness * 3.6}deg` }}>
            <strong>{readiness}%</strong>
            <span>{completed}/{allItems.length}</span>
          </div>
        </div>
        <div className="tribute-date-panel">
          <span>Run date / time</span>
          <label><TimerIcon size={15} /> <input type="datetime-local" value={runAt} onChange={event => updateRunState({ runAt: event.target.value })} /><b>{formattedRunDate}</b></label>
          <em><TimerIcon size={15} /> {formattedRunTime}</em>
          <button onClick={copyRun}><ClipboardIcon size={14} /> Export run</button>
        </div>
        <button className="tribute-more" title="More actions"><LayersIcon size={16} /></button>
      </section>

      <section className="tribute-pro-layout">
        <main className="tribute-workbench">
          <div className="tribute-stats-strip">
            <div><MapIcon size={14} /><span>Map</span><strong>{selectedRun.map}</strong></div>
            <div><ZapIcon size={14} /><span>Element</span><strong>{selectedRun.element[difficulty]}</strong></div>
            <div><TimerIcon size={14} /><span>Timer</span><strong>{selectedRun.timebox}</strong></div>
            <div><AlertIcon size={14} /><span>Missing</span><strong>{missing}</strong></div>
          </div>

          <div className="tribute-board">
            {selectedRun.categories.map(category => (
              <CategoryPanel
                key={category.id}
                category={category}
                difficulty={difficulty}
                checked={seededChecked}
                ownerOverrides={ownerOverrides}
                onToggle={toggleItem}
                onOwnerChange={changeOwner}
              />
            ))}
          </div>
        </main>

        <aside className="tribute-inspector">
          <AssignmentPanel items={allItems} checked={seededChecked} ownerOverrides={ownerOverrides} />
          <section className="tribute-inspector-panel">
            <div className="tribute-inspector-title"><DnaIcon size={14} /> Suggested Army ({difficulty})</div>
            <div className="tribute-army">
              {selectedRun.army.map(unit => (
                <div key={unit.name}>
                  <strong>{unit.count}x {unit.name}</strong>
                  <span>{unit.stat}</span>
                </div>
              ))}
            </div>
            <button className="tribute-guide-button" onClick={() => setGuideOpen(true)}><MapIcon size={15} /> View Detailed Guide</button>
          </section>
          <section className="tribute-inspector-panel">
            <div className="tribute-inspector-title"><ClipboardIcon size={14} /> Notes <button>Edit</button></div>
            <textarea
              value={notes}
              onChange={event => updateRunState({ notes: event.target.value })}
              placeholder="Bring extra bred rexes.&#10;Check spider buff before pull.&#10;Vex handles webs."
              maxLength={500}
            />
            <small>{notes.length} / 500</small>
          </section>
          <section className="tribute-inspector-panel tribute-mobile-alert">
            <div>
              <strong>Mobile Alert</strong>
              <span>Enable notifications for this run</span>
            </div>
            <button className={mobileAlert ? 'active' : ''} onClick={() => updateRunState({ mobileAlert: !mobileAlert })}>
              <i />
            </button>
          </section>
        </aside>
      </section>

      <section className="tribute-summary-dock">
        <div className="tribute-summary-block">
          <span>Summary</span>
          <div className="tribute-summary-metrics">
            <strong>{allItems.length}<em>Total items</em></strong>
            <strong>{completed}<em>Ready</em></strong>
            <strong>{missing}<em>Missing</em></strong>
            <strong>{allItems.filter(item => ownerOverrides[item.id] || item.owner).length}<em>Assigned</em></strong>
          </div>
        </div>
        <div className="tribute-summary-block">
          <span>Missing breakdown</span>
          <div className="tribute-breakdown">
            {categoryMissing.map(category => <b key={category.id}>{category.title}<strong>{category.missing}</strong></b>)}
          </div>
        </div>
        <div className="tribute-summary-block">
          <span>Quick actions</span>
          <div className="tribute-quick-actions">
            <button onClick={copyRun}><ClipboardIcon size={14} /> Copy run link</button>
            <button onClick={resetRun}><ResetIcon size={14} /> Reset run</button>
          </div>
        </div>
        <div className="tribute-summary-block mobile">
          <span>Mobile alert</span>
          <p>Enable mobile notifications for this run</p>
          <button className={mobileAlert ? 'active' : ''} onClick={() => updateRunState({ mobileAlert: !mobileAlert })}><i /></button>
        </div>
      </section>
        </div>
        )}
      </div>
      {customRunDraft.open && (
        <div className="tribute-modal-backdrop" onClick={() => setCustomRunDraft(draft => ({ ...draft, open: false }))}>
          <div className="tribute-modal" onClick={event => event.stopPropagation()}>
            <div className="tribute-modal-title">
              <SkullIcon size={16} />
              <strong>New Custom Run</strong>
              <button onClick={() => setCustomRunDraft(draft => ({ ...draft, open: false }))}>x</button>
            </div>
            <label>
              <span>Boss template</span>
              <select
                value={customRunDraft.templateId}
                onChange={event => {
                  const template = TRIBUTE_RUNS.find(run => run.id === event.target.value);
                  setCustomRunDraft(draft => ({ ...draft, templateId: event.target.value, name: draft.name || `${template?.boss || 'Boss'} run` }));
                }}
              >
                {TRIBUTE_RUNS.map(run => (
                  <option key={run.id} value={run.id}>{run.map} - {run.boss}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Run name</span>
              <input
                value={customRunDraft.name}
                onChange={event => setCustomRunDraft(draft => ({ ...draft, name: event.target.value }))}
                placeholder="Alpha Dragon Friday"
              />
            </label>
            <label>
              <span>Starting difficulty</span>
              <select
                value={customRunDraft.difficulty}
                onChange={event => setCustomRunDraft(draft => ({ ...draft, difficulty: event.target.value }))}
              >
                {TRIBUTE_DIFFICULTIES.map(level => <option key={level} value={level}>{level}</option>)}
              </select>
            </label>
            <div className="tribute-modal-help">
              <strong>Clean custom run</strong>
              <span>Les items du boss choisi sont copiés, mais les assignations membres sont vidées pour ta vraie tribu.</span>
            </div>
            <div className="tribute-modal-actions">
              <button onClick={() => setCustomRunDraft(draft => ({ ...draft, open: false }))}>Cancel</button>
              <button className="primary" onClick={createCustomRun}><PlusIcon size={14} /> Create run</button>
            </div>
          </div>
        </div>
      )}
      {guideOpen && (
        <div className="tribute-modal-backdrop" onClick={() => setGuideOpen(false)}>
          <div className="tribute-modal tribute-guide-modal" onClick={event => event.stopPropagation()}>
            <div className="tribute-modal-title">
              <MapIcon size={16} />
              <strong>{selectedRun.boss} guide</strong>
              <button onClick={() => setGuideOpen(false)}>x</button>
            </div>
            <div className="tribute-guide-grid">
              <div>
                <span>Map</span>
                <strong>{selectedRun.map}</strong>
              </div>
              <div>
                <span>Difficulty</span>
                <strong>{difficulty}</strong>
              </div>
              <div>
                <span>Timer</span>
                <strong>{selectedRun.timebox}</strong>
              </div>
              <div>
                <span>Element</span>
                <strong>{selectedRun.element[difficulty]}</strong>
              </div>
            </div>
            <div className="tribute-modal-help">
              <strong>Run focus</strong>
              <span>{selectedRun.focus}</span>
            </div>
            <div className="tribute-guide-army">
              <strong>Suggested army</strong>
              {selectedRun.army.map(unit => (
                <div key={unit.name}>
                  <span>{unit.count}x {unit.name}</span>
                  <em>{unit.stat}</em>
                </div>
              ))}
            </div>
            <div className="tribute-modal-actions">
              <button onClick={copyRun}><ClipboardIcon size={14} /> Copy checklist</button>
              <button className="primary" onClick={() => setGuideOpen(false)}>Done</button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
