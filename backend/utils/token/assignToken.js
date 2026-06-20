import ErrorHandler from "../error/errorHandler.js";

// Create token and save in the cookie
export default (
  user,
  statusCode,
  res,
  rememberMe,
  next,
  sendResponse = true,
) => {
  let token;

  try {
    token = user.getJwtToken(rememberMe);
  } catch (error) {
    return next(new ErrorHandler("Could not create authentication token", 500));
  }

  const isProduction =
    (process.env.NODE_ENV || "").toLowerCase() === "production";

  const options = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
  };

  // Always set an explicit expiry — never fall back to a session-only
  // cookie. "Remember me" controls *how long* the session lasts
  // (7 days vs 1 day), not whether it survives closing the browser.
  const expiresInDays = rememberMe
    ? parseFloat(process.env.COOKIE_EXPIRES_TIME || "7")
    : parseFloat(process.env.COOKIE_EXPIRES_SHORT_TIME || "1");

  options.expires = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

  res.cookie("token", token, options);

  if (sendResponse === true) {
    res.status(statusCode).json({
      success: true,
      message: "Login successful",
      user,
    });
  }
};
