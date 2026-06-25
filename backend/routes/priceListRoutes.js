import express from "express";
import { getPriceList } from "../controllers/priceListControllers.js";
import { isStaffAuthenticated } from "../middlewares/staffMiddlewares.js";

const router = express.Router();

router.route("/").get(isStaffAuthenticated, getPriceList);

export default router;
