import mongoose from "mongoose";
import { createDefaultAdminIfNotExists } from "../utils/default/createDefaultAdmin.js";

// Connect to MongoDB database
export const connectDatabase = async () => {
  const con = await mongoose.connect(process.env.DB_URI);

  console.log(`MongoDB connected with Host: ${con.connection.host}`);

  try {
    await createDefaultAdminIfNotExists();
  } catch (error) {
    console.error(`❌ Failed to ensure default admin exists: ${error.message}`);
  }
};
