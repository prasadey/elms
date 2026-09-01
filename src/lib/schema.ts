export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL DEFAULT 'Password123!',
  role TEXT NOT NULL CHECK(role IN ('EMPLOYEE','MANAGER','HR')),
  department TEXT,
  manager_id INTEGER REFERENCES users(id),
  date_of_joining TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE','INACTIVE')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS leave_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  annual_quota REAL,
  accrual_rule TEXT,
  carry_forward_cap REAL,
  requires_document INTEGER NOT NULL DEFAULT 0,
  half_day_allowed INTEGER NOT NULL DEFAULT 0,
  backdate_days INTEGER NOT NULL DEFAULT 0,
  min_notice_days INTEGER NOT NULL DEFAULT 0,
  min_unit REAL NOT NULL DEFAULT 0.5,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS leave_balances (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  leave_type_id INTEGER NOT NULL REFERENCES leave_types(id),
  leave_year INTEGER NOT NULL,
  entitled REAL NOT NULL DEFAULT 0,
  used REAL NOT NULL DEFAULT 0,
  on_hold REAL NOT NULL DEFAULT 0,
  adjusted REAL NOT NULL DEFAULT 0,
  UNIQUE(user_id, leave_type_id, leave_year)
);

CREATE TABLE IF NOT EXISTS leave_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_ref TEXT NOT NULL UNIQUE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  leave_type_id INTEGER NOT NULL REFERENCES leave_types(id),
  from_date TEXT NOT NULL,
  to_date TEXT NOT NULL,
  half_day_flag TEXT NOT NULL DEFAULT 'NONE' CHECK(half_day_flag IN ('NONE','FIRST_HALF','SECOND_HALF')),
  working_days REAL NOT NULL,
  reason TEXT NOT NULL,
  contact_number TEXT,
  attachment_name TEXT,
  converted_to_lop INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK(status IN ('PENDING_MANAGER','PENDING_HR','APPROVED','REJECTED','CANCELLED','REVOKED')),
  single_stage INTEGER NOT NULL DEFAULT 0,
  approver_stage1_id INTEGER REFERENCES users(id),
  approver_stage2_id INTEGER REFERENCES users(id),
  submitted_at TEXT NOT NULL DEFAULT (datetime('now')),
  decided_at TEXT
);

CREATE TABLE IF NOT EXISTS approvals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id INTEGER NOT NULL REFERENCES leave_requests(id),
  stage TEXT NOT NULL CHECK(stage IN ('MANAGER','HR')),
  approver_id INTEGER NOT NULL REFERENCES users(id),
  decision TEXT NOT NULL CHECK(decision IN ('APPROVED','REJECTED','REVOKED')),
  comment TEXT,
  decided_at TEXT NOT NULL DEFAULT (datetime('now')),
  delegated INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS holidays (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  name TEXT NOT NULL,
  applies_to TEXT NOT NULL DEFAULT 'all'
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  request_id INTEGER REFERENCES leave_requests(id),
  template_key TEXT NOT NULL,
  channel TEXT NOT NULL CHECK(channel IN ('EMAIL','IN_APP')),
  payload TEXT NOT NULL,
  sent_at TEXT NOT NULL DEFAULT (datetime('now')),
  read_at TEXT
);

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL,
  entity_id INTEGER NOT NULL,
  actor_id INTEGER,
  actor_role TEXT,
  action TEXT NOT NULL,
  before_state TEXT,
  after_state TEXT,
  comment TEXT,
  ip TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_requests_user ON leave_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id);
`;
