import mongoose from "mongoose";

const lineItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },

    variant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductVariant",
      default: null,
    },

    // Frozen snapshot — survives product edits/deletions
    productSnapshot: {
      name: { type: String, required: true },
      sku: { type: String, default: null },
      attributes: [
        {
          name: String,
          value: String,
          _id: false,
        },
      ],
    },

    quantity: {
      type: Number,
      required: true,
      min: [1, "Quantity must be at least 1"],
    },

    unitPriceGhs: {
      type: Number,
      required: true,
      min: [0, "Unit price cannot be negative"],
    },

    totalGhs: {
      type: Number,
      required: true,
      min: [0, "Total cannot be negative"],
    },
  },
  { _id: true },
);

const customerSnapshotSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, default: null },
    phone: { type: String, default: null },
    address: { type: String, default: null },
    city: { type: String, default: null },
    tin: { type: String, default: null },
  },
  { _id: false },
);

const proformaSchema = new mongoose.Schema(
  {
    proformaNumber: {
      type: String,
      unique: true,
      index: true,
    },

    verificationToken: {
      type: String,
      unique: true,
      index: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
      index: true,
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
    },

    customerSnapshot: {
      type: customerSnapshotSchema,
      required: true,
    },

    lineItems: {
      type: [lineItemSchema],
      validate: {
        validator: (v) => v.length > 0,
        message: "At least one line item is required",
      },
    },

    ghsRate: {
      type: Number,
      required: true,
      min: [0, "GHS rate cannot be negative"],
    },

    subtotalGhs: {
      type: Number,
      required: true,
      min: [0, "Subtotal cannot be negative"],
    },

    discountGhs: {
      type: Number,
      default: 0,
      min: [0, "Discount cannot be negative"],
    },

    taxPercent: {
      type: Number,
      default: 0,
      min: [0, "Tax cannot be negative"],
      max: [100, "Tax cannot exceed 100%"],
    },

    taxGhs: {
      type: Number,
      default: 0,
      min: [0, "Tax amount cannot be negative"],
    },

    totalGhs: {
      type: Number,
      required: true,
      min: [0, "Total cannot be negative"],
    },

    issuedAt: {
      type: Date,
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Proforma", proformaSchema);
