import { loadAccount, saveAccount } from './account';
import {
  createCloudTribe,
  createCloudTribeTask,
  deleteCloudTribeTask,
  hasCloudSession,
  joinCloudTribe,
  loadCloudTribeActivity,
  loadCloudTribeRole,
  loadCloudTribeTasks,
  recordCloudTribeActivity,
  updateCloudTribeTask,
} from './cloudApi';
import { isSupabaseConfigured, supabase } from './supabaseClient';

const LOCAL_TRIBE_KEY = 'overseer-tribe';

function normalizeTask(task = {}) {
  return {
    id: task.id || `task-${Date.now()}`,
    title: task.title || 'Untitled task',
    category: task.category || 'base',
    priority: task.priority || 'normal',
    assignedTo: task.assignedTo || '',
    due: task.due || 'Next run',
    done: Boolean(task.done),
    items: Array.isArray(task.items) ? task.items : [],
    createdAt: task.createdAt || new Date().toISOString(),
    updatedAt: task.updatedAt || new Date().toISOString(),
  };
}

function rowToTask(row) {
  return normalizeTask({
    id: row.id,
    title: row.title,
    category: row.category,
    priority: row.priority,
    assignedTo: row.assigned_label || row.assigned_to || '',
    due: row.due_label || (row.due_at ? new Date(row.due_at).toLocaleString() : 'Next run'),
    done: row.done,
    items: row.items,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function taskToRow(task, { tribeId, userId }) {
  const normalized = normalizeTask(task);
  return {
    id: normalized.id.startsWith('task-') ? undefined : normalized.id,
    tribe_id: tribeId,
    title: normalized.title,
    category: normalized.category,
    priority: normalized.priority,
    assigned_label: normalized.assignedTo,
    due_label: normalized.due,
    created_by: userId,
    done: normalized.done,
    items: normalized.items,
    updated_at: new Date().toISOString(),
  };
}

function localActorName() {
  const account = loadAccount();
  return account.displayName || account.email || 'Local survivor';
}

function normalizeActivity(entry = {}) {
  return {
    id: entry.id || `activity-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: entry.type || 'info',
    actor: entry.actor || localActorName(),
    message: entry.message || '',
    taskTitle: entry.taskTitle || '',
    createdAt: entry.createdAt || new Date().toISOString(),
  };
}

function activityRowToEntry(row) {
  return normalizeActivity({
    id: row.id,
    type: row.type,
    actor: row.actor_label,
    message: row.message,
    taskTitle: row.task_title,
    createdAt: row.created_at,
  });
}

export function loadLocalTribeState() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_TRIBE_KEY) || '{}');
  } catch {
    return {};
  }
}

export function saveLocalTribeState(state) {
  localStorage.setItem(LOCAL_TRIBE_KEY, JSON.stringify({ ...state, updated: Date.now() }));
  return state;
}

export function getLocalTribeRole() {
  const account = loadAccount();
  if (account.hostedTribeId || account.userId) return 'owner';
  return 'owner';
}

export async function createHostedTribe({ name, ownerId, ownerName }) {
  if (hasCloudSession()) {
    const result = await createCloudTribe({ name });
    const tribe = result.tribe || result;
    saveAccount({ ...loadAccount(), tribeName: tribe.name, tribeCode: tribe.invite_code, hostedTribeId: tribe.id, authProvider: 'cloudflare' });
    return tribe;
  }

  if (!isSupabaseConfigured || !supabase) {
    const code = `LOCAL-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const local = saveLocalTribeState({
      tribeName: name,
      tribeCode: code,
      cloudMode: 'local',
      members: [ownerName || 'Survivor'],
      tasks: [],
      updated: Date.now(),
    });
    saveAccount({ ...loadAccount(), tribeName: name, tribeCode: code });
    return local;
  }

  const inviteCode = Math.random().toString(36).slice(2, 8).toUpperCase();
  const { data: tribe, error: tribeError } = await supabase
    .from('tribes')
    .insert({
      name,
      owner_id: ownerId,
      invite_code: inviteCode,
    })
    .select()
    .single();
  if (tribeError) throw tribeError;

  const { error: memberError } = await supabase.from('tribe_members').insert({
    tribe_id: tribe.id,
    user_id: ownerId,
    display_name: ownerName || 'Survivor',
    role: 'owner',
  });
  if (memberError) throw memberError;

  saveAccount({ ...loadAccount(), tribeName: tribe.name, tribeCode: tribe.invite_code, hostedTribeId: tribe.id });
  return tribe;
}

export async function joinHostedTribe({ inviteCode, userId, displayName }) {
  if (hasCloudSession()) {
    const result = await joinCloudTribe({ inviteCode, displayName });
    const tribe = result.tribe || result;
    saveAccount({ ...loadAccount(), tribeName: tribe.name, tribeCode: tribe.invite_code, hostedTribeId: tribe.id, authProvider: 'cloudflare' });
    return tribe;
  }

  if (!isSupabaseConfigured || !supabase) {
    const account = saveAccount({ ...loadAccount(), tribeCode: inviteCode.toUpperCase() });
    return { tribeCode: account.tribeCode, cloudMode: 'local' };
  }

  const { data: tribe, error } = await supabase.rpc('join_tribe_by_code', {
    invite: inviteCode.toUpperCase(),
    member_name: displayName || 'Survivor',
  });
  if (error) throw error;

  const joined = Array.isArray(tribe) ? tribe[0] : tribe;
  saveAccount({ ...loadAccount(), tribeName: joined.name, tribeCode: joined.invite_code, hostedTribeId: joined.id });
  return joined;
}

export async function saveHostedTribeTasks({ tribeId, tasks }) {
  if (!isSupabaseConfigured || !supabase || !tribeId) {
    const state = loadLocalTribeState();
    return saveLocalTribeState({ ...state, tasks: tasks || [] });
  }

  const { error } = await supabase.from('tribe_snapshots').upsert({
    tribe_id: tribeId,
    kind: 'tasks',
    payload: { tasks: tasks || [] },
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
  return { ok: true };
}

export async function loadHostedTribeTasks({ tribeId }) {
  if (hasCloudSession() && tribeId) {
    return loadCloudTribeTasks({ tribeId });
  }

  if (!isSupabaseConfigured || !supabase || !tribeId) {
    return loadLocalTribeState().tasks || [];
  }

  const { data, error } = await supabase
    .from('tribe_tasks')
    .select('*')
    .eq('tribe_id', tribeId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(rowToTask);
}

export async function createTribeTask({ tribeId, task }) {
  const normalized = normalizeTask(task);
  if (hasCloudSession() && tribeId) {
    return createCloudTribeTask({ tribeId, task: normalized });
  }

  if (!isSupabaseConfigured || !supabase || !tribeId) {
    const state = loadLocalTribeState();
    const tasks = [normalized, ...(state.tasks || [])];
    saveLocalTribeState({ ...state, tasks });
    return normalized;
  }

  const account = loadAccount();
  if (!account.userId) throw new Error('Login required before creating cloud tasks.');

  const { data, error } = await supabase
    .from('tribe_tasks')
    .insert(taskToRow(normalized, { tribeId, userId: account.userId }))
    .select()
    .single();
  if (error) throw error;
  return rowToTask(data);
}

export async function updateTribeTask({ tribeId, task }) {
  const normalized = normalizeTask(task);
  if (hasCloudSession() && tribeId) {
    return updateCloudTribeTask({ tribeId, task: normalized });
  }

  if (!isSupabaseConfigured || !supabase || !tribeId) {
    const state = loadLocalTribeState();
    const tasks = (state.tasks || []).map(existing => existing.id === normalized.id ? normalized : existing);
    saveLocalTribeState({ ...state, tasks });
    return normalized;
  }

  const { data, error } = await supabase
    .from('tribe_tasks')
    .update({
      title: normalized.title,
      category: normalized.category,
      priority: normalized.priority,
      assigned_label: normalized.assignedTo,
      due_label: normalized.due,
      done: normalized.done,
      items: normalized.items,
      updated_at: new Date().toISOString(),
    })
    .eq('id', normalized.id)
    .eq('tribe_id', tribeId)
    .select()
    .single();
  if (error) throw error;
  return rowToTask(data);
}

export async function deleteTribeTask({ tribeId, taskId }) {
  if (hasCloudSession() && tribeId) {
    return deleteCloudTribeTask({ tribeId, taskId });
  }

  if (!isSupabaseConfigured || !supabase || !tribeId) {
    const state = loadLocalTribeState();
    const tasks = (state.tasks || []).filter(task => task.id !== taskId);
    saveLocalTribeState({ ...state, tasks });
    return { ok: true };
  }

  const { error } = await supabase
    .from('tribe_tasks')
    .delete()
    .eq('id', taskId)
    .eq('tribe_id', tribeId);
  if (error) throw error;
  return { ok: true };
}

export async function loadTribeActivity({ tribeId, limit = 24 } = {}) {
  if (hasCloudSession() && tribeId) {
    return loadCloudTribeActivity({ tribeId, limit });
  }

  if (!isSupabaseConfigured || !supabase || !tribeId) {
    return (loadLocalTribeState().activityLog || []).slice(0, limit);
  }

  const { data, error } = await supabase
    .from('tribe_activity')
    .select('*')
    .eq('tribe_id', tribeId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []).map(activityRowToEntry);
}

export async function recordTribeActivity({ tribeId, type, message, taskTitle }) {
  const entry = normalizeActivity({ type, message, taskTitle });
  if (hasCloudSession() && tribeId) {
    return recordCloudTribeActivity({ tribeId, type: entry.type, message: entry.message, taskTitle: entry.taskTitle });
  }

  if (!isSupabaseConfigured || !supabase || !tribeId) {
    const state = loadLocalTribeState();
    const activityLog = [entry, ...(state.activityLog || [])].slice(0, 48);
    saveLocalTribeState({ ...state, activityLog });
    return entry;
  }

  const account = loadAccount();
  const { data, error } = await supabase
    .from('tribe_activity')
    .insert({
      tribe_id: tribeId,
      actor_id: account.userId || null,
      actor_label: account.displayName || account.email || 'Survivor',
      type: entry.type,
      message: entry.message,
      task_title: entry.taskTitle,
    })
    .select()
    .single();
  if (error) throw error;
  return activityRowToEntry(data);
}

export function subscribeToTribeActivity({ tribeId, onChange }) {
  if (hasCloudSession()) return () => {};
  if (!isSupabaseConfigured || !supabase || !tribeId) return () => {};
  const channel = supabase
    .channel(`tribe-activity:${tribeId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'tribe_activity', filter: `tribe_id=eq.${tribeId}` },
      () => {
        loadTribeActivity({ tribeId }).then(onChange).catch(() => {});
      },
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

export async function loadCurrentTribeRole({ tribeId }) {
  const account = loadAccount();
  if (hasCloudSession() && tribeId) {
    return loadCloudTribeRole({ tribeId });
  }

  if (!isSupabaseConfigured || !supabase || !tribeId || !account.userId) {
    return getLocalTribeRole();
  }

  const { data, error } = await supabase
    .from('tribe_members')
    .select('role')
    .eq('tribe_id', tribeId)
    .eq('user_id', account.userId)
    .maybeSingle();
  if (error) throw error;
  return data?.role || 'member';
}

export function subscribeToTribeTasks({ tribeId, onChange }) {
  if (hasCloudSession()) return () => {};
  if (!isSupabaseConfigured || !supabase || !tribeId) return () => {};
  const channel = supabase
    .channel(`tribe-tasks:${tribeId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'tribe_tasks', filter: `tribe_id=eq.${tribeId}` },
      () => {
        loadHostedTribeTasks({ tribeId }).then(onChange).catch(() => {});
      },
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
