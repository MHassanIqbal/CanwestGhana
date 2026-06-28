import express from "express";
import {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customerControllers.js";
import { isStaffAuthenticated } from "../middlewares/staffMiddlewares.js";

const router = express.Router();

router.use(isStaffAuthenticated);

router.get("/", getAllCustomers);
router.post("/", createCustomer);
router.get("/:id", getCustomerById);
router.put("/:id", updateCustomer);
router.delete("/:id", deleteCustomer);

export default router;
