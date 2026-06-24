import mongoose from "mongoose";

const locationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Location name is required"],
      trim: true,
      maxLength: [100, "Location name cannot exceed 100 characters"],
    },

    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },

    // Unified collection for warehouses and branches, distinguished by type
    // rather than separate models — keeps Product's stock references simple
    // (one ref field, one Location collection to populate).
    type: {
      type: String,
      enum: {
        values: ["warehouse", "branch"],
        message: "Type must be either 'warehouse' or 'branch'",
      },
      required: [true, "Location type is required"],
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

    phone: {
      type: String,
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
    },
  },
  { timestamps: true },
);

// Auto-generate a URL-friendly slug from the name, same pattern as Brand/Category.
locationSchema.pre("validate", function () {
  if (this.isModified("name") || this.isNew) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }
});

export default mongoose.model("Location", locationSchema);
