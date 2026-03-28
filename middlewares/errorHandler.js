export const globalErrorHandler = (err, req, res, next) => {
  console.error('[Error]:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  return res.status(statusCode).json({
    error: message,
    // Add stack trace only in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
