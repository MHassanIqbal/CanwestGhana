import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const staffSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First Name is Required"],
      maxLength: [20, "First Name Cannot Exceed 20 Characters"],
      trim: true,
      set: (value) =>
        value ? value.charAt(0).toUpperCase() + value.slice(1) : value,
    },

    middleName: {
      type: String,
      trim: true,
      maxLength: [20, "Middle name cannot exceed 20 characters"],
      set: (value) =>
        value ? value.charAt(0).toUpperCase() + value.slice(1) : "",
    },

    lastName: {
      type: String,
      required: [true, "Last Name is Required"],
      maxLength: [20, "Last Name Cannot Exceed 20 Characters"],
      trim: true,
      set: (value) =>
        value ? value.charAt(0).toUpperCase() + value.slice(1) : value,
    },

    email: {
      type: String,
      required: [true, "Email is Required"],
      maxLength: [50, "Email Cannot Exceed 50 Characters"],
      trim: true,
      lowercase: true,
      unique: true,
      validate: {
        validator: function (value) {
          return /^[\w-\.]+@canwestghana\.com$/.test(value);
        },
        message:
          "Invalid email format. Only @canwestghana.com emails are allowed.",
      },
    },

    password: {
      type: String,
      required: [true, "Password is Required"],
      select: false,
      validate: {
        validator: function (value) {
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
            value,
          );
        },
        message:
          "Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.",
      },
    },

    role: {
      type: String,
      enum: ["admin", "manager", "employee"],
      default: "employee",
      required: [true, "Role is required"],
      lowercase: true,
    },

    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      default: null,
      index: true, // looked up often once invoice visibility filters by it
    },

    resetPasswordToken: {
      type: String,
      select: false,
    },

    resetPasswordExpire: {
      type: Date,
      select: false,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// Ensure password and reset-token fields never serialize into any JSON
// response, regardless of which controller sends the document — this is
// a safety net on top of `select: false`, since explicit `.select("+password")`
// calls (e.g. during login) bypass that default.
staffSchema.methods.toJSON = function () {
  const staff = this.toObject();
  delete staff.password;
  delete staff.resetPasswordToken;
  delete staff.resetPasswordExpire;
  return staff;
};

// Encrypt password before saving
staffSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 12);
});

// Compare password
staffSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Return JWT token
staffSchema.methods.getJwtToken = function (rememberMe) {
  const expiresIn = rememberMe
    ? process.env.JWT_EXPIRES_TIME || "7d"
    : process.env.JWT_EXPIRES_SHORT_TIME || "1d";

  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn,
  });
};

// Permission control — staff accounts can only be created by an admin
staffSchema.methods.canCreateStaff = function () {
  return this.role === "admin";
};

// Can this staff member update/delete the target staff record?
// - Admins can manage anyone.
// - Anyone can manage themselves (subject to field-level restrictions
//   enforced in the controller, e.g. role can't be self-escalated).
// - Managers can manage only the employees they personally created.
staffSchema.methods.canManageStaff = function (targetStaff) {
  if (this.role === "admin") return true;
  if (this._id.toString() === targetStaff._id.toString()) return true;
  if (
    this.role === "manager" &&
    targetStaff.role === "employee" &&
    targetStaff.createdBy?.toString() === this._id.toString()
  ) {
    return true;
  }
  return false;
};

// Generate reset password token
staffSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.resetPasswordExpire = Date.now() + 3600000;
  return resetToken;
};

export default mongoose.model("Staff", staffSchema);
