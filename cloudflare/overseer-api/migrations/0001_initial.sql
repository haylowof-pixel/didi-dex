CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT NOT NULL DEFAULT '',
  plan_id TEXT NOT NULL DEFAULT 'free',
  billing_status TEXT NOT NULL DEFAULT 'free',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tribes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  invite_code TEXT NOT NULL UNIQUE,
  owner_account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tribe_members (
  tribe_id TEXT NOT NULL REFERENCES tribes(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  display_name TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (tribe_id, account_id)
);

CREATE TABLE IF NOT EXISTS tribe_tasks (
  id TEXT PRIMARY KEY,
  tribe_id TEXT NOT NULL REFERENCES tribes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'base',
  priority TEXT NOT NULL DEFAULT 'normal',
  assigned_label TEXT NOT NULL DEFAULT '',
  due_label TEXT NOT NULL DEFAULT 'Next run',
  done INTEGER NOT NULL DEFAULT 0,
  items TEXT NOT NULL DEFAULT '[]',
  created_by TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tribe_activity (
  id TEXT PRIMARY KEY,
  tribe_id TEXT NOT NULL REFERENCES tribes(id) ON DELETE CASCADE,
  actor_id TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  actor_label TEXT NOT NULL DEFAULT 'Survivor',
  type TEXT NOT NULL DEFAULT 'info',
  message TEXT NOT NULL DEFAULT '',
  task_title TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sync_snapshots (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  tribe_id TEXT REFERENCES tribes(id) ON DELETE SET NULL,
  payload TEXT NOT NULL,
  exported_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sessions_hash ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_account ON sessions(account_id);
CREATE INDEX IF NOT EXISTS idx_tribe_tasks_tribe ON tribe_tasks(tribe_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tribe_activity_tribe ON tribe_activity(tribe_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_snapshots_account ON sync_snapshots(account_id, created_at DESC);
