import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.js';

fs.mkdirSync(path.dirname(config.paths.db), { recursive: true });
fs.mkdirSync(config.paths.uploads, { recursive: true });

export const db = new Database(config.paths.db);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    fullname    TEXT    NOT NULL,
    email       TEXT    NOT NULL UNIQUE,
    password    TEXT    NOT NULL,
    role        TEXT    NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen','admin')),
    phone       TEXT,
    address     TEXT,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS reports (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL,
    title           TEXT    NOT NULL,
    description     TEXT    NOT NULL,
    image           TEXT,
    latitude        REAL,
    longitude       REAL,
    status          TEXT    NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','accepted','rejected','completed')),
    admin_response  TEXT,
    reward_amount   REAL    NOT NULL DEFAULT 0,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_reports_user   ON reports(user_id);
  CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS notifications (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL,
    report_id  INTEGER,
    type       TEXT    NOT NULL DEFAULT 'status_change',
    title      TEXT    NOT NULL,
    body       TEXT    NOT NULL,
    is_read    INTEGER NOT NULL DEFAULT 0,
    created_at TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE,
    FOREIGN KEY (report_id) REFERENCES reports(id)  ON DELETE SET NULL
  );
  CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
`);

// Lightweight schema migration for existing databases
(function migrate() {
  const ucols = db.prepare(`PRAGMA table_info(users)`).all().map((c) => c.name);
  if (!ucols.includes('phone'))    db.exec(`ALTER TABLE users ADD COLUMN phone    TEXT`);
  if (!ucols.includes('address'))  db.exec(`ALTER TABLE users ADD COLUMN address  TEXT`);
  if (!ucols.includes('username')) db.exec(`ALTER TABLE users ADD COLUMN username TEXT`);
  if (!ucols.includes('bio'))      db.exec(`ALTER TABLE users ADD COLUMN bio      TEXT`);
  if (!ucols.includes('city'))     db.exec(`ALTER TABLE users ADD COLUMN city     TEXT`);
  if (!ucols.includes('points'))   db.exec(`ALTER TABLE users ADD COLUMN points   INTEGER NOT NULL DEFAULT 0`);
  if (!ucols.includes('avatar'))   db.exec(`ALTER TABLE users ADD COLUMN avatar   TEXT`);

  const rcols = db.prepare(`PRAGMA table_info(reports)`).all().map((c) => c.name);
  if (!rcols.includes('prev_status')) db.exec(`ALTER TABLE reports ADD COLUMN prev_status TEXT`);
  if (!rcols.includes('rating'))      db.exec(`ALTER TABLE reports ADD COLUMN rating INTEGER CHECK(rating BETWEEN 1 AND 5)`);
  if (!rcols.includes('points'))      db.exec(`ALTER TABLE reports ADD COLUMN points INTEGER NOT NULL DEFAULT 0`);
})();

export function bootstrapAdmin() {
  const { email, password } = config.adminBootstrap;
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return;
  const hashed = bcrypt.hashSync(password, 10);
  db.prepare(
    'INSERT INTO users (fullname, email, password, role) VALUES (?, ?, ?, ?)'
  ).run('Administrator', email, hashed, 'admin');
  console.log(`[db] bootstrap admin created: ${email}`);
}
