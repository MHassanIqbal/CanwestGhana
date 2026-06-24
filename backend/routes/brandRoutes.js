import express from "express";
import {
  getAllBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
  uploadBrandLogo,
} from "../controllers/brandControllers.js";
import {
  authorizeRoles,
  isStaffAuthenticated,
} from "../middlewares/staffMiddlewares.js";
import upload from "../middlewares/uploadMiddleware.js";

const router = express.Router();

// Public reads
router.route("/").get(getAllBrands);
router.route("/:id").get(getBrandById);

// Admin and Manager writes
router
  .route("/")
  .post(isStaffAuthenticated, authorizeRoles("admin", "manager"), createBrand);

router
  .route("/:id")
  .put(isStaffAuthenticated, authorizeRoles("admin", "manager"), updateBrand)
  .delete(
    isStaffAuthenticated,
    authorizeRoles("admin", "manager"),
    deleteBrand,
  );

router
  .route("/:id/logo")
  .put(
    isStaffAuthenticated,
    authorizeRoles("admin", "manager"),
    upload.single("logo"),
    uploadBrandLogo,
  );

export default router;
