const apiResponse = require("../utils/apiResponse");

// Global Error Handler Middleware
const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((item) => item.message)
      .join(", ");
  }

  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path}`;
  }

  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyPattern || {})[0] || "field";
    message = `${field} already exists`;
  }

  if (err.code === "LIMIT_FILE_SIZE") {
    statusCode = 400;
    message = "Image size must be under 5MB";
  }

  if (err.code === "LIMIT_FILE_COUNT") {
    statusCode = 400;
    message = "Maximum 6 images are allowed";
  }

  res.status(statusCode).json(
    apiResponse({
      success: false,
      message,
      error: process.env.NODE_ENV === "development" ? err.stack : undefined,
      status: statusCode,
      data: null,
    }),
  );
};

module.exports = errorHandler;
