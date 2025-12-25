exports.successResponse = (res, message, data = null, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

exports.errorResponse = (res, message, error = null, statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error: error ? error.message || error : null,
  });
};
