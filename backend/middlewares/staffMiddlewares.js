import jwt from "jsonwebtoken";
import Staff from "../models/staffModel.js";
import catchAsyncErrors from "../utils/error/catchAsyncErrors.js";
import ErrorHandler from "../utils/error/errorHandler.js";

// Check if user is authenticated
export const isStaffAuthenticated = catchAsyncErrors(async (req, res, next) => {
  const { token } = req.cookies;

  if (!token) {
    return next(new ErrorHandler("Access Denied. Please Login", 401));
  }

  const decodedData = jwt.verify(token, process.env.JWT_SECRET);

  req.staff = await Staff.findById(decodedData.id).populate("branch", "name");

  if (!req.staff) {
    return next(new ErrorHandler("User not found", 404));
  }

  if (!req.staff.isActive) {
    return next(
      new ErrorHandler(
        "This account has been deactivated. Contact an administrator.",
        403,
      ),
    );
  }

  next();
});

// Authorize user roles (for role-based access control)
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.staff) {
      return next(new ErrorHandler("User not authenticated", 401));
    }

    // Check if the staff role is authorized
    if (!roles.includes(req.staff.role)) {
      return next(
        new ErrorHandler(
          `Access Denied. Unauthorized access for ${req.staff.role}`,
          403,
        ),
      );
    }

    next(); // Proceed to the next middleware or route handler
  };
};
