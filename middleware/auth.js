// 401 = not logged in / bad token.  403 = logged in but not allowed.
const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

const secret = () => process.env.JWT_SECRET || 'dev-only-secret';

exports.signToken = (payload) => jwt.sign(payload, secret(), { expiresIn: '2h' });

exports.protect = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(new AppError('Not logged in. Please log in first.', 401));
  try {
    req.user = jwt.verify(token, secret()); // { id, username, roles: [...] }
    next();
  } catch (e) {
    next(new AppError('Invalid or expired token. Please log in again.', 401));
  }
};

exports.authorize = (...allowed) => (req, res, next) => {
  if (!req.user.roles.some((r) => allowed.includes(r))) {
    return next(new AppError('You do not have permission to do that.', 403));
  }
  next();
};

exports.isAdmin = (user) => user.roles.includes('admin');
