// Runs fn(connection) inside a DB transaction: commit on success, rollback on any error.
const db = require('../config/db');

module.exports = async (fn) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};
