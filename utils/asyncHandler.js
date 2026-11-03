// Wraps async controllers so any thrown error reaches the error-handling middleware.
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
