// Concatenates database/schema/*.sql then database/seed/*.sql into ONE file for phpMyAdmin / mysql import.
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'database');
const read = (sub) => fs.readdirSync(path.join(dir, sub)).filter((f) => f.endsWith('.sql')).sort()
  .map((f) => `-- ===== ${sub}/${f} =====\n` + fs.readFileSync(path.join(dir, sub, f), 'utf8')).join('\n');

const out = [
  'CREATE DATABASE IF NOT EXISTS bentahub_db;', 'USE bentahub_db;', 'SET FOREIGN_KEY_CHECKS = 0;',
  read('schema'), 'SET FOREIGN_KEY_CHECKS = 1;', read('seed')
].join('\n');
fs.writeFileSync(path.join(dir, 'bentahub_full.sql'), out);
console.log('Wrote database/bentahub_full.sql');
