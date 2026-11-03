// Small input validation / sanitizing helpers used by controllers.
const AppError = require('./AppError');

exports.required = (body, fields) => {
  const missing = fields.filter((f) => body[f] === undefined || body[f] === null || String(body[f]).trim() === '');
  if (missing.length) throw new AppError(`Missing required field(s): ${missing.join(', ')}`, 400);
};

exports.toId = (value, name = 'id') => {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) throw new AppError(`Invalid ${name}`, 400);
  return n;
};

exports.toIntInRange = (value, name, min, max) => {
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) throw new AppError(`${name} must be a whole number from ${min} to ${max}`, 400);
  return n;
};

// Strip angle brackets and trim, so stored text can't carry HTML tags.
exports.clean = (value) => String(value).trim().replace(/[<>]/g, '');

exports.isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value));

// Accepts "YYYY-MM-DD HH:MM[:SS]" or the "T" form from <input type=datetime-local>.
exports.toDateTime = (value) => {
  const s = String(value).trim().replace('T', ' ');
  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(s)) throw new AppError('scheduled_time must look like YYYY-MM-DD HH:MM', 400);
  return s.length === 16 ? `${s}:00` : s;
};

exports.toTime = (value, name) => {
  const s = String(value).trim();
  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(s)) throw new AppError(`${name} must look like HH:MM`, 400);
  return s.length === 5 ? `${s}:00` : s;
};
