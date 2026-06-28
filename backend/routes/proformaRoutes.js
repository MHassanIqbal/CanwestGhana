import express from "express";
import {
  createProforma,
  getAllProforma,
  getProformaById,
  updateProforma,
  deleteProforma,
  duplicateProforma,
  downloadProformaPdf,
  verifyProforma,
} from "../controllers/proformaControllers.js";
import { isStaffAuthenticated } from "../middlewares/staffMiddlewares.js";

const router = express.Router();

// All routes are staff-only now — verification requires login too
router.get("/verify/:token", isStaffAuthenticated, verifyProforma);

router.get("/", isStaffAuthenticated, getAllProforma);
router.post("/", isStaffAuthenticated, createProforma);
router.get("/:id", isStaffAuthenticated, getProformaById);
router.put("/:id", isStaffAuthenticated, updateProforma);
router.delete("/:id", isStaffAuthenticated, deleteProforma);
router.post("/:id/duplicate", isStaffAuthenticated, duplicateProforma);
router.get("/:id/pdf", isStaffAuthenticated, downloadProformaPdf);

export default router;
