import { loadLibrary, loadRaisingTimers, loadSettings } from './statExtractor';

export const ACCOUNT_KEY = 'overseer-account-state-v1';

export const PLAN_CATALOG = {
  free: {
    id: 'free',
    name: 'Free',
    price: '0 EUR',
    cadence: 'local only',
    libraryLimit: 80,
    tribeSeats: 1,
    cloudSync: false,
    notifications: false,
    prioritySupport: false,
  },
  survivor: {
    id: 'survivor',
    name: 'Survivor',
    price: '4.99 EUR',
    cadence: 'per month',
    libraryLimit: 800,
    tribeSeats: 1,
    cloudSync: true,
    notifications: true,
    prioritySupport: false,
  },
  tribe: {
    id: 'tribe',
    name: 'Tribe',
    price: '11.99 EUR',
    cadence: 'per month',
    libraryLimit: 5000,
    tribeSeats: 12,
    cloudSync: true,
    notifications: true,
    prioritySupport: true,
  },
};

const DEFAULT_ACCOUNT = {
  userId: '',
  email: '',
  displayName: '',
  avatarUrl: '',
  planId: 'free',
  billingStatus: 'local-preview',
  tribeName: '',
  tribeCode: '',
  hostedTribeId: '',
  authProvider: 'local',
  lastSyncAt: '',
};

export function loadAccount() {
  try {
    return { ...DEFAULT_ACCOUNT, ...(JSON.parse(localStorage.getItem(ACCOUNT_KEY) || '{}')) };
  } catch {
    return DEFAULT_ACCOUNT;
  }
}

export function saveAccount(account) {
  const next = { ...DEFAULT_ACCOUNT, ...account };
  localStorage.setItem(ACCOUNT_KEY, JSON.stringify(next));
  return next;
}

export function getActivePlan(account = loadAccount()) {
  return PLAN_CATALOG[account.planId] || PLAN_CATALOG.free;
}

export function buildLocalSyncSnapshot(account = loadAccount()) {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    account: {
      email: account.email,
      displayName: account.displayName,
      avatarUrl: account.avatarUrl,
      userId: account.userId,
      planId: account.planId,
      tribeName: account.tribeName,
      tribeCode: account.tribeCode,
      hostedTribeId: account.hostedTribeId,
    },
    settings: loadSettings(),
    library: loadLibrary(),
    raisingTimers: loadRaisingTimers(),
  };
}

export function calculateUsage(account = loadAccount()) {
  const plan = getActivePlan(account);
  const library = loadLibrary();
  const timers = loadRaisingTimers();
  return {
    plan,
    libraryCount: library.length,
    libraryLimit: plan.libraryLimit,
    libraryPct: Math.min(100, Math.round((library.length / Math.max(plan.libraryLimit, 1)) * 100)),
    timerCount: timers.length,
    cloudReady: Boolean(account.email && plan.cloudSync),
    authReady: Boolean(account.userId || account.email),
  };
}
