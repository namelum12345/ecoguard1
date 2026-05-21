import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db.js';
import { config } from '../config.js';
import { HttpError } from '../middleware/error.js';

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RX = /^[+0-9()\-\s]{6,20}$/;

function signToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, email: user.email },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

function publicUser(u) {
  return {
    id: u.id,
    fullname: u.fullname,
    email: u.email,
    role: u.role,
    phone: u.phone || null,
    address: u.address || null,
    username: u.username || null,
    bio: u.bio || null,
    city: u.city || null,
    points: u.points || 0,
    avatar: u.avatar || null,
    created_at: u.created_at,
  };
}

export function registerCitizen(req, res) {
  const { fullname, email, password, phone, address } = req.body || {};
  if (!fullname || !email || !password) throw new HttpError(400, 'Ad, e-poçt və şifrə tələb olunur');
  if (!EMAIL_RX.test(email)) throw new HttpError(400, 'E-poçt formatı yanlışdır');
  if (String(password).length < 6) throw new HttpError(400, 'Şifrə ən az 6 simvol olmalıdır');
  if (phone && !PHONE_RX.test(String(phone))) throw new HttpError(400, 'Telefon formatı yanlışdır');

  const normalisedEmail = String(email).toLowerCase().trim();
  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(normalisedEmail);
  if (exists) throw new HttpError(409, 'Bu e-poçt artıq qeydiyyatdadır');

  const hashed = bcrypt.hashSync(password, 10);
  const info = db.prepare(
    'INSERT INTO users (fullname, email, password, role, phone, address) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(
    String(fullname).trim(),
    normalisedEmail,
    hashed,
    'citizen',
    phone ? String(phone).trim()   : null,
    address ? String(address).trim() : null,
  );

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  const token = signToken(user);
  res.status(201).json({ user: publicUser(user), token });
}

export function loginCitizen(req, res) {
  return loginWithRole(req, res, 'citizen');
}

export function loginAdmin(req, res) {
  return loginWithRole(req, res, 'admin');
}

function loginWithRole(req, res, expectedRole) {
  const { email, password } = req.body || {};
  if (!email || !password) throw new HttpError(400, 'Missing email or password');

  const user = db.prepare('SELECT * FROM users WHERE email = ?')
    .get(String(email).toLowerCase().trim());
  if (!user) throw new HttpError(401, 'Invalid credentials');
  if (user.role !== expectedRole) throw new HttpError(403, 'Forbidden for this account');
  if (!bcrypt.compareSync(String(password), user.password)) {
    throw new HttpError(401, 'Invalid credentials');
  }

  const token = signToken(user);
  res.json({ user: publicUser(user), token });
}

export function me(req, res) {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) throw new HttpError(404, 'User not found');
  res.json({ user: publicUser(user) });
}

export function updateMe(req, res) {
  const { fullname, phone, address, username, bio, city } = req.body || {};
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
  if (username !== undefined) {
    const u = username === null || username === '' ? null : String(username).trim();
    if (u) {
      const taken = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(u, req.user.id);
      if (taken) throw new HttpError(409, 'Bu istifadəçi adı artıq mövcuddur');
    }
    fields.push('username = ?');
    params.push(u);
  }
  if (bio !== undefined) {
    fields.push('bio = ?');
    params.push(bio === null || bio === '' ? null : String(bio).trim());
  }
  if (city !== undefined) {
    fields.push('city = ?');
    params.push(city === null || city === '' ? null : String(city).trim());
  }

  if (!fields.length) throw new HttpError(400, 'Dəyişiklik üçün heç bir sahə göndərilməyib');

  params.push(req.user.id);
  db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...params);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  res.json({ user: publicUser(user) });
}

export function myStats(req, res) {
  const uid = req.user.id;
  const row = db.prepare(`
    SELECT
      COUNT(*)                                                             AS total,
      SUM(CASE WHEN status IN ('accepted','completed') THEN 1 ELSE 0 END) AS verified,
      SUM(CASE WHEN status = 'completed'              THEN 1 ELSE 0 END)  AS resolved,
      COALESCE(SUM(reward_amount), 0)                                      AS total_reward,
      ROUND(AVG(CASE WHEN rating IS NOT NULL THEN rating END), 1)          AS avg_rating,
      COUNT(CASE WHEN rating IS NOT NULL THEN 1 END)                       AS rated_count,
      ROUND(AVG(CASE WHEN points > 0 THEN points END))                     AS avg_points
    FROM reports WHERE user_id = ?
  `).get(uid);

  res.json({
    stats: {
      total:        row.total        || 0,
      verified:     row.verified     || 0,
      resolved:     row.resolved     || 0,
      total_reward: row.total_reward || 0,
      points:       row.avg_points   || 0,
      avg_rating:   row.avg_rating   ?? null,
      rated_count:  row.rated_count  || 0,
    },
  });
}

export function changePassword(req, res) {
  const { current_password, new_password } = req.body || {};
  if (!current_password || !new_password) {
    throw new HttpError(400, 'Current and new passwords are required');
  }
  if (String(new_password).length < 6) {
    throw new HttpError(400, 'New password too short (min 6)');
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) throw new HttpError(404, 'User not found');
  if (!bcrypt.compareSync(String(current_password), user.password)) {
    throw new HttpError(401, 'Current password is incorrect');
  }

  const hashed = bcrypt.hashSync(String(new_password), 10);
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashed, req.user.id);
  res.json({ ok: true });
}
