class GemError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'GemError';
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = GemError;