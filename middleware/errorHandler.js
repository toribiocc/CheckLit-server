function errorHandler(error, req, res, next) {
  console.error("API error:", error.message);

  if (res.headersSent) {
    return next(error);
  }

  // Invalid Mongoose data or malformed JSON
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

  // Duplicate database records
  if (error.code === 11000) {
    return res.status(409).json({
      message: "A record with these details already exists.",
    });
  }

  // Unexpected server errors
  return res.status(500).json({
    message: "An unexpected server error occurred.",
  });
}

module.exports = errorHandler;