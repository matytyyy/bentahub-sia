// Error with an HTTP status code. Thrown by models/controllers, formatted by errorHandler.
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}
module.exports = AppError;
