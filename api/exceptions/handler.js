exports.handlerException = (fn) => (req, res, next) => {
  return Promise.resolve(fn(req, res, next)).catch((error) => {
    const formattedError = {
      status: error.status || 500,
      message: error.message || 'Internal Server Error',
      code: error.code || 'INTERNAL_ERROR'
    };

    console.error('[Error]', {
      path: req.path,
      method: req.method,
      error: formattedError,
      stack: error.stack
    });

    return next(formattedError);
  });
};
