import express from "express";
import {
  changePassword,
  createStaff,
  deactivateStaff,
  deleteStaff,
  forgotPassword,
  getAllStaff,
  getStaffProfile,
  loginStaff,
  logoutStaff,
  reactivateStaff,
  resetPassword,
  updateStaff,
  validateResetToken,
} from "../controllers/staffControllers.js";
import {
  authorizeRoles,
  isStaffAuthenticated,
} from "../middlewares/staffMiddlewares.js";

const router = express.Router();

// Staff login
router.route("/login").post(loginStaff);

// Staff logout
router.route("/logout").post(logoutStaff);

// Get own staff profile
router.route("/me").get(isStaffAuthenticated, getStaffProfile);

// Change own password (requires current password)
router.route("/me/change-password").put(isStaffAuthenticated, changePassword);

// Get all staff - Admin and Manager (manager sees staff per their own scope;
router
  .route("/all-staff")
  .get(isStaffAuthenticated, authorizeRoles("admin", "manager"), getAllStaff);

// Create staff - Admin only
router
  .route("/create-staff")
  .post(isStaffAuthenticated, authorizeRoles("admin"), createStaff);

// Update staff - Admin, self, or manager updating an employee they created
router.route("/:id/update").put(isStaffAuthenticated, updateStaff);

// Deactivate staff - Admin, or manager deactivating an employee they created
router
  .route("/:id/deactivate")
  .put(
    isStaffAuthenticated,
    authorizeRoles("admin", "manager"),
    deactivateStaff,
  );

// Reactivate staff - Admin, or manager reactivating an employee they created
router
  .route("/:id/reactivate")
  .put(
    isStaffAuthenticated,
    authorizeRoles("admin", "manager"),
    reactivateStaff,
  );

// Delete staff - Admin only (hard delete; managers use deactivate instead)
router
  .route("/:id/delete")
  .delete(isStaffAuthenticated, authorizeRoles("admin"), deleteStaff);

// Password forgot route
router.route("/password/forgot").post(forgotPassword);

// Password reset route
router.route("/password/reset/:token").put(resetPassword);

// Password reset token validate route
router.route("/password/reset/validate/:token").get(validateResetToken);

export default router;
