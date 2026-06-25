import express from "express";
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductImage,
  removeProductImage,
} from "../controllers/productControllers.js";
import {
  authorizeRoles,
  isStaffAuthenticated,
} from "../middlewares/staffMiddlewares.js";
import upload from "../middlewares/uploadMiddleware.js";

const router = express.Router();

// Public reads
router.route("/").get(getAllProducts);
router.route("/:id").get(getProductById);

// Admin and Manager writes
router
  .route("/")
  .post(
    isStaffAuthenticated,
    authorizeRoles("admin", "manager"),
    createProduct,
  );

router
  .route("/:id")
  .put(isStaffAuthenticated, authorizeRoles("admin", "manager"), updateProduct)
  .delete(
    isStaffAuthenticated,
    authorizeRoles("admin", "manager"),
    deleteProduct,
  );

router
  .route("/:id/image")
  .post(
    isStaffAuthenticated,
    authorizeRoles("admin", "manager"),
    upload.single("image"),
    addProductImage,
  )
  .delete(
    isStaffAuthenticated,
    authorizeRoles("admin", "manager"),
    removeProductImage,
  );

export default router;
