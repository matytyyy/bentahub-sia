// Cabugnason: audit trail. Every other slice calls Audit.log(...) when something important happens.
const db = require('../config/db');

// userId = null means "done by the SYSTEM". conn lets callers log inside their own transaction.
exports.log = async (userId, action, entity, entityId = null, conn = db) => {
  await conn.query(
    'INSERT INTO audit_logs (user_id, action, entity, entity_id) VALUES (?,?,?,?)',
    [userId, action, entity, entityId]
  );
};

// FULL OUTER JOIN (MySQL has none, so: LEFT JOIN UNION RIGHT JOIN with identical column lists).
//  - LEFT side only  -> users who never did anything       (action = 'No activity')
//  - RIGHT side only -> log rows with no user = SYSTEM     (full_name = 'SYSTEM')
exports.fullOuterReport = async () => {
  const [rows] = await db.query(`
    SELECT COALESCE(u.full_name, 'SYSTEM') AS actor, COALESCE(al.action, 'No activity') AS action,
           al.entity, al.entity_id, al.created_at
    FROM users u LEFT JOIN audit_logs al ON al.user_id = u.id
    UNION
    SELECT COALESCE(u.full_name, 'SYSTEM') AS actor, COALESCE(al.action, 'No activity') AS action,
           al.entity, al.entity_id, al.created_at
    FROM users u RIGHT JOIN audit_logs al ON al.user_id = u.id
    ORDER BY created_at DESC
  `);
  return rows;
};
