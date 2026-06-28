import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
      maxLength: [100, "Name cannot exceed 100 characters"],
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true, // 💎 Added unique constraint
      sparse: true, // 💡 Keeps it unique but allows multiple customers to have NO email
      maxLength: [100, "Email cannot exceed 100 characters"],
    },

    phone: {
      type: String,
      trim: true,
      maxLength: [30, "Phone cannot exceed 30 characters"],
    },

    address: {
      type: String,
      trim: true,
      maxLength: [200, "Address cannot exceed 200 characters"],
    },

    city: {
      type: String,
      trim: true,
      maxLength: [100, "City cannot exceed 100 characters"],
    },

    tin: {
      type: String,
      trim: true,
      unique: true, // 💎 Added unique constraint
      sparse: true, // 💡 Keeps it unique but allows multiple customers to have NO TIN
      maxLength: [50, "TIN cannot exceed 50 characters"],
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Customer", customerSchema);
