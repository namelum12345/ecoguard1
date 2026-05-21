import { db } from '../db.js';

export function listNotifications(req, res) {
  const rows = db.prepare(`
    SELECT n.*, r.title AS report_title
    FROM notifications n
    LEFT JOIN reports r ON r.id = n.report_id
    WHERE n.user_id = ?
    ORDER BY n.created_at DESC
    LIMIT 50
  `).all(req.user.id);
  const unread = db.prepare(
    'SELECT COUNT(*) AS c FROM notifications WHERE user_id = ? AND is_read = 0'
  ).get(req.user.id).c;
  res.json({ notifications: rows, unread });
}

export function markAllRead(req, res) {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);
  res.json({ ok: true });
}

export function markRead(req, res) {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?')
    .run(Number(req.params.id), req.user.id);
  res.json({ ok: true });
}

// Called internally when a report status changes
export function createStatusNotification(userId, reportId, reportTitle, newStatus) {
  const messages = {
    accepted:  { title: 'Müraciətiniz qəbul edildi',   body: `"${reportTitle}" müraciətiniz baxış üçün qəbul edildi.` },
    completed: { title: 'Müraciətiniz həll edildi',    body: `"${reportTitle}" müraciətiniz uğurla həll edildi!` },
    rejected:  { title: 'Müraciətiniz rədd edildi',    body: `"${reportTitle}" müraciətiniz rədd edildi.` },
  };
  const msg = messages[newStatus];
  if (!msg) return;
  db.prepare(`
    INSERT INTO notifications (user_id, report_id, type, title, body)
    VALUES (?, ?, 'status_change', ?, ?)
  `).run(userId, reportId, msg.title, msg.body);
}
