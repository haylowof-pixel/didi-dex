const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
};

function corsHeaders(env) {
  return {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

function json(data, status = 200, env = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...JSON_HEADERS, ...corsHeaders(env) },
  });
}

function error(message, status = 400, env = {}) {
  return json({ ok: false, message }, status, env);
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

function uuid() {
  return crypto.randomUUID();
}

function base64url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function randomToken(byteLength = 32) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return base64url(bytes);
}

async function sha256(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return base64url(new Uint8Array(digest));
}

async function hashPassword(password, encodedSalt = '') {
  const iterations = 160000;
  const salt = encodedSalt || randomToken(18);
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: new TextEncoder().encode(salt),
      iterations,
    },
    keyMaterial,
    256,
  );
  return `pbkdf2-sha256$${iterations}$${salt}$${base64url(new Uint8Array(bits))}`;
}

async function verifyPassword(password, stored) {
  const [, , salt, expected] = String(stored || '').split('$');
  if (!salt || !expected) return false;
  const actual = await hashPassword(password, salt);
  return actual === stored;
}

function publicAccount(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.id,
    email: row.email,
    displayName: row.display_name || '',
    avatarUrl: row.avatar_url || '',
    planId: row.plan_id || 'free',
    billingStatus: row.billing_status || 'free',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function normalizeTask(input = {}) {
  return {
    id: input.id || `task-${uuid()}`,
    title: String(input.title || 'Untitled task').slice(0, 180),
    category: String(input.category || 'base').slice(0, 40),
    priority: String(input.priority || 'normal').slice(0, 40),
    assignedTo: String(input.assignedTo || input.assigned_label || '').slice(0, 80),
    due: String(input.due || input.due_label || 'Next run').slice(0, 80),
    done: Boolean(input.done),
    items: Array.isArray(input.items) ? input.items : [],
    createdAt: input.createdAt || input.created_at,
    updatedAt: input.updatedAt || input.updated_at,
  };
}

function rowToTask(row) {
  let items = [];
  try {
    items = JSON.parse(row.items || '[]');
  } catch {}
  return normalizeTask({
    id: row.id,
    title: row.title,
    category: row.category,
    priority: row.priority,
    assigned_label: row.assigned_label,
    due_label: row.due_label,
    done: Boolean(row.done),
    items,
    created_at: row.created_at,
    updated_at: row.updated_at,
  });
}

async function requireUser(request, env) {
  const header = request.headers.get('Authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) return null;
  const tokenHash = await sha256(token);
  const row = await env.DB.prepare(`
    SELECT accounts.*
    FROM sessions
    JOIN accounts ON accounts.id = sessions.account_id
    WHERE sessions.token_hash = ? AND sessions.expires_at > datetime('now')
  `).bind(tokenHash).first();
  return row || null;
}

async function createSession(env, accountId) {
  const token = randomToken(36);
  const tokenHash = await sha256(token);
  const days = Number(env.SESSION_DAYS || 30);
  const expiresAt = new Date(Date.now() + days * 86400000).toISOString();
  await env.DB.prepare(`
    INSERT INTO sessions (id, account_id, token_hash, expires_at)
    VALUES (?, ?, ?, ?)
  `).bind(uuid(), accountId, tokenHash, expiresAt).run();
  return { token, expiresAt };
}

async function assertTribeMember(env, tribeId, accountId) {
  const row = await env.DB.prepare(`
    SELECT role FROM tribe_members WHERE tribe_id = ? AND account_id = ?
  `).bind(tribeId, accountId).first();
  return row || null;
}

async function handleAuth(path, request, env) {
  const body = await readJson(request);
  if (path === '/auth/register') {
    const email = normalizeEmail(body.email);
    const password = String(body.password || '');
    if (!email.includes('@')) return error('Email invalide.', 422, env);
    if (password.length < 8) return error('Mot de passe trop court: 8 caracteres minimum.', 422, env);
    const id = uuid();
    const passwordHash = await hashPassword(password);
    try {
      await env.DB.prepare(`
        INSERT INTO accounts (id, email, password_hash, display_name, avatar_url, billing_status)
        VALUES (?, ?, ?, ?, ?, 'signed-in')
      `).bind(id, email, passwordHash, body.displayName || '', body.avatarUrl || '').run();
    } catch {
      return error('Un compte existe deja avec cet email.', 409, env);
    }
    const account = await env.DB.prepare('SELECT * FROM accounts WHERE id = ?').bind(id).first();
    const session = await createSession(env, id);
    return json({ ok: true, account: publicAccount(account), ...session }, 201, env);
  }

  if (path === '/auth/login') {
    const email = normalizeEmail(body.email);
    const account = await env.DB.prepare('SELECT * FROM accounts WHERE email = ?').bind(email).first();
    if (!account || !(await verifyPassword(String(body.password || ''), account.password_hash))) {
      return error('Email ou mot de passe invalide.', 401, env);
    }
    const session = await createSession(env, account.id);
    return json({ ok: true, account: publicAccount(account), ...session }, 200, env);
  }

  return null;
}

async function handleRequest(request, env) {
  if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders(env) });
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';

  if (path === '/health') return json({ ok: true, service: 'overseer-api', at: new Date().toISOString() }, 200, env);

  if (path.startsWith('/auth/') && (path === '/auth/register' || path === '/auth/login')) {
    return handleAuth(path, request, env);
  }

  const account = await requireUser(request, env);
  if (!account) return error('Authentication required.', 401, env);

  if (path === '/auth/logout' && request.method === 'POST') {
    const token = (request.headers.get('Authorization') || '').slice(7).trim();
    await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha256(token)).run();
    return json({ ok: true }, 200, env);
  }

  if (path === '/account' && request.method === 'GET') {
    return json({ ok: true, account: publicAccount(account) }, 200, env);
  }

  if (path === '/account' && request.method === 'PATCH') {
    const body = await readJson(request);
    await env.DB.prepare(`
      UPDATE accounts
      SET display_name = ?, avatar_url = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(body.displayName || account.display_name || '', body.avatarUrl || account.avatar_url || '', account.id).run();
    const updated = await env.DB.prepare('SELECT * FROM accounts WHERE id = ?').bind(account.id).first();
    return json({ ok: true, account: publicAccount(updated) }, 200, env);
  }

  if (path === '/tribes' && request.method === 'POST') {
    const body = await readJson(request);
    const name = String(body.name || '').trim();
    if (!name) return error('Nom de tribu requis.', 422, env);
    const tribeId = uuid();
    const inviteCode = randomToken(5).toUpperCase();
    await env.DB.batch([
      env.DB.prepare(`
        INSERT INTO tribes (id, name, invite_code, owner_account_id)
        VALUES (?, ?, ?, ?)
      `).bind(tribeId, name, inviteCode, account.id),
      env.DB.prepare(`
        INSERT INTO tribe_members (tribe_id, account_id, role, display_name)
        VALUES (?, ?, 'owner', ?)
      `).bind(tribeId, account.id, account.display_name || account.email),
    ]);
    return json({ ok: true, tribe: { id: tribeId, name, invite_code: inviteCode, role: 'owner' } }, 201, env);
  }

  if (path === '/tribes/join' && request.method === 'POST') {
    const body = await readJson(request);
    const invite = String(body.inviteCode || body.invite || '').trim().toUpperCase();
    const tribe = await env.DB.prepare('SELECT * FROM tribes WHERE invite_code = ?').bind(invite).first();
    if (!tribe) return error('Invite code invalide.', 404, env);
    await env.DB.prepare(`
      INSERT OR REPLACE INTO tribe_members (tribe_id, account_id, role, display_name)
      VALUES (?, ?, COALESCE((SELECT role FROM tribe_members WHERE tribe_id = ? AND account_id = ?), 'member'), ?)
    `).bind(tribe.id, account.id, tribe.id, account.id, body.displayName || account.display_name || account.email).run();
    return json({ ok: true, tribe: { id: tribe.id, name: tribe.name, invite_code: tribe.invite_code, role: 'member' } }, 200, env);
  }

  const taskMatch = path.match(/^\/tribes\/([^/]+)\/tasks(?:\/([^/]+))?$/);
  if (taskMatch) {
    const [, tribeId, taskId] = taskMatch;
    const member = await assertTribeMember(env, tribeId, account.id);
    if (!member) return error('Acces tribu refuse.', 403, env);

    if (request.method === 'GET' && !taskId) {
      const { results } = await env.DB.prepare(`
        SELECT * FROM tribe_tasks WHERE tribe_id = ? ORDER BY created_at DESC
      `).bind(tribeId).all();
      return json({ ok: true, tasks: (results || []).map(rowToTask) }, 200, env);
    }

    if (request.method === 'POST' && !taskId) {
      const task = normalizeTask(await readJson(request));
      await env.DB.prepare(`
        INSERT INTO tribe_tasks (id, tribe_id, title, category, priority, assigned_label, due_label, done, items, created_by, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(task.id, tribeId, task.title, task.category, task.priority, task.assignedTo, task.due, task.done ? 1 : 0, JSON.stringify(task.items), account.id).run();
      return json({ ok: true, task }, 201, env);
    }

    if (request.method === 'PATCH' && taskId) {
      const task = normalizeTask({ ...(await readJson(request)), id: taskId });
      await env.DB.prepare(`
        UPDATE tribe_tasks
        SET title = ?, category = ?, priority = ?, assigned_label = ?, due_label = ?, done = ?, items = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND tribe_id = ?
      `).bind(task.title, task.category, task.priority, task.assignedTo, task.due, task.done ? 1 : 0, JSON.stringify(task.items), taskId, tribeId).run();
      return json({ ok: true, task }, 200, env);
    }

    if (request.method === 'DELETE' && taskId) {
      await env.DB.prepare('DELETE FROM tribe_tasks WHERE id = ? AND tribe_id = ?').bind(taskId, tribeId).run();
      return json({ ok: true }, 200, env);
    }
  }

  const activityMatch = path.match(/^\/tribes\/([^/]+)\/activity$/);
  if (activityMatch) {
    const tribeId = activityMatch[1];
    const member = await assertTribeMember(env, tribeId, account.id);
    if (!member) return error('Acces tribu refuse.', 403, env);
    if (request.method === 'GET') {
      const limit = Math.min(Number(url.searchParams.get('limit') || 24), 80);
      const { results } = await env.DB.prepare(`
        SELECT * FROM tribe_activity WHERE tribe_id = ? ORDER BY created_at DESC LIMIT ?
      `).bind(tribeId, limit).all();
      return json({
        ok: true,
        activity: (results || []).map(row => ({
          id: row.id,
          type: row.type,
          actor: row.actor_label,
          message: row.message,
          taskTitle: row.task_title,
          createdAt: row.created_at,
        })),
      }, 200, env);
    }
    if (request.method === 'POST') {
      const body = await readJson(request);
      const entry = {
        id: uuid(),
        type: body.type || 'info',
        message: body.message || '',
        taskTitle: body.taskTitle || '',
      };
      await env.DB.prepare(`
        INSERT INTO tribe_activity (id, tribe_id, actor_id, actor_label, type, message, task_title)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(entry.id, tribeId, account.id, account.display_name || account.email, entry.type, entry.message, entry.taskTitle).run();
      return json({ ok: true, activity: { ...entry, actor: account.display_name || account.email, createdAt: new Date().toISOString() } }, 201, env);
    }
  }

  const roleMatch = path.match(/^\/tribes\/([^/]+)\/role$/);
  if (roleMatch && request.method === 'GET') {
    const member = await assertTribeMember(env, roleMatch[1], account.id);
    if (!member) return error('Acces tribu refuse.', 403, env);
    return json({ ok: true, role: member.role || 'member' }, 200, env);
  }

  if (path === '/sync/snapshot' && request.method === 'POST') {
    const snapshot = await readJson(request);
    const id = uuid();
    await env.DB.prepare(`
      INSERT INTO sync_snapshots (id, account_id, tribe_id, payload, exported_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(id, account.id, snapshot.account?.hostedTribeId || null, JSON.stringify(snapshot), snapshot.exportedAt || null).run();
    return json({ ok: true, id, syncedAt: new Date().toISOString() }, 201, env);
  }

  if (path === '/sync/latest' && request.method === 'GET') {
    const row = await env.DB.prepare(`
      SELECT * FROM sync_snapshots WHERE account_id = ? ORDER BY created_at DESC LIMIT 1
    `).bind(account.id).first();
    return json({ ok: true, snapshot: row ? JSON.parse(row.payload) : null }, 200, env);
  }

  if (path.startsWith('/billing/')) {
    return error('Billing endpoint not enabled in the Cloudflare free MVP yet.', 501, env);
  }

  return error('Not found.', 404, env);
}

export default {
  async fetch(request, env) {
    try {
      return await handleRequest(request, env);
    } catch (err) {
      return error(err?.message || 'Internal error.', 500, env);
    }
  },
};
