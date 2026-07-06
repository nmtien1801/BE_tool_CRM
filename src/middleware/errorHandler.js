export const notFound = (req, res, next) => {
  const error = new Error(`Route không tồn tại: ${req.originalUrl}`);
  error.status = 404;
  next(error);
};

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.status || err.statusCode || 500;
  console.error(`[ERROR] ${statusCode} - ${err.message}`);

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Lỗi máy chủ nội bộ',
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      vietqrData: err.vietqrData,
    }),
  });
};

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
