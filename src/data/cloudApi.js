class CloudApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = 'CloudApiError';
    this.status = status;
  }
}

function normalizeBaseUrl(value) {
  return String(value || '').replace(/\/+$/, '');
}

export function getBackendConfig() {
  const env = import.meta.env || {};
  const apiBase = normalizeBaseUrl(env.VITE_OVERSEER_API_URL);
  return {
    apiBase,
    configured: Boolean(apiBase),
    survivorPriceId: env.VITE_STRIPE_PRICE_SURVIVOR || '',
    tribePriceId: env.VITE_STRIPE_PRICE_TRIBE || '',
  };
}

async function requestJson(path, options = {}) {
  const config = getBackendConfig();
  if (!config.configured) {
    throw new CloudApiError('Backend API is not configured. Set VITE_OVERSEER_API_URL in .env.local.');
  }

  const response = await fetch(`${config.apiBase}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
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

export function syncSnapshot(snapshot) {
  return requestJson('/sync/snapshot', {
    method: 'POST',
    body: JSON.stringify(snapshot),
  });
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
