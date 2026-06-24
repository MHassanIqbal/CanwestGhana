import express from "express";
import {
  getAllLocations,
  getLocationById,
  createLocation,
  updateLocation,
  deleteLocation,
} from "../controllers/locationControllers.js";
import {
  authorizeRoles,
  isStaffAuthenticated,
} from "../middlewares/staffMiddlewares.js";

const router = express.Router();

// Public reads
router.route("/").get(getAllLocations);
router.route("/:id").get(getLocationById);

// Admin and Manager writes
router
  .route("/")
  .post(
    isStaffAuthenticated,
    authorizeRoles("admin", "manager"),
    createLocation,
  );

router
  .route("/:id")
  .put(isStaffAuthenticated, authorizeRoles("admin", "manager"), updateLocation)
  .delete(
    isStaffAuthenticated,
    authorizeRoles("admin", "manager"),
    deleteLocation,
  );

export default router;
