import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { HttpError } from '../middleware/error.js';

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RX = /^[+0-9()\-\s]{6,20}$/;
const ROLES = ['citizen', 'admin'];

function shape(u) {
  if (!u) return u;
  return {
    id: u.id,
    fullname: u.fullname,
    email: u.email,
    role: u.role,
    phone: u.phone || null,
    address: u.address || null,
    created_at: u.created_at,
    reports_count: u.reports_count !== undefined ? Number(u.reports_count) : undefined,
  };
}

const LIST_SQL = `
  SELECT u.*,
         (SELECT COUNT(*) FROM reports r WHERE r.user_id = u.id) AS reports_count
  FROM users u
`;

export function listUsers(req, res) {
  const { role, q } = req.query;
  let sql = LIST_SQL;
  const where = [];
  const params = [];

  if (role && ROLES.includes(role)) {
    where.push('u.role = ?');
    params.push(role);
  }
  if (q) {
    where.push('(u.fullname LIKE ? OR u.email LIKE ?)');
    const needle = `%${String(q).trim()}%`;
    params.push(needle, needle);
  }
  if (where.length) sql += ' WHERE ' + where.join(' AND ');
  sql += ' ORDER BY u.created_at DESC, u.id DESC';

  const rows = db.prepare(sql).all(...params);
  res.json({ users: rows.map(shape) });
}

export function getUserById(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new HttpError(400, 'Yanlış id');
  const row = db.prepare(`${LIST_SQL} WHERE u.id = ?`).get(id);
  if (!row) throw new HttpError(404, 'İstifadəçi tapılmadı');
  res.json({ user: shape(row) });
}

export function createUser(req, res) {
  const { fullname, email, password, role, phone, address } = req.body || {};
  if (!fullname || !email || !password) throw new HttpError(400, 'Ad, e-poçt və şifrə tələb olunur');
  if (!EMAIL_RX.test(email)) throw new HttpError(400, 'E-poçt formatı yanlışdır');
  if (String(password).length < 6) throw new HttpError(400, 'Şifrə ən az 6 simvol olmalıdır');
  const userRole = ROLES.includes(role) ? role : 'citizen';
  if (phone && !PHONE_RX.test(String(phone))) throw new HttpError(400, 'Telefon formatı yanlışdır');

  const normalisedEmail = String(email).toLowerCase().trim();
  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(normalisedEmail);
  if (exists) throw new HttpError(409, 'Bu e-poçt artıq qeydiyyatdadır');

  const hashed = bcrypt.hashSync(String(password), 10);
  const info = db.prepare(
    'INSERT INTO users (fullname, email, password, role, phone, address) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(
    String(fullname).trim(),
    normalisedEmail,
    hashed,
    userRole,
    phone ? String(phone).trim() : null,
    address ? String(address).trim() : null,
  );

  const row = db.prepare(`${LIST_SQL} WHERE u.id = ?`).get(info.lastInsertRowid);
  res.status(201).json({ user: shape(row) });
}

export function updateUserById(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new HttpError(400, 'Yanlış id');
  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!existing) throw new HttpError(404, 'İstifadəçi tapılmadı');

  const { fullname, phone, address, role, password } = req.body || {};
  const fields = [];
  const params = [];

  if (fullname !== undefined) {
    if (!String(fullname).trim()) throw new HttpError(400, 'Ad boş ola bilməz');
    fields.push('fullname = ?');
    params.push(String(fullname).trim());
  }
  if (phone !== undefined) {
    const p = phone === null || phone === '' ? null : String(phone).trim();
    if (p && !PHONE_RX.test(p)) throw new HttpError(400, 'Telefon formatı yanlışdır');
    fields.push('phone = ?');
    params.push(p);
  }
  if (address !== undefined) {
    const a = address === null || address === '' ? null : String(address).trim();
    fields.push('address = ?');
    params.push(a);
  }
  if (role !== undefined) {
    if (!ROLES.includes(role)) throw new HttpError(400, 'Rol yanlışdır');
    if (id === req.user.id && role !== existing.role) {
      throw new HttpError(400, 'Öz rolunuzu dəyişə bilməzsiniz');
    }
    if (existing.role === 'admin' && role !== 'admin') {
      const adminCount = db.prepare("SELECT COUNT(*) AS c FROM users WHERE role = 'admin'").get().c;
      if (adminCount <= 1) throw new HttpError(400, 'Ən azı bir administrator qalmalıdır');
    }
    fields.push('role = ?');
    params.push(role);
  }
  if (password !== undefined && password !== null && password !== '') {
    if (String(password).length < 6) throw new HttpError(400, 'Şifrə ən az 6 simvol olmalıdır');
    fields.push('password = ?');
    params.push(bcrypt.hashSync(String(password), 10));
  }

  if (!fields.length) throw new HttpError(400, 'Dəyişiklik üçün heç bir sahə yoxdur');
  params.push(id);
  db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...params);

  const row = db.prepare(`${LIST_SQL} WHERE u.id = ?`).get(id);
  res.json({ user: shape(row) });
}

export function deleteUserById(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new HttpError(400, 'Yanlış id');
  if (id === req.user.id) throw new HttpError(400, 'Öz hesabınızı silə bilməzsiniz');

  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!existing) throw new HttpError(404, 'İstifadəçi tapılmadı');

  if (existing.role === 'admin') {
    const adminCount = db.prepare("SELECT COUNT(*) AS c FROM users WHERE role = 'admin'").get().c;
    if (adminCount <= 1) throw new HttpError(400, 'Sistemdə ən azı bir administrator qalmalıdır');
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  res.json({ ok: true });
}

export function usersSummary(_req, res) {
  const row = db.prepare(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN role = 'citizen' THEN 1 ELSE 0 END) AS citizens,
      SUM(CASE WHEN role = 'admin'   THEN 1 ELSE 0 END) AS admins
    FROM users
  `).get();
  res.json({
    summary: {
      total:    Number(row.total)    || 0,
      citizens: Number(row.citizens) || 0,
      admins:   Number(row.admins)   || 0,
    },
  });
}
