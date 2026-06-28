import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    // The main display name of the product
    title: {
      type: String,
      required: [true, "Product title is required"],
      trim: true,
      maxLength: [150, "Product title cannot exceed 150 characters"],
    },

    // Short blurb used for product cards/listings (typically 1-2 sentences)
    summary: {
      type: String,
      trim: true,
      maxLength: [250, "Summary cannot exceed 250 characters"],
    },

    // The full, detailed product breakdown
    description: {
      type: String,
      trim: true,
      maxLength: [2000, "Description cannot exceed 2000 characters"],
    },

    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },

    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: [true, "Brand is required"],
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },

    images: {
      type: [String],
      default: [],
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

// Updated slug logic to target 'title'
productSchema.pre("validate", function () {
  if ((this.isModified("title") || this.isNew) && this.title) {
    this.slug = this.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }
});

export default mongoose.model("Product", productSchema);
