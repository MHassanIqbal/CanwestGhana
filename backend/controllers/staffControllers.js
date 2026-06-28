import catchAsyncErrors from "../utils/error/catchAsyncErrors.js";
import ErrorHandler from "../utils/error/errorHandler.js";
import Staff from "../models/staffModel.js";
import assignToken from "../utils/token/assignToken.js";
import sendEmail from "../config/sendEmail.js";
import crypto from "crypto";
import { getResetPasswordTemplate } from "../utils/email/emailTemplate.js";

// Create new staff controller
export const createStaff = catchAsyncErrors(async (req, res, next) => {
  const { firstName, lastName, email, password, role } = req.body;

  if (!req.staff?.canCreateStaff()) {
    return next(
      new ErrorHandler("You do not have permission to create staff.", 403),
    );
  }

  const existingStaff = await Staff.findOne({ email });
  if (existingStaff) {
    return next(new ErrorHandler("Email already exists", 400));
  }

  const staff = await Staff.create({
    firstName,
    lastName,
    email,
    password,
    role,
    branch: branch ?? null,
    createdBy: req.staff._id,
  });

  res.status(201).json({
    success: true,
    message: "Staff created successfully",
    staff,
  });
});

// Login staff controller
export const loginStaff = catchAsyncErrors(async (req, res, next) => {
  const { email, password, rememberMe } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler("Email and Password are required", 400));
  }

  const staff = await Staff.findOne({ email }).select("+password");
  if (!staff || !(await staff.comparePassword(password))) {
    return next(new ErrorHandler("Invalid Email or Password", 401));
  }

  if (!staff.isActive) {
    return next(
      new ErrorHandler(
        "This account has been deactivated. Contact an administrator.",
        403,
      ),
    );
  }

  assignToken(staff, 200, res, rememberMe, next);
});

// Logout staff controller
export const logoutStaff = catchAsyncErrors(async (req, res, next) => {
  const isProduction =
    (process.env.NODE_ENV || "").toLowerCase() === "production";

  res.cookie("token", "", {
    expires: new Date(0),
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
  });

  res.status(200).json({ message: "Logged out successfully" });
});

// Get profile
export const getStaffProfile = catchAsyncErrors(async (req, res, next) => {
  const staff = await Staff.findById(req.staff?.id).populate("branch", "name");
  if (!staff) return next(new ErrorHandler("User not found", 404));

  res.status(200).json({ staff });
});

// Get all staff controller
export const getAllStaff = catchAsyncErrors(async (req, res, next) => {
  const query = req.staff.role === "admin" ? {} : { createdBy: req.staff._id };
  const allStaff = await Staff.find(query).populate("branch", "name address");
  res.status(200).json({ allStaff });
});

// Update staff controller
export const updateStaff = catchAsyncErrors(async (req, res, next) => {
  const staff = await Staff.findById(req.params.id).populate(
    "branch",
    "name address",
  );
  if (!staff) {
    return next(new ErrorHandler("Staff not found", 404));
  }

  // Prevent email from being changed
  if (req.body.email && req.body.email !== staff.email) {
    return next(new ErrorHandler("Email address cannot be changed", 400));
  }

  if (!req.staff.canManageStaff(staff)) {
    return next(
      new ErrorHandler("You do not have permission to update this staff", 403),
    );
  }

  const isSelf = req.staff._id.toString() === staff._id.toString();
  const isAdmin = req.staff.role === "admin";

  // Role can only be changed by an admin, never by the user themselves
  const updatableFields = ["firstName", "middleName", "lastName"];
  if (isAdmin) updatableFields.push("role", "branch");

  updatableFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      staff[field] = req.body[field];
    }
  });

  // Password changes go through the dedicated changePassword endpoint
  if (req.body.password && !isSelf) {
    staff.password = req.body.password;
  } else if (req.body.password && isSelf) {
    return next(
      new ErrorHandler(
        "Use the change password endpoint to update your own password.",
        400,
      ),
    );
  }

  await staff.save();

  res.status(200).json({
    success: true,
    staff,
  });
});

// Change own password controller (requires current password)
export const changePassword = catchAsyncErrors(async (req, res, next) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmNewPassword) {
    return next(
      new ErrorHandler(
        "Current password, new password, and confirmation are required",
        400,
      ),
    );
  }

  if (newPassword !== confirmNewPassword) {
    return next(new ErrorHandler("New passwords do not match", 400));
  }

  const staff = await Staff.findById(req.staff._id).select("+password");

  if (!(await staff.comparePassword(currentPassword))) {
    return next(new ErrorHandler("Current password is incorrect", 401));
  }

  staff.password = newPassword;
  await staff.save();

  res.status(200).json({
    success: true,
    message: "Password updated successfully",
  });
});

// Deactivate staff controller (soft delete — preserves historical references)
export const deactivateStaff = catchAsyncErrors(async (req, res, next) => {
  const staff = await Staff.findById(req.params.id);
  if (!staff) {
    return next(new ErrorHandler("Staff not found", 404));
  }

  if (staff.email === "admin@canwestghana.com") {
    return next(new ErrorHandler("Default admin cannot be deactivated", 400));
  }

  if (!req.staff.canManageStaff(staff)) {
    return next(
      new ErrorHandler(
        "You do not have permission to deactivate this staff",
        403,
      ),
    );
  }

  if (req.staff._id.toString() === staff._id.toString()) {
    return next(
      new ErrorHandler("You cannot deactivate your own account", 400),
    );
  }

  staff.isActive = false;
  await staff.save();

  res.status(200).json({
    success: true,
    message: "Staff deactivated successfully",
  });
});

// Reactivate staff controller
export const reactivateStaff = catchAsyncErrors(async (req, res, next) => {
  const staff = await Staff.findById(req.params.id);
  if (!staff) {
    return next(new ErrorHandler("Staff not found", 404));
  }

  if (!req.staff.canManageStaff(staff)) {
    return next(
      new ErrorHandler(
        "You do not have permission to reactivate this staff",
        403,
      ),
    );
  }

  staff.isActive = true;
  await staff.save();

  res.status(200).json({
    success: true,
    message: "Staff reactivated successfully",
  });
});

// Delete staff controller (hard delete — admin only, use deactivateStaff
export const deleteStaff = catchAsyncErrors(async (req, res, next) => {
  const staff = await Staff.findById(req.params.id);
  if (!staff)
    return next(
      new ErrorHandler(`Staff not found with ID: ${req.params.id}`, 404),
    );

  if (staff.email === "admin@canwestghana.com") {
    return next(new ErrorHandler("Default staff deletion is not allowed", 400));
  }

  if (!req.staff.canManageStaff(staff)) {
    return next(
      new ErrorHandler("You do not have permission to delete this staff", 403),
    );
  }

  await staff.deleteOne();

  res
    .status(200)
    .json({ success: true, message: "Staff deleted successfully" });
});

// Forgot password controller
export const forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const staff = await Staff.findOne({ email: req.body.email });
  if (!staff) return next(new ErrorHandler("Email Not Found", 404));

  const resetToken = staff.getResetPasswordToken();
  await staff.save();

  const resetUrl = `${process.env.FRONTEND_WORKPLACE_URL}/reset-password/${resetToken}`;
  const message = getResetPasswordTemplate(
    `${staff.firstName} ${staff.lastName}`,
    resetUrl,
  );

  try {
    await sendEmail({
      email: staff.email,
      subject: "Password Recovery",
      message,
    });
    res.status(200).json({ message: `Email sent to: ${staff.email}` });
  } catch (err) {
    staff.resetPasswordToken = undefined;
    staff.resetPasswordExpire = undefined;
    await staff.save();

    return next(new ErrorHandler(err.message, 500));
  }
});

// Reset password controller
export const resetPassword = catchAsyncErrors(async (req, res, next) => {
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const staff = await Staff.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!staff)
    return next(
      new ErrorHandler("Password reset request is invalid or has expired", 400),
    );
  if (req.body.password !== req.body.confirmPassword) {
    return next(new ErrorHandler("Passwords do not match", 400));
  }

  staff.password = req.body.password;
  staff.resetPasswordToken = undefined;
  staff.resetPasswordExpire = undefined;

  await staff.save();
  assignToken(staff, 200, res, false, next);
});

// Validate reset token controller
export const validateResetToken = catchAsyncErrors(async (req, res, next) => {
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const staff = await Staff.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!staff)
    return next(
      new ErrorHandler("Password reset request is invalid or has expired", 400),
    );

  res.status(200).json({ message: "Request is valid" });
});

// Assign branch to staff controller
export const assignBranch = catchAsyncErrors(async (req, res, next) => {
  const staff = await Staff.findById(req.params.id);
  if (!staff) return next(new ErrorHandler("Staff not found", 404));

  if (req.staff.role !== "admin") {
    return next(
      new ErrorHandler("Only admins can assign branch to staff", 403),
    );
  }

  // Allow null to unassign
  staff.branch = req.body.branch ?? null;
  await staff.save();

  res.status(200).json({
    success: true,
    message: "Branch assigned successfully",
    staff,
  });
});
