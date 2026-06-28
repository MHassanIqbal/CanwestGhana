// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error(`Error: ${err.message}`);
  console.log("Shutting down server due to Uncaught Exceptions");
  process.exit(1); // Exit with failure code 1
});

import "./config/loadEnv.js";

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { connectDatabase } from "./config/databaseConnect.js";
import errorMiddlewares from "./middlewares/errorMiddlewares.js";

import staffRoutes from "./routes/staffRoutes.js";
import companyRoutes from "./routes/companyRoutes.js";
import brandRoutes from "./routes/brandRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import locationRoutes from "./routes/locationRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import productVariantRoutes from "./routes/productVariantRoutes.js";
import priceListRoutes from "./routes/priceListRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import proformaRoutes from "./routes/proformaRoutes.js";

// Init Express
const server = express();

// Init Express Json
server.use(express.json());
server.use(express.urlencoded({ extended: true }));

// Init Cors
const allowedOrigins = [
  process.env.FRONTEND_WORKPLACE_URL,
  process.env.FRONTEND_ECOMMERCE_URL,
  process.env.FRONTEND_RENDER_URL,
].filter(Boolean);

server.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`Blocked by CORS: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

// Init Cookie Parser
server.use(cookieParser());

// Routes
server.use("/api/staff", staffRoutes);
server.use("/api/company", companyRoutes);
server.use("/api/brand", brandRoutes);
server.use("/api/category", categoryRoutes);
server.use("/api/location", locationRoutes);
server.use("/api/product", productRoutes);
server.use("/api/product-variant", productVariantRoutes);
server.use("/api/price-list", priceListRoutes);
server.use("/api/customer", customerRoutes);
server.use("/api/proforma", proformaRoutes);

// Init Error Middleware
server.use(errorMiddlewares);

// Server-Side Handling for 404 Page
server.use((req, res) => {
  res.status(404).json({ message: "Page Not Found" });
});

// Server Setup — only start accepting requests once the DB connection
const port = process.env.PORT || 5000;

connectDatabase()
  .then(() => {
    const startServer = server.listen(port, () => {
      console.log(
        `Server is running on PORT ${port} in ${process.env.NODE_ENV} mode`,
      );
    });

    // Handle Unhandled Promise Rejections
    process.on("unhandledRejection", (err) => {
      console.error(`Error: ${err.message}`);
      console.log("Shutting down server due to Unhandled Promise Rejections");
      startServer.close(() => {
        process.exit(1); // Exit with failure code 1
      });
    });
  })
  .catch((err) => {
    console.error(`Failed to connect to database: ${err.message}`);
    console.log("Shutting down server due to database connection failure");
    process.exit(1);
  });
