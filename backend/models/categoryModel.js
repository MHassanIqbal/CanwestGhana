import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      maxLength: [50, "Category name cannot exceed 50 characters"],
    },

    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },

    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },

    imageUrl: {
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

// Auto-generate a URL-friendly slug from the name, same pattern as Brand.
categorySchema.pre("validate", function () {
  if (this.isModified("name") || this.isNew) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }
});

// Prevent a category from being its own parent — a direct,
// one-level self-reference check. Deeper circular chains (A -> B -> A)
// are intentionally not checked here, since validating that properly
// requires walking the full ancestry chain — handled instead at the
// controller level, where we have the full picture before saving.
categorySchema.pre("validate", function () {
  if (this.parent && this.parent.toString() === this._id.toString()) {
    throw new Error("A category cannot be its own parent.");
  }
});

export default mongoose.model("Category", categorySchema);
