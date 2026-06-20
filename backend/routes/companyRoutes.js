import express from "express";
import {
  getCompany,
  updateCompany,
  uploadCompanyLogo,
} from "../controllers/companyControllers.js";
import {
  authorizeRoles,
  isStaffAuthenticated,
} from "../middlewares/staffMiddlewares.js";
import upload from "../middlewares/uploadMiddleware.js";

const router = express.Router();

// Get company info — public (auto-creates a default document on first call)
router.route("/").get(getCompany);

// Update company info — admin only
router
  .route("/")
  .put(isStaffAuthenticated, authorizeRoles("admin"), updateCompany);

// Upload or update company logo — admin only
router
  .route("/logo")
  .put(
    isStaffAuthenticated,
    authorizeRoles("admin"),
    upload.single("logo"),
    uploadCompanyLogo,
  );

export default router;
