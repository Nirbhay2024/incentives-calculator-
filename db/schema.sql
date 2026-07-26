-- Incentives Calculator — D1 schema
-- Run once per database: wrangler d1 execute <DB_NAME> --remote --file=db/schema.sql

CREATE TABLE IF NOT EXISTS schemes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  channel TEXT,
  start_date TEXT,
  end_date TEXT,
  status TEXT NOT NULL DEFAULT 'Active',
  version TEXT,
  is_active INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  base_model TEXT,
  model TEXT NOT NULL,
  category TEXT NOT NULL,
  series TEXT,
  sub_category TEXT,
  flagship INTEGER NOT NULL DEFAULT 0,
  dp_slab TEXT,
  dp INTEGER,
  status TEXT NOT NULL DEFAULT 'Active',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

CREATE TABLE IF NOT EXISTS rules (
  id TEXT PRIMARY KEY,
  scheme_id TEXT NOT NULL,
  type TEXT NOT NULL,
  category TEXT,
  segment TEXT,
  model TEXT,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'Active',
  data TEXT NOT NULL DEFAULT '{}', -- JSON blob of type-specific fields (slabs, grid, flatRewards, ...)
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rules_scheme ON rules(scheme_id);
CREATE INDEX IF NOT EXISTS idx_rules_type ON rules(type);

-- Single-row table holding the admin password hash (bootstrap-seeded, changeable via API)
CREATE TABLE IF NOT EXISTS admin_config (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  password_hash TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Server-side, revocable admin sessions (opaque token, not a client-forgeable JWT)
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- Per-IP login rate limiting (server-enforced, cannot be bypassed by clearing browser storage)
CREATE TABLE IF NOT EXISTS login_attempts (
  ip TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL DEFAULT 0,
  lock_until INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);
