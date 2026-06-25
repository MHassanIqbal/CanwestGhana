import express from "express";
import {
  getAllVariants,
  getVariantById,
  createVariant,
  updateVariant,
  deleteVariant,
  adjustStock,
  uploadVariantImage,
} from "../controllers/productVariantControllers.js";
import {
  authorizeRoles,
  isStaffAuthenticated,
} from "../middlewares/staffMiddlewares.js";
import upload from "../middlewares/uploadMiddleware.js";

const router = express.Router();

// Public reads — supports ?product=<id> to scope to one product
router.route("/").get(getAllVariants);
router.route("/:id").get(getVariantById);

// Admin and Manager writes
router
  .route("/")
  .post(
    isStaffAuthenticated,
    authorizeRoles("admin", "manager"),
    createVariant,
  );

router
  .route("/:id")
  .put(isStaffAuthenticated, authorizeRoles("admin", "manager"), updateVariant)
  .delete(
    isStaffAuthenticated,
    authorizeRoles("admin", "manager"),
    deleteVariant,
  );

router
  .route("/:id/stock")
  .put(isStaffAuthenticated, authorizeRoles("admin", "manager"), adjustStock);

router
  .route("/:id/image")
  .put(
    isStaffAuthenticated,
    authorizeRoles("admin", "manager"),
    upload.single("image"),
    uploadVariantImage,
  );

export default router;
