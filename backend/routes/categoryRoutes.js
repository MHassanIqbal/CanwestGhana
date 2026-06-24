import express from "express";
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  uploadCategoryImage,
} from "../controllers/categoryControllers.js";
import {
  authorizeRoles,
  isStaffAuthenticated,
} from "../middlewares/staffMiddlewares.js";
import upload from "../middlewares/uploadMiddleware.js";

const router = express.Router();

// Public reads
router.route("/").get(getAllCategories);
router.route("/:id").get(getCategoryById);

// Admin and Manager writes
router
  .route("/")
  .post(
    isStaffAuthenticated,
    authorizeRoles("admin", "manager"),
    createCategory,
  );

router
  .route("/:id")
  .put(isStaffAuthenticated, authorizeRoles("admin", "manager"), updateCategory)
  .delete(
    isStaffAuthenticated,
    authorizeRoles("admin", "manager"),
    deleteCategory,
  );

router
  .route("/:id/image")
  .put(
    isStaffAuthenticated,
    authorizeRoles("admin", "manager"),
    upload.single("image"),
    uploadCategoryImage,
  );

export default router;
