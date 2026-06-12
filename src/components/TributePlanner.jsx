import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertIcon, CheckIcon, ClipboardIcon, DnaIcon, DropletIcon, FarmingIcon, LayersIcon, MapIcon, PlusIcon, RaidIcon, ResetIcon, ServerIcon, ShieldIcon, SkullIcon, TamingLassoIcon, TaskClipboardIcon, TimerIcon, ZapIcon } from './Icons';
import { flattenRunItems, getTributeStateKey, TRIBUTE_DIFFICULTIES, TRIBUTE_RUNS } from '../data/tributePlanner';
import { loadAccount, saveAccount } from '../data/account';
import {
  createTribeTask,
  createHostedTribe,
  deleteTribeTask,
  joinHostedTribe,
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
  'island-broodmother': { image: './tribute/official-broodmother.png', accent: '#b778ff', tag: 'Gamma' },
  'island-megapithecus': { image: './tribute/official-megapithecus.png', accent: '#ffd985', tag: 'Beta' },
  'island-dragon': { image: './tribute/official-dragon.png', accent: '#ff8f3d', tag: 'Alpha' },
  'island-overseer': { image: './tribute/official-overseer.png', accent: '#a66cff', tag: 'Asc' },
  broodmother: { image: './tribute/official-broodmother.png', accent: '#b778ff', tag: 'Boss' },
  megapithecus: { image: './tribute/official-megapithecus.png', accent: '#ffd985', tag: 'Boss' },
  dragon: { image: './tribute/official-dragon.png', accent: '#ff8f3d', tag: 'Boss' },
  overseer: { image: './tribute/official-overseer.png', accent: '#a66cff', tag: 'Boss' },
  manticore: { image: './tribute/official-dragon.png', accent: '#d9c07a', tag: 'ASA' },
  rockwell: { image: './tribute/official-overseer.png', accent: '#8f7bff', tag: 'ASA' },
  titan: { image: './tribute/official-overseer.png', accent: '#79d7ff', tag: 'Titan' },
  fjordur: { image: './tribute/official-megapithecus.png', accent: '#79d7ff', tag: 'Fjordur' },
  astraeos: { image: './tribute/official-overseer.png', accent: '#d9c07a', tag: 'Astraeos' },
};

function getRunVisual(run) {
  if (!run) return RUN_VISUALS.overseer;
  if (RUN_VISUALS[run.id]) return RUN_VISUALS[run.id];
  const label = `${run.boss || ''} ${run.map || ''}`.toLowerCase();
  if (label.includes('broodmother')) return RUN_VISUALS.broodmother;
  if (label.includes('megapithecus')) return RUN_VISUALS.megapithecus;
  if (label.includes('dragon')) return RUN_VISUALS.dragon;
  if (label.includes('overseer')) return RUN_VISUALS.overseer;
  if (label.includes('manticore')) return RUN_VISUALS.manticore;
  if (label.includes('rockwell')) return RUN_VISUALS.rockwell;
  if (label.includes('titan')) return RUN_VISUALS.titan;
  if (label.includes('fjordur') || label.includes('fenris') || label.includes('beyla') || label.includes('sköll') || label.includes('stein')) return RUN_VISUALS.fjordur;
  if (label.includes('astraeos') || label.includes('natrix') || label.includes('minotaur') || label.includes('grendel')) return RUN_VISUALS.astraeos;
  return RUN_VISUALS.overseer;
}

const TASK_CATEGORIES = {
  farming: { label: 'Farm', color: '#ffd985', Icon: FarmingIcon },
  breeding: { label: 'Élevage', color: '#a66cff', Icon: DnaIcon },
  taming: { label: 'Taming', color: '#ff9b45', Icon: TamingLassoIcon },
  raid: { label: 'Raid prep', color: '#ff5f56', Icon: RaidIcon },
  base: { label: 'Base', color: '#b778ff', Icon: ShieldIcon },
};

const DEFAULT_TRIBE_TASKS = [];
const TRIBE_MEMBERS_KEY = 'overseer-tribe-members-v1';

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

function clearRunState(runId) {
  localStorage.removeItem(getTributeStateKey(runId));
}

function loadInitialRunStates() {
  const migrationKey = 'overseer-tribute-clean-player-state-v1';
  if (!localStorage.getItem(migrationKey)) {
    TRIBUTE_RUNS.forEach(run => saveRunState(run.id, { checked: {}, owners: {}, notes: '', status: 'open' }));
    localStorage.setItem(migrationKey, '1');
  }
  return Object.fromEntries([...loadCustomRuns(), ...TRIBUTE_RUNS].map(run => [run.id, loadRunState(run.id)]));
}

function makeInitials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '--';
  return parts.slice(0, 2).map(part => part[0]).join('').toUpperCase();
}

function loadPlayerMembers(account = loadAccount()) {
  try {
    const saved = JSON.parse(localStorage.getItem(TRIBE_MEMBERS_KEY) || '[]');
    if (Array.isArray(saved)) return saved;
  } catch {
    // fall through to account bootstrap
  }
  const playerName = account.displayName || account.email || '';
  return playerName ? [{
    id: account.userId || 'local-player',
    name: playerName,
    initials: makeInitials(playerName),
    role: 'owner',
  }] : [];
}

function savePlayerMembers(members) {
  localStorage.setItem(TRIBE_MEMBERS_KEY, JSON.stringify(members));
  window.dispatchEvent(new Event('overseer-members-changed'));
  return members;
}

function memberFor(members, id) {
  return members.find(member => member.id === id) || { id: '', name: 'Non assignée', initials: '--', role: '' };
}

function buildDefaultChecked(run) {
  return {};
}

function RunButton({ run, active, progress, onClick }) {
  const visual = getRunVisual(run);
  const runDifficulty = run.difficulty || 'Gamma';
  return (
    <button className={`tribute-run-card ${active ? 'active' : ''}`} onClick={onClick}>
      <div className="tribute-run-thumb" style={{ '--run-accent': visual.accent }}>
        <img src={visual.image} alt="" />
      </div>
      <div className="tribute-run-copy">
        <strong>{run.boss}</strong>
        <span>{run.map}</span>
        <em>{runDifficulty}</em>
      </div>
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

function ItemRow({ item, difficulty, checked, members, onToggle, onOwnerChange }) {
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
        {members.map(member => <option key={member.id} value={member.id}>{member.initials}</option>)}
      </select>
      <em className={ready ? 'ok' : 'bad'}>{ready ? '✓' : '×'}</em>
    </div>
  );
}

function CategoryPanel({ category, difficulty, checked, ownerOverrides, members, onToggle, onOwnerChange }) {
  const done = category.items.filter(item => checked[item.id]).length;
  const categoryIcons = {
    artifacts: LayersIcon,
    trophies: ShieldIcon,
    prep: RaidIcon,
  };
  const CategoryIcon = categoryIcons[category.id] || ClipboardIcon;
  return (
    <section className="tribute-category">
      <div className="tribute-category-head">
        <strong><CategoryIcon size={15} />{category.title}</strong>
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
          item={{ ...item, owner: ownerOverrides[item.id] || '' }}
          difficulty={difficulty}
          checked={checked}
          members={members}
          onToggle={onToggle}
          onOwnerChange={onOwnerChange}
        />
      ))}
    </section>
  );
}

function AssignmentPanel({ items, checked, ownerOverrides, members }) {
  const claimedIcons = [LayersIcon, DropletIcon, ZapIcon, DnaIcon, ShieldIcon];
  const assignedMembers = members.filter(member => items.some(item => ownerOverrides[item.id] === member.id));
  return (
    <section className="tribute-inspector-panel">
      <div className="tribute-inspector-title"><ClipboardIcon size={14} /> Tribe Assignments <span>{assignedMembers.length}</span></div>
      <div className="tribute-assignees">
        {assignedMembers.length ? assignedMembers.map(member => {
          const owned = items.filter(item => ownerOverrides[item.id] === member.id);
          const done = owned.filter(item => checked[item.id]).length;
          return (
            <div className="tribute-assignee" key={member.id}>
              <span>{member.initials}</span>
              <div>
                <strong>{member.name}</strong>
                <em>{done} items <b>{claimedIcons.slice(0, Math.min(done, claimedIcons.length)).map((Icon, iconIndex) => <Icon key={iconIndex} size={10} />)}</b></em>
              </div>
              <i className={done === owned.length && owned.length ? 'ready' : ''} />
            </div>
          );
        }) : (
          <div className="tribute-empty-panel">
            <strong>No assignments yet</strong>
            <span>Assigne les items quand ta vraie tribu est prête.</span>
          </div>
        )}
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

function TribeTaskCard({ task, members, onToggle, onItemToggle, onDelete, canManage }) {
  const category = TASK_CATEGORIES[task.category] || TASK_CATEGORIES.base;
  const Icon = category.Icon;
  const member = memberFor(members, task.assignedTo);
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
  const [members, setMembers] = useState(() => loadPlayerMembers());
  const [memberDraft, setMemberDraft] = useState('');
  const [draft, setDraft] = useState({ title: '', category: 'farming', assignedTo: '', priority: 'normal', item: '' });
  const [notice, setNotice] = useState('');
  const [syncState, setSyncState] = useState('local');
  const [activity, setActivity] = useState([]);
  const [role, setRole] = useState('owner');
  const canManage = role === 'owner' || role === 'officer';

  const stripSeedTasks = (list = []) => list.filter(task => !String(task.id || '').startsWith('seed-'));

  const updateLocalAccount = (patch) => {
    const next = saveAccount({ ...loadAccount(), ...patch });
    setAccount(next);
    setMembers(current => {
      if (current.length || !(next.displayName || next.email)) return current;
      const playerName = next.displayName || next.email;
      return savePlayerMembers([{ id: next.userId || 'local-player', name: playerName, initials: makeInitials(playerName), role: 'owner' }]);
    });
    return next;
  };

  useEffect(() => {
    const active = loadAccount();
    setAccount(active);
    setMembers(loadPlayerMembers(active));
    setSyncState(active.hostedTribeId ? 'cloud' : 'local');
    let alive = true;
    loadHostedTribeTasks({ tribeId: active.hostedTribeId })
      .then(remoteTasks => {
        if (!alive) return;
        if (active.hostedTribeId) setTasks(stripSeedTasks(remoteTasks || []));
        else if (remoteTasks?.length) setTasks(stripSeedTasks(remoteTasks));
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

  const addMember = () => {
    const name = memberDraft.trim();
    if (!name) return;
    const nextMember = {
      id: `member-${Date.now()}`,
      name,
      initials: makeInitials(name),
      role: members.length ? 'member' : 'owner',
    };
    setMembers(current => savePlayerMembers([...current, nextMember]));
    setMemberDraft('');
  };

  const removeMember = (memberId) => {
    const nextTasks = tasks.map(task => task.assignedTo === memberId ? { ...task, assignedTo: '' } : task);
    setMembers(current => {
      const next = current.filter(member => member.id !== memberId);
      savePlayerMembers(next);
      return next;
    });
    persistTasks(nextTasks, () => saveHostedTribeTasks({ tribeId: account.hostedTribeId || '', tasks: nextTasks }));
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
          <span>Module tribu</span>
          <strong>Tâches de tribu</strong>
          <em>{account.tribeName || 'Tribu locale'} · {account.tribeCode || 'aucun code invitation'}</em>
        </div>
        <div className="tribe-task-readiness">
          <b>{readiness}%</b>
          <span>{doneItems}/{totalItems} éléments prêts</span>
        </div>
        <button onClick={() => { window.location.hash = 'tribute:workspace'; }}><ShieldIcon size={14} /> Workspace tribu</button>
      </section>

      <section className="tribe-task-metrics">
        <div><TaskClipboardIcon size={15} /><span>Ouvertes</span><strong>{openTasks}</strong></div>
        <div><CheckIcon size={15} /><span>Terminées</span><strong>{completedTasks}</strong></div>
        <div><DnaIcon size={15} /><span>Assignées</span><strong>{new Set(tasks.map(task => task.assignedTo).filter(Boolean)).size}</strong></div>
        <div><ServerIcon size={15} /><span>Stockage</span><strong>{syncState === 'syncing' ? 'Sync' : account.hostedTribeId ? 'Live' : 'Local'}</strong></div>
      </section>

      <section className="tribe-task-console">
        <div className="tribe-task-create">
          <input value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })} placeholder="Nouvelle tâche de tribu" />
          <select value={draft.category} onChange={event => setDraft({ ...draft, category: event.target.value })}>
            {Object.entries(TASK_CATEGORIES).map(([id, category]) => <option key={id} value={id}>{category.label}</option>)}
          </select>
          <select value={draft.assignedTo} onChange={event => setDraft({ ...draft, assignedTo: event.target.value })}>
            <option value="">Non assignée</option>
            {members.map(member => <option key={member.id} value={member.id}>{member.name}</option>)}
          </select>
          <select value={draft.priority} onChange={event => setDraft({ ...draft, priority: event.target.value })}>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          <input value={draft.item} onChange={event => setDraft({ ...draft, item: event.target.value })} placeholder="Checklist: métal, polymère, brews" />
          <button onClick={addTask}><PlusIcon size={15} /> Ajouter</button>
        </div>
        <div className="tribe-task-filters">
          {['all', 'open', ...Object.keys(TASK_CATEGORIES)].map(key => (
            <button key={key} className={filter === key ? 'active' : ''} onClick={() => setFilter(key)}>
              {key === 'all' ? 'Tout' : key === 'open' ? 'Ouvertes' : TASK_CATEGORIES[key].label}
            </button>
          ))}
        </div>
      </section>

      <section className="tribe-task-board-native">
        <div className="tribe-task-list-native">
          {filteredTasks.length ? filteredTasks.map(task => (
            <TribeTaskCard
              key={task.id}
              task={task}
              members={members}
              onToggle={toggleTask}
              onItemToggle={toggleItem}
              onDelete={deleteTask}
              canManage={canManage}
            />
          )) : (
            <div className="tribe-task-empty-state">
              <TaskClipboardIcon size={24} />
              <strong>Aucune tâche de tribu</strong>
              <span>Ajoute une tâche réelle, puis assigne-la aux membres que tu ajoutes toi-même.</span>
              <button onClick={() => document.querySelector('.tribe-task-create input')?.focus()}><PlusIcon size={14} /> Créer une tâche</button>
            </div>
          )}
        </div>
        <aside className="tribe-task-inspector-native">
          <div className="tribe-task-side-panel">
            <strong>Membres <small className="tribe-role-badge">{role}</small></strong>
            <div className="tribe-member-add">
              <input value={memberDraft} onChange={event => setMemberDraft(event.target.value)} placeholder="Nom du joueur" />
              <button onClick={addMember}><PlusIcon size={13} /> Ajouter</button>
            </div>
            {members.length ? members.map(member => {
              const count = tasks.filter(task => task.assignedTo === member.id && !task.done).length;
              return (
                <span key={member.id}>
                  <b>{member.initials}</b>{member.name}<i>{member.role || 'member'}</i><em>{count} ouvertes</em>
                  <button className="tribe-member-remove" onClick={() => removeMember(member.id)} title="Retirer membre">x</button>
                </span>
              );
            }) : (
              <p>Aucun membre. Ajoute les joueurs de ta vraie tribu ici.</p>
            )}
          </div>
          <div className="tribe-task-side-panel activity">
            <strong>Activité</strong>
            {activity.length ? activity.slice(0, 8).map(entry => (
              <span key={entry.id}>
                <b>{String(entry.actor || '??').slice(0, 2).toUpperCase()}</b>
                <span>{entry.actor}<em>{entry.message} · {entry.taskTitle}</em></span>
                <time>{formatActivityTime(entry.createdAt)}</time>
              </span>
            )) : <p>Aucune activité pour le moment. Les changements apparaîtront ici.</p>}
          </div>
          <div className="tribe-task-side-panel">
            <strong>Synchronisation</strong>
            <p>{account.hostedTribeId ? 'Synchronisation live active pour les tâches de tribu.' : 'Mode local actif. Crée ou rejoins une tribu pour synchroniser entre joueurs.'}</p>
            {notice && <small>{notice}</small>}
          </div>
        </aside>
      </section>
    </div>
  );
}

function TribeWorkspaceModule() {
  const [account, setAccount] = useState(() => loadAccount());
  const [draft, setDraft] = useState({ name: loadAccount().tribeName || '', invite: '' });
  const [notice, setNotice] = useState('');
  const [syncState, setSyncState] = useState(account.hostedTribeId ? 'cloud' : 'local');

  const updateLocalAccount = (patch) => {
    const next = saveAccount({ ...loadAccount(), ...patch });
    setAccount(next);
    setDraft(current => ({ ...current, name: next.tribeName || current.name }));
    return next;
  };

  const createWorkspace = async () => {
    const name = draft.name.trim();
    if (!name) {
      setNotice('Entre un nom de tribu avant de créer le workspace.');
      return;
    }
    setSyncState('syncing');
    setNotice('');
    try {
      const tribe = await createHostedTribe({
        name,
        ownerId: account.userId,
        ownerName: account.displayName || account.email || 'Survivor',
      });
      updateLocalAccount({
        tribeName: tribe.name || tribe.tribeName || name,
        tribeCode: tribe.invite_code || tribe.tribeCode || account.tribeCode,
        hostedTribeId: tribe.id || account.hostedTribeId,
      });
      setNotice('Tribu créée. Partage le code invitation avec tes joueurs.');
    } catch (error) {
      setNotice(error.message || 'Impossible de créer la tribu.');
    } finally {
      setSyncState(loadAccount().hostedTribeId ? 'cloud' : 'local');
    }
  };

  const joinWorkspace = async () => {
    const inviteCode = draft.invite.trim().toUpperCase();
    if (!inviteCode) {
      setNotice('Entre un code invitation.');
      return;
    }
    setSyncState('syncing');
    setNotice('');
    try {
      const tribe = await joinHostedTribe({
        inviteCode,
        userId: account.userId,
        displayName: account.displayName || account.email || 'Survivor',
      });
      updateLocalAccount({
        tribeName: tribe.name || account.tribeName || draft.name,
        tribeCode: tribe.invite_code || tribe.tribeCode || inviteCode,
        hostedTribeId: tribe.id || account.hostedTribeId,
      });
      setDraft(current => ({ ...current, invite: '' }));
      setNotice('Tribu rejointe.');
    } catch (error) {
      setNotice(error.message || 'Code invitation invalide.');
    } finally {
      setSyncState(loadAccount().hostedTribeId ? 'cloud' : 'local');
    }
  };

  return (
    <div className="tribe-workspace-page">
      <section className="tribe-workspace-hero">
        <div>
          <span>Workspace tribu</span>
          <strong>{account.tribeName || 'Aucune tribu liée'}</strong>
          <p>{account.tribeCode ? `Code invitation : ${account.tribeCode}` : 'Crée une tribu ou rejoins celle de ton serveur pour synchroniser les tâches.'}</p>
        </div>
        <div className={`tribe-workspace-orb ${syncState}`}>
          <ShieldIcon size={28} />
          <b>{syncState === 'syncing' ? 'Sync' : account.hostedTribeId ? 'Live' : 'Local'}</b>
        </div>
      </section>
      <section className="tribe-workspace-grid">
        <div className="tribe-workspace-panel">
          <span>Créer une tribu</span>
          <strong>Nouveau workspace</strong>
          <p>Utilise ça si tu es le chef ou si tu veux préparer l’espace de ta team.</p>
          <input value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} placeholder="Nom de tribu" />
          <button onClick={createWorkspace}><PlusIcon size={15} /> Créer la tribu</button>
        </div>
        <div className="tribe-workspace-panel">
          <span>Rejoindre</span>
          <strong>Code invitation</strong>
          <p>Colle le code donné par ta tribu pour rejoindre son workspace.</p>
          <input value={draft.invite} onChange={event => setDraft({ ...draft, invite: event.target.value.toUpperCase() })} placeholder="CODE-TRIBU" />
          <button onClick={joinWorkspace}><ShieldIcon size={15} /> Rejoindre</button>
        </div>
      </section>
      <section className="tribe-workspace-status">
        <strong>État actuel</strong>
        <span>{notice || (account.hostedTribeId ? 'Synchronisation prête.' : 'Mode local actif tant qu’aucune tribu cloud n’est liée.')}</span>
      </section>
    </div>
  );
}

function getTributeViewFromHash() {
  const [, section] = window.location.hash.replace(/^#/, '').split(':');
  if (section === 'planner' || section === 'tribute') return 'tribute';
  if (section === 'tasks' || section === 'workspace') return section;
  return 'tasks';
}

export default function TributePlanner() {
  const [moduleView, setModuleView] = useState(getTributeViewFromHash);
  const [customRuns, setCustomRuns] = useState(loadCustomRuns);
  const [customRunDraft, setCustomRunDraft] = useState({ open: false, templateId: TRIBUTE_RUNS[0].id, name: '', difficulty: 'Gamma' });
  const [plannerBossId, setPlannerBossId] = useState(TRIBUTE_RUNS[0].id);
  const [members, setMembers] = useState(() => loadPlayerMembers());
  const [guideOpen, setGuideOpen] = useState(false);
  const allRuns = useMemo(() => [...customRuns, ...TRIBUTE_RUNS], [customRuns]);
  const plannedRuns = customRuns;
  const [selectedRunId, setSelectedRunId] = useState(TRIBUTE_RUNS[0].id);
  const [difficulty, setDifficulty] = useState('Gamma');
  const [stateByRun, setStateByRun] = useState(loadInitialRunStates);
  const selectedRun = allRuns.find(run => run.id === selectedRunId) || allRuns[0] || TRIBUTE_RUNS[0];
  const runState = stateByRun[selectedRun.id] || {};
  const checked = runState.checked || {};
  const ownerOverrides = runState.owners || {};
  const notes = runState.notes || '';
  const runAt = runState.runAt || '';
  const runFinished = runState.status === 'finished';
  const formattedRunDate = runAt
    ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(runAt))
    : 'Not planned';
  const formattedRunTime = runAt
    ? new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date(runAt))
    : '--:--';
  const allItems = useMemo(() => flattenRunItems(selectedRun), [selectedRun]);
  const seededChecked = { ...buildDefaultChecked(selectedRun), ...checked };
  const completed = allItems.filter(item => seededChecked[item.id]).length;
  const missing = allItems.length - completed;
  const readiness = Math.round((completed / Math.max(allItems.length, 1)) * 100);
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

  useEffect(() => {
    const syncMembers = () => setMembers(loadPlayerMembers());
    window.addEventListener('storage', syncMembers);
    window.addEventListener('focus', syncMembers);
    window.addEventListener('overseer-members-changed', syncMembers);
    return () => {
      window.removeEventListener('storage', syncMembers);
      window.removeEventListener('focus', syncMembers);
      window.removeEventListener('overseer-members-changed', syncMembers);
    };
  }, []);

  const switchModuleView = (view) => {
    setModuleView(view);
    window.location.hash = view === 'tasks' ? 'tribute:tasks' : view === 'workspace' ? 'tribute:workspace' : 'tribute:planner';
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
    updateRunState({ checked: {}, owners: {}, notes: '', status: 'open', completedAt: null });
  };

  const finishRun = () => {
    updateRunState({
      status: 'finished',
      completedAt: new Date().toISOString(),
      checked: Object.fromEntries(allItems.map(item => [item.id, true])),
    });
  };

  const closeRun = () => {
    if (selectedRun.id.startsWith('custom-')) {
      setCustomRuns(prev => {
        const next = prev.filter(run => run.id !== selectedRun.id);
        saveCustomRuns(next);
        return next;
      });
      clearRunState(selectedRun.id);
      setStateByRun(prev => {
        const next = { ...prev };
        delete next[selectedRun.id];
        return next;
      });
      setSelectedRunId(TRIBUTE_RUNS[0].id);
      return;
    }
    updateRunState({ status: 'closed', checked: {}, owners: {}, notes: '', completedAt: null });
  };

  const openCustomRunCreator = () => {
    const template = TRIBUTE_RUNS.find(run => run.id === selectedRun.id) || TRIBUTE_RUNS[0];
    setCustomRunDraft({ open: true, templateId: template.id, name: `${template.boss} run`, difficulty });
  };

  const createCustomRunFromTemplate = ({ templateId, name, startDifficulty }) => {
    const template = TRIBUTE_RUNS.find(run => run.id === templateId) || selectedRun;
    const customName = (name || '').trim() || template.boss;
    const customRun = {
      ...template,
      id: `custom-${Date.now()}`,
      templateId: template.id,
      boss: customName,
      difficulty: startDifficulty || 'Gamma',
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
    setStateByRun(prev => ({ ...prev, [customRun.id]: { checked: {}, owners: {}, notes: '', status: 'open' } }));
    saveRunState(customRun.id, { checked: {}, owners: {}, notes: '', status: 'open' });
    setSelectedRunId(customRun.id);
    setDifficulty(startDifficulty || 'Gamma');
    return customRun;
  };

  const createCustomRun = () => {
    const created = createCustomRunFromTemplate({
      templateId: customRunDraft.templateId,
      name: customRunDraft.name,
      startDifficulty: customRunDraft.difficulty,
    });
    setCustomRunDraft({ open: false, templateId: TRIBUTE_RUNS[0].id, name: '', difficulty: 'Gamma' });
  };

  const planSelectedBoss = () => {
    createCustomRunFromTemplate({
      templateId: plannerBossId,
      name: '',
      startDifficulty: difficulty,
    });
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
          const owner = memberFor(members, ownerOverrides[item.id] || '');
          const ownerLabel = ownerOverrides[item.id] ? ` @${owner.initials}` : '';
          return `- ${checked[item.id] ? '[x]' : '[ ]'} x${item.qty[difficulty]} ${item.name}${ownerLabel}`;
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
    return Math.round((done / Math.max(items.length, 1)) * 100);
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
                <SkullIcon size={14} /> Boss planner
              </button>
              <button className={moduleView === 'tasks' ? 'active' : ''} onClick={() => switchModuleView('tasks')}>
                <ClipboardIcon size={14} /> Tâches tribu
              </button>
              <button className={moduleView === 'workspace' ? 'active' : ''} onClick={() => switchModuleView('workspace')}>
                <ShieldIcon size={14} /> Workspace
              </button>
            </div>
            {moduleView === 'tribute' ? (
              <div className="tribute-run-rail">
                {plannedRuns.length ? plannedRuns.map(run => (
                  <RunButton
                    key={run.id}
                    run={run}
                    active={run.id === selectedRun.id}
                    progress={runProgress(run)}
                    onClick={() => {
                      setSelectedRunId(run.id);
                      setPlannerBossId(run.templateId || run.id);
                    }}
                  />
                )) : (
                  <div className="tribute-run-empty">
                    <strong>Aucun run planifié</strong>
                    <span>Choisis un boss en haut, puis clique sur “Planifier ce boss”.</span>
                  </div>
                )}
              </div>
            ) : moduleView === 'tasks' ? (
              <div className="tribe-module-side-note">
                <strong>Tâches de tribu</strong>
                <span>Prépare le farm, l’élevage, le taming et les runs boss avec ta vraie équipe.</span>
              </div>
            ) : (
              <div className="tribe-module-side-note">
                <strong>Workspace</strong>
                <span>Crée ou rejoins une tribu pour partager les tâches entre joueurs.</span>
              </div>
            )}
          </div>
          <button
            className="tribute-new-run"
            onClick={() => {
              if (moduleView === 'tasks') document.querySelector('.tribe-task-create input')?.focus();
              else if (moduleView === 'workspace') document.querySelector('.tribe-workspace-panel input')?.focus();
              else openCustomRunCreator();
            }}
          >
            <PlusIcon size={17} /> {moduleView === 'tribute' ? 'Nouveau run' : moduleView === 'tasks' ? 'Nouvelle tâche' : 'Créer tribu'}
          </button>
        </aside>
        {moduleView === 'tasks' ? (
          <TribeTasksModule />
        ) : moduleView === 'workspace' ? (
          <TribeWorkspaceModule />
        ) : (
        <div className="tribute-mock-main">
      <section className="tribute-command">
        <div className="tribute-command-title"><SkullIcon size={17} /> Boss Tribute Planner</div>
        <div className="tribute-command-cell boss">
          <div className="tribute-boss-portrait" style={{ '--run-accent': getRunVisual(selectedRun).accent }}>
            <img src={getRunVisual(selectedRun).image} alt="" />
          </div>
          <div>
            <span>Boss</span>
            <select
              className="tribute-boss-select"
              value={selectedRun.templateId || plannerBossId}
              onChange={event => {
                setPlannerBossId(event.target.value);
                setSelectedRunId(event.target.value);
              }}
            >
              {TRIBUTE_RUNS.map(run => (
                <option key={run.id} value={run.id}>{run.map} - {run.boss}</option>
              ))}
            </select>
            <button className="tribute-plan-boss" onClick={planSelectedBoss}><PlusIcon size={13} /> Planifier ce boss</button>
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

      <section className="tribute-summary-dock">
        <div className="tribute-summary-block">
          <span>Summary</span>
          <div className="tribute-summary-metrics">
            <strong>{allItems.length}<em>Total items</em></strong>
            <strong>{completed}<em>Ready</em></strong>
            <strong>{missing}<em>Missing</em></strong>
            <strong>{allItems.filter(item => ownerOverrides[item.id]).length}<em>Assigned</em></strong>
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
                members={members}
                onToggle={toggleItem}
                onOwnerChange={changeOwner}
              />
            ))}
          </div>
        </main>

        <aside className="tribute-inspector">
          <AssignmentPanel items={allItems} checked={seededChecked} ownerOverrides={ownerOverrides} members={members} />
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
            <button className="tribute-guide-button" onClick={() => setGuideOpen(true)}><MapIcon size={15} /> Voir le guide détaillé</button>
          </section>
          <section className="tribute-inspector-panel">
            <div className="tribute-inspector-title"><ClipboardIcon size={14} /> Notes <button>Edit</button></div>
            <textarea
              value={notes}
              onChange={event => updateRunState({ notes: event.target.value })}
              placeholder="Exemple : prévoir les rexes bred, vérifier les brews, noter les rôles de ta tribu."
              maxLength={500}
            />
            <small>{notes.length} / 500</small>
          </section>
          <section className={`tribute-inspector-panel tribute-run-status ${runFinished ? 'finished' : ''}`}>
            <div className="tribute-inspector-title"><CheckIcon size={14} /> Run status</div>
            <p>{runFinished ? 'Cette run est terminée. Tu peux la fermer ou la rouvrir via reset.' : 'Quand le boss est fait, marque la run terminée pour nettoyer ton planning.'}</p>
            <div className="tribute-status-actions">
              <button onClick={finishRun} disabled={runFinished}><CheckIcon size={14} /> Tâche finie</button>
              <button onClick={closeRun}><ResetIcon size={14} /> Fermer la run</button>
            </div>
          </section>
        </aside>
      </section>
        </div>
        )}
      </div>
      {customRunDraft.open && (
        <div className="tribute-modal-backdrop" onClick={() => setCustomRunDraft(draft => ({ ...draft, open: false }))}>
          <div className="tribute-modal" onClick={event => event.stopPropagation()}>
            <div className="tribute-modal-title">
              <SkullIcon size={16} />
              <strong>Nouveau run personnalisé</strong>
              <button onClick={() => setCustomRunDraft(draft => ({ ...draft, open: false }))}>x</button>
            </div>
            <label>
              <span>Boss à planifier</span>
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
              <span>Nom du run</span>
              <input
                value={customRunDraft.name}
                onChange={event => setCustomRunDraft(draft => ({ ...draft, name: event.target.value }))}
                placeholder="Dragon Alpha vendredi"
              />
            </label>
            <label>
              <span>Difficulté de départ</span>
              <select
                value={customRunDraft.difficulty}
                onChange={event => setCustomRunDraft(draft => ({ ...draft, difficulty: event.target.value }))}
              >
                {TRIBUTE_DIFFICULTIES.map(level => <option key={level} value={level}>{level}</option>)}
              </select>
            </label>
            <div className="tribute-modal-help">
              <strong>Run propre</strong>
              <span>Les items du boss choisi sont copiés, mais les assignations membres sont vidées pour ta vraie tribu.</span>
            </div>
            <div className="tribute-modal-actions">
              <button onClick={() => setCustomRunDraft(draft => ({ ...draft, open: false }))}>Annuler</button>
              <button className="primary" onClick={createCustomRun}><PlusIcon size={14} /> Créer le run</button>
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
