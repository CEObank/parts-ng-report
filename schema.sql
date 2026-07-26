-- Schema for the Operation Excellence - Parts NG Report System (Cloudflare D1)

CREATE TABLE IF NOT EXISTS users (
  username TEXT PRIMARY KEY,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  display_name TEXT NOT NULL,
  team TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'user',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS authorized_users (
  username TEXT PRIMARY KEY,
  note TEXT,
  team TEXT NOT NULL,
  registered INTEGER NOT NULL DEFAULT 0,
  added_at TEXT NOT NULL,
  registered_at TEXT
);

CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reporter TEXT NOT NULL,
  team TEXT NOT NULL,
  report_date TEXT NOT NULL,
  work_order_no TEXT,
  production_no TEXT,
  part_no TEXT,
  part_name TEXT,
  quantity INTEGER NOT NULL,
  status TEXT NOT NULL,
  detail TEXT,
  photo_data_url TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reports_date ON reports(report_date);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_username ON sessions(username);
