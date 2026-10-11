function errorHandler(error, req, res, next) {
  console.error("API error:", error.message);

  if (res.headersSent) {
    return next(error);
  }

  // Mongoose validation errors, invalid IDs, and malformed JSON
  if (
    error.name === "ValidationError" ||
    error.name === "CastError" ||
    (error instanceof SyntaxError && error.status === 400)
  ) {
    return res.status(400).json({
      message: "Invalid request data.",
      error: error.message,
    });
  }

  // Duplicate records, such as an email that already exists
  if (error.code === 11000) {
    return res.status(409).json({
      message: "A record with these details already exists.",
    });
  }

  // Explicit client-error status set by route validation
  if (Number.isInteger(error.status) && error.status >= 400 && error.status < 500) {
    return res.status(error.status).json({
      message: error.message || "The request could not be processed.",
    });
  }

  // Unexpected server errors
  return res.status(500).json({
    message: "An unexpected server error occurred.",
  });
}

module.exports = errorHandler;