import mongoose from "mongoose";

const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Brand name is required"],
      trim: true,
      unique: true,
      maxLength: [50, "Brand name cannot exceed 50 characters"],
    },

    slug: {
      type: String,
      unique: true,
      lowercase: true,
      // Generated automatically from name — see pre("save") hook below.
      // Not required at the schema level since it's always set
      // programmatically, never supplied directly by the client.
    },

    logoUrl: {
      type: String,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      maxLength: [500, "Description cannot exceed 500 characters"],
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

// Auto-generate a URL-friendly slug from the name whenever it changes.
// Runs before validation so the unique constraint on `slug` is checked
// against the value we're about to actually save.
brandSchema.pre("validate", function () {
  if (this.isModified("name") || this.isNew) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }
});

export default mongoose.model("Brand", brandSchema);
