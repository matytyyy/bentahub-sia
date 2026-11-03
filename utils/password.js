// Password hashing with Node's built-in scrypt (no native dependencies).
const crypto = require('crypto');

exports.hash = (plain) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const key = crypto.scryptSync(plain, salt, 64).toString('hex');
  return `${salt}:${key}`;
};

exports.verify = (plain, stored) => {
  try {
    const [salt, key] = String(stored).split(':');
    const test = crypto.scryptSync(plain, salt, 64);
    return crypto.timingSafeEqual(test, Buffer.from(key, 'hex'));
  } catch (e) {
    return false;
  }
};
