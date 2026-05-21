import { db } from '../db.js';
import { HttpError } from '../middleware/error.js';
import { createStatusNotification } from './notifications.controller.js';

const ALLOWED_STATUSES = ['pending', 'accepted', 'rejected', 'completed'];

function shape(row) {
  if (!row) return row;
  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    description: row.description,
    image: row.image,
    latitude: row.latitude,
    longitude: row.longitude,
    status: row.status,
    admin_response: row.admin_response,
    reward_amount: row.reward_amount,
    rating: row.rating ?? null,
    points: row.points ?? 0,
    created_at: row.created_at,
    citizen_name: row.citizen_name,
    citizen_email: row.citizen_email,
    citizen_phone: row.citizen_phone,
    citizen_address: row.citizen_address,
  };
}

export function rateReport(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new HttpError(400, 'Invalid id');

  const { rating } = req.body || {};
  const r = Number(rating);
  if (!Number.isInteger(r) || r < 1 || r > 5) {
    throw new HttpError(400, 'Reytinq 1-5 arasında tam ədəd olmalıdır');
  }

  const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(id);
  if (!report) throw new HttpError(404, 'Report not found');
  if (report.user_id !== req.user.id) throw new HttpError(403, 'Forbidden');
  if (report.status !== 'completed') throw new HttpError(400, 'Yalnız tamamlanmış müraciətləri qiymətləndirmək olar');
  if (report.rating !== null && report.rating !== undefined) {
    throw new HttpError(409, 'Bu müraciəti artıq qiymətləndirmisiniz');
  }

  db.prepare('UPDATE reports SET rating = ? WHERE id = ?').run(r, id);

  const row = db.prepare(`${LIST_SQL} WHERE r.id = ?`).get(id);
  res.json({ report: shape(row) });
}

const LIST_SQL = `
  SELECT r.*,
         u.fullname AS citizen_name,
         u.email    AS citizen_email,
         u.phone    AS citizen_phone,
         u.address  AS citizen_address
  FROM reports r
  JOIN users u ON u.id = r.user_id
`;

export function createReport(req, res) {
  const { title, description, latitude, longitude } = req.body || {};
  if (!title || !description) throw new HttpError(400, 'Title and description are required');

  const lat = latitude !== undefined && latitude !== '' && latitude !== null ? Number(latitude) : null;
  const lng = longitude !== undefined && longitude !== '' && longitude !== null ? Number(longitude) : null;
  if (lat !== null && Number.isNaN(lat)) throw new HttpError(400, 'Invalid latitude');
  if (lng !== null && Number.isNaN(lng)) throw new HttpError(400, 'Invalid longitude');

  const image = req.file ? `/uploads/${req.file.filename}` : null;

  const info = db.prepare(`
    INSERT INTO reports (user_id, title, description, image, latitude, longitude)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(req.user.id, String(title).trim(), String(description).trim(), image, lat, lng);

  const row = db.prepare(`${LIST_SQL} WHERE r.id = ?`).get(info.lastInsertRowid);
  res.status(201).json({ report: shape(row) });
}

export function listReports(req, res) {
  const isAdmin = req.user.role === 'admin';
  const { status } = req.query;

  let sql = LIST_SQL;
  const where = [];
  const params = [];

  if (!isAdmin) {
    where.push('r.user_id = ?');
    params.push(req.user.id);
  }
  if (status && ALLOWED_STATUSES.includes(status)) {
    where.push('r.status = ?');
    params.push(status);
  }
  if (where.length) sql += ' WHERE ' + where.join(' AND ');
  sql += ' ORDER BY r.created_at DESC, r.id DESC';

  const rows = db.prepare(sql).all(...params);
  res.json({ reports: rows.map(shape) });
}

export function getReport(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new HttpError(400, 'Invalid id');

  const row = db.prepare(`${LIST_SQL} WHERE r.id = ?`).get(id);
  if (!row) throw new HttpError(404, 'Report not found');
  if (req.user.role !== 'admin' && row.user_id !== req.user.id) {
    throw new HttpError(403, 'Forbidden');
  }
  res.json({ report: shape(row) });
}

export function updateReport(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new HttpError(400, 'Invalid id');

  const existing = db.prepare('SELECT * FROM reports WHERE id = ?').get(id);
  if (!existing) throw new HttpError(404, 'Report not found');

  const { status, admin_response, reward_amount, points } = req.body || {};
  const fields = [];
  const params = [];

  if (status !== undefined) {
    if (!ALLOWED_STATUSES.includes(status)) throw new HttpError(400, 'Invalid status');
    fields.push('status = ?');
    params.push(status);
  }
  if (admin_response !== undefined) {
    fields.push('admin_response = ?');
    params.push(admin_response == null ? null : String(admin_response));
  }
  if (reward_amount !== undefined) {
    const n = Number(reward_amount);
    if (Number.isNaN(n) || n < 0) throw new HttpError(400, 'Invalid reward amount');
    fields.push('reward_amount = ?');
    params.push(n);
  }
  if (points !== undefined) {
    const p = Number(points);
    if (!Number.isInteger(p) || p < 0 || p > 5) throw new HttpError(400, 'Xallar 0 ilə 5 arasında olmalıdır');
    fields.push('points = ?');
    params.push(p);
  }

  if (!fields.length) throw new HttpError(400, 'Nothing to update');
  params.push(id);
  db.prepare(`UPDATE reports SET ${fields.join(', ')} WHERE id = ?`).run(...params);


  const row = db.prepare(`${LIST_SQL} WHERE r.id = ?`).get(id);

  // Fire notification when status changes
  if (status && status !== existing.status) {
    createStatusNotification(existing.user_id, id, existing.title, status);
  }

  res.json({ report: shape(row) });
}

export function statsReports(_req, res) {
  const rows = db.prepare(`
    SELECT status, COUNT(*) AS count FROM reports GROUP BY status
  `).all();
  const stats = { pending: 0, accepted: 0, rejected: 0, completed: 0, total: 0 };
  for (const r of rows) {
    stats[r.status] = r.count;
    stats.total += r.count;
  }
  res.json({ stats });
}

export function analyticsReports(req, res) {
  const days = Math.min(Math.max(Number(req.query.days) || 30, 7), 180);
  const since = new Date(Date.now() - (days - 1) * 86400000).toISOString().slice(0, 10);

  const statusRows = db.prepare(`
    SELECT status, COUNT(*) AS count FROM reports GROUP BY status
  `).all();
  const statusCounts = { pending: 0, accepted: 0, rejected: 0, completed: 0 };
  let total = 0;
  for (const r of statusRows) {
    statusCounts[r.status] = r.count;
    total += r.count;
  }

  const dailyRows = db.prepare(`
    SELECT substr(created_at, 1, 10) AS day,
           COUNT(*) AS total,
           SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) AS completed,
           SUM(CASE WHEN status='rejected'  THEN 1 ELSE 0 END) AS rejected
    FROM reports
    WHERE substr(created_at, 1, 10) >= ?
    GROUP BY day
    ORDER BY day
  `).all(since);

  const dailyMap = new Map(dailyRows.map((r) => [r.day, r]));
  const timeline = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(Date.now() - (days - 1 - i) * 86400000);
    const key = d.toISOString().slice(0, 10);
    const row = dailyMap.get(key);
    timeline.push({
      day: key,
      total: row?.total || 0,
      completed: row?.completed || 0,
      rejected: row?.rejected || 0,
    });
  }

  const topCitizensRows = db.prepare(`
    SELECT u.fullname, u.email, COUNT(r.id) AS reports_count,
           SUM(CASE WHEN r.status='completed' THEN 1 ELSE 0 END) AS completed_count,
           COALESCE(SUM(r.reward_amount), 0) AS total_reward
    FROM users u
    JOIN reports r ON r.user_id = u.id
    WHERE u.role = 'citizen'
    GROUP BY u.id
    ORDER BY reports_count DESC, total_reward DESC
    LIMIT 5
  `).all();

  const rewardSummary = db.prepare(`
    SELECT
      COUNT(*) AS rewarded_count,
      COALESCE(SUM(reward_amount), 0) AS total_reward,
      COALESCE(AVG(reward_amount), 0) AS avg_reward
    FROM reports
    WHERE reward_amount > 0
  `).get();

  const completionRate = total ? Math.round((statusCounts.completed / total) * 100) : 0;
  const acceptanceRate = total
    ? Math.round(((statusCounts.accepted + statusCounts.completed) / total) * 100)
    : 0;

  res.json({
    analytics: {
      range: { days, since },
      total,
      statusCounts,
      completionRate,
      acceptanceRate,
      reward: rewardSummary,
      timeline,
      topCitizens: topCitizensRows,
    },
  });
}
