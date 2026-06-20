import ErrorHandler from "../utils/error/errorHandler.js";

export default (err, req, res, next) => {
  let error = {
    statusCode: err?.statusCode || 500,
    message: err?.message || "Internal Server Error",
  };

  // Handle invalid Mongoose ID error (CastError)
  if (err.name === "CastError") {
    const message = `Resource not found. Invalid: ${err?.path}`;
    error = new ErrorHandler(message, 404);
  }

  // Handle Mongoose Validation Error (ValidationError)
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
    error = new ErrorHandler(message, 400);
  }

  // Handle Mongoose Duplicate Key Error (11000)
  if (err.code === 11000) {
    const field = err.keyValue ? Object.keys(err.keyValue).join(", ") : "field";
    const message = `Duplicate ${field} entered.`;
    error = new ErrorHandler(message, 400);
  }

  // Handle JWT Errors
  if (err.name === "JsonWebTokenError") {
    const message = "JSON web token is invalid. Try again.";
    error = new ErrorHandler(message, 400);
  }

  // Handle Expired JWT Error
  if (err.name === "TokenExpiredError") {
    const message = "JSON web token is expired. Please login again.";
    error = new ErrorHandler(message, 401);
  }

  // Single, centralized log point — full detail for real server errors (5xx),
  // a compact one-liner for routine/expected client errors (4xx) so genuine
  // bugs don't get buried under normal "wrong password" / "permission denied" traffic.
  if (error.statusCode >= 500) {
    console.error(
      `[${req.method} ${req.originalUrl}] ${error.message}`,
      err.stack,
    );
  } else {
    console.warn(
      `[${req.method} ${req.originalUrl}] ${error.statusCode} ${error.message}`,
    );
  }

  // Respond based on environment (DEVELOPMENT or PRODUCTION)
  if (process.env.NODE_ENV === "PRODUCTION") {
    // In production, avoid leaking error details
    res.status(error.statusCode).json({
      message: error.message,
    });
  } else {
    // In development (or if NODE_ENV is misconfigured), include debug info
    res.status(error.statusCode).json({
      message: error.message,
      error: err,
      stack: err?.stack,
    });
  }
};
