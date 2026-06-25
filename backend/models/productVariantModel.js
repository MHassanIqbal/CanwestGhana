import mongoose from "mongoose";

// Free-form key/value pair, e.g. { name: "Color", value: "Black" }.
// No _id — attributes aren't individually addressed, only read/replaced
// as a whole array.
const attributeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    value: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false },
);

// Per-location stock line. No _id — the `location` ref is the natural
// key for matching/updating a specific line via arrayFilters.
const stockSchema = new mongoose.Schema(
  {
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [0, "Quantity cannot be negative"],
      default: 0,
    },
  },
  { _id: false },
);

const productVariantSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },

    sku: {
      type: String,
      required: [true, "SKU is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },

    attributes: {
      type: [attributeSchema],
      default: [],
    },

    // USD is the single source of truth. GHS is never stored — it's
    // derived at read time from Company.usdToGhsRate, so a rate change
    // instantly reflects everywhere without touching product data.
    priceUsd: {
      type: Number,
      required: [true, "Price (USD) is required"],
      min: [0, "Price cannot be negative"],
    },

    // Per-location stock, now that Location exists. Total stock is
    // intentionally NOT stored — it's a virtual sum below, so there's
    // only ever one number to keep correct.
    stock: {
      type: [stockSchema],
      default: [],
    },

    // Optional override for this specific variant (e.g. the black unit's
    // photo). Falls back to the parent Product's `images` when not set.
    imageUrl: {
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

productVariantSchema.virtual("totalStock").get(function () {
  return this.stock.reduce((sum, line) => sum + line.quantity, 0);
});

productVariantSchema.set("toJSON", { virtuals: true });
productVariantSchema.set("toObject", { virtuals: true });

export default mongoose.model("ProductVariant", productVariantSchema);
