import mongoose from "mongoose";

const businessHoursSchema = new mongoose.Schema(
  {
    monday: {
      open: String,
      close: String,
      closed: { type: Boolean, default: false },
    },
    tuesday: {
      open: String,
      close: String,
      closed: { type: Boolean, default: false },
    },
    wednesday: {
      open: String,
      close: String,
      closed: { type: Boolean, default: false },
    },
    thursday: {
      open: String,
      close: String,
      closed: { type: Boolean, default: false },
    },
    friday: {
      open: String,
      close: String,
      closed: { type: Boolean, default: false },
    },
    saturday: {
      open: String,
      close: String,
      closed: { type: Boolean, default: false },
    },
    sunday: {
      open: String,
      close: String,
      closed: { type: Boolean, default: true },
    },
  },
  { _id: false },
);

const companySchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
      maxLength: [100, "Company name cannot exceed 100 characters"],
    },

    slogan: {
      type: String,
      trim: true,
      maxLength: [150, "Slogan cannot exceed 150 characters"],
    },

    logoUrl: {
      type: String,
      trim: true,
    },

    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },

    contactPhone: {
      type: String,
      trim: true,
    },

    address: {
      type: String,
      trim: true,
    },

    // Canonical product prices are stored in USD; this rate converts
    // to GHS at display time. Changing this value updates every
    // displayed price instantly, since prices are computed on read,
    // never stored pre-converted.
    usdToGhsRate: {
      type: Number,
      required: [true, "Exchange rate is required"],
      min: [0, "Exchange rate must be a positive number"],
    },

    taxRate: {
      type: Number,
      default: 0,
      min: [0, "Tax rate cannot be negative"],
      max: [100, "Tax rate cannot exceed 100%"],
    },

    socialLinks: {
      facebook: { type: String, trim: true },
      instagram: { type: String, trim: true },
      twitter: { type: String, trim: true },
      linkedin: { type: String, trim: true },
      whatsapp: { type: String, trim: true },
    },

    businessHours: businessHoursSchema,

    defaultTerms: {
      type: String,
      trim: true,
      default: null,
    },

    // Tracks which admin last changed company settings — useful audit
    // trail given usdToGhsRate directly affects displayed pricing.
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Company", companySchema);
