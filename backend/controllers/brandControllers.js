import mongoose from "mongoose";
import catchAsyncErrors from "../utils/error/catchAsyncErrors.js";
import ErrorHandler from "../utils/error/errorHandler.js";
import Brand from "../models/brandModel.js";
import { uploadToCloudinary } from "../utils/cloudinary/uploadToCloudinary.js";

// Get all brands — public
export const getAllBrands = catchAsyncErrors(async (req, res, next) => {
  const brands = await Brand.find().sort({ name: 1 });
  res.status(200).json({ brands });
});

// Get a single brand by ID — public
export const getBrandById = catchAsyncErrors(async (req, res, next) => {
  const brand = await Brand.findById(req.params.id);

  if (!brand) {
    return next(new ErrorHandler("Brand not found", 404));
  }

  res.status(200).json({ brand });
});

// Create a brand — admin only
export const createBrand = catchAsyncErrors(async (req, res, next) => {
  const { name, logoUrl, description } = req.body;

  const existingBrand = await Brand.findOne({ name });
  if (existingBrand) {
    return next(new ErrorHandler("A brand with this name already exists", 400));
  }

  const brand = await Brand.create({
    name,
    logoUrl,
    description,
    createdBy: req.staff._id,
  });

  res.status(201).json({ success: true, brand });
});

// Update a brand — admin only
export const updateBrand = catchAsyncErrors(async (req, res, next) => {
  const brand = await Brand.findById(req.params.id);

  if (!brand) {
    return next(new ErrorHandler("Brand not found", 404));
  }

  const updatableFields = ["name", "logoUrl", "description", "isActive"];
  updatableFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      brand[field] = req.body[field];
    }
  });

  await brand.save();

  res.status(200).json({ success: true, brand });
});

// Delete a brand — admin only
export const deleteBrand = catchAsyncErrors(async (req, res, next) => {
  const brand = await Brand.findById(req.params.id);

  if (!brand) {
    return next(new ErrorHandler("Brand not found", 404));
  }

  // Guard against deleting a brand that's still in use by products.
  // Checked via mongoose.models rather than a direct import, since
  // the Product model doesn't exist yet — this check activates
  // automatically once it does, with no change needed here.
  const Product = mongoose.models.Product;
  if (Product) {
    const productCount = await Product.countDocuments({ brand: brand._id });
    if (productCount > 0) {
      return next(
        new ErrorHandler(
          `Cannot delete this brand — ${productCount} product(s) are using it. Deactivate it instead.`,
          400,
        ),
      );
    }
  }

  await brand.deleteOne();

  res
    .status(200)
    .json({ success: true, message: "Brand deleted successfully" });
});

export const uploadBrandLogo = catchAsyncErrors(async (req, res, next) => {
  if (!req.file) {
    return next(new ErrorHandler("No file uploaded", 400));
  }

  const brand = await Brand.findById(req.params.id);
  if (!brand) {
    return next(new ErrorHandler("Brand not found", 404));
  }

  const result = await uploadToCloudinary(req.file.buffer, "brands");

  brand.logoUrl = result.secure_url;
  await brand.save();

  res.status(200).json({ success: true, brand });
});
