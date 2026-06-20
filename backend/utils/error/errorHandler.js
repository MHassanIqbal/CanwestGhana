class ErrorHandler extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode || 500;

    // capture error stack and trace
    Error.captureStackTrace(this, this.constructor);
  }
}

export default ErrorHandler;
