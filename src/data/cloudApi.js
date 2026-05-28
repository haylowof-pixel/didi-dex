class CloudApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = 'CloudApiError';
    this.status = status;
  }
}

const CLOUD_TOKEN_KEY = 'overseer-cloud-token-v1';

function normalizeBaseUrl(value) {
  return String(value || '').replace(/\/+$/, '');
}

export function getBackendConfig() {
  const env = import.meta.env || {};
  const apiBase = normalizeBaseUrl(env.VITE_OVERSEER_API_URL);
  return {
    apiBase,
    configured: Boolean(apiBase),
    authProvider: env.VITE_OVERSEER_AUTH_PROVIDER || (apiBase ? 'cloudflare' : ''),
    survivorPriceId: env.VITE_STRIPE_PRICE_SURVIVOR || '',
    tribePriceId: env.VITE_STRIPE_PRICE_TRIBE || '',
  };
}

export function getCloudToken() {
  try {
    return localStorage.getItem(CLOUD_TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export function hasCloudSession() {
  return Boolean(getBackendConfig().configured && getCloudToken());
}

export function saveCloudToken(token) {
  if (!token) return;
  localStorage.setItem(CLOUD_TOKEN_KEY, token);
}

export function clearCloudToken() {
  localStorage.removeItem(CLOUD_TOKEN_KEY);
}

async function requestJson(path, options = {}) {
  const config = getBackendConfig();
  if (!config.configured) {
    throw new CloudApiError('Backend API is not configured. Set VITE_OVERSEER_API_URL in .env.local.');
  }
  const token = getCloudToken();
  const authHeaders = options.auth === false || !token ? {} : { Authorization: `Bearer ${token}` };

  const response = await fetch(`${config.apiBase}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...(options.headers || {}),
    },
  });

  let body = null;
  try {
    body = await response.json();
  } catch {}

  if (!response.ok) {
    throw new CloudApiError(body?.message || `Backend request failed (${response.status})`, response.status);
  }

  return body || {};
}

export async function registerCloudAccount({ email, password, displayName, avatarUrl }) {
  const result = await requestJson('/auth/register', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ email, password, displayName, avatarUrl }),
  });
  if (result.token) saveCloudToken(result.token);
  return result;
}

export async function loginCloudAccount({ email, password }) {
  const result = await requestJson('/auth/login', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ email, password }),
  });
  if (result.token) saveCloudToken(result.token);
  return result;
}

export async function logoutCloudAccount() {
  try {
    await requestJson('/auth/logout', { method: 'POST' });
  } finally {
    clearCloudToken();
  }
}

export function getCloudAccount() {
  return requestJson('/account');
}

export function updateCloudProfile({ displayName, avatarUrl }) {
  return requestJson('/account', {
    method: 'PATCH',
    body: JSON.stringify({ displayName, avatarUrl }),
  });
}

export function syncSnapshot(snapshot) {
  return requestJson('/sync/snapshot', {
    method: 'POST',
    body: JSON.stringify(snapshot),
  });
}

export function createCloudTribe({ name }) {
  return requestJson('/tribes', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export function joinCloudTribe({ inviteCode, displayName }) {
  return requestJson('/tribes/join', {
    method: 'POST',
    body: JSON.stringify({ inviteCode, displayName }),
  });
}

export async function loadCloudTribeTasks({ tribeId }) {
  const result = await requestJson(`/tribes/${encodeURIComponent(tribeId)}/tasks`);
  return result.tasks || [];
}

export async function createCloudTribeTask({ tribeId, task }) {
  const result = await requestJson(`/tribes/${encodeURIComponent(tribeId)}/tasks`, {
    method: 'POST',
    body: JSON.stringify(task),
  });
  return result.task;
}

export async function updateCloudTribeTask({ tribeId, task }) {
  const result = await requestJson(`/tribes/${encodeURIComponent(tribeId)}/tasks/${encodeURIComponent(task.id)}`, {
    method: 'PATCH',
    body: JSON.stringify(task),
  });
  return result.task;
}

export function deleteCloudTribeTask({ tribeId, taskId }) {
  return requestJson(`/tribes/${encodeURIComponent(tribeId)}/tasks/${encodeURIComponent(taskId)}`, {
    method: 'DELETE',
  });
}

export async function loadCloudTribeActivity({ tribeId, limit = 24 }) {
  const result = await requestJson(`/tribes/${encodeURIComponent(tribeId)}/activity?limit=${encodeURIComponent(limit)}`);
  return result.activity || [];
}

export async function recordCloudTribeActivity({ tribeId, type, message, taskTitle }) {
  const result = await requestJson(`/tribes/${encodeURIComponent(tribeId)}/activity`, {
    method: 'POST',
    body: JSON.stringify({ type, message, taskTitle }),
  });
  return result.activity;
}

export async function loadCloudTribeRole({ tribeId }) {
  const result = await requestJson(`/tribes/${encodeURIComponent(tribeId)}/role`);
  return result.role || 'member';
}

export function createCheckoutSession({ planId, account, successUrl, cancelUrl }) {
  return requestJson('/billing/create-checkout-session', {
    method: 'POST',
    body: JSON.stringify({
      planId,
      email: account.email,
      displayName: account.displayName,
      tribeName: account.tribeName,
      successUrl,
      cancelUrl,
    }),
  });
}

export function createCustomerPortal({ account, returnUrl }) {
  return requestJson('/billing/create-portal-session', {
    method: 'POST',
    body: JSON.stringify({
      email: account.email,
      returnUrl,
    }),
  });
}
