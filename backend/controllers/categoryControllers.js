import catchAsyncErrors from "../utils/error/catchAsyncErrors.js";
import ErrorHandler from "../utils/error/errorHandler.js";
import Category from "../models/categoryModel.js";
import { uploadToCloudinary } from "../utils/cloudinary/uploadToCloudinary.js";

// Get all categories — public, flat list (frontend assembles the tree)
export const getAllCategories = catchAsyncErrors(async (req, res, next) => {
  const categories = await Category.find().sort({ name: 1 });
  res.status(200).json({ categories });
});

// Get a single category by ID — public
export const getCategoryById = catchAsyncErrors(async (req, res, next) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return next(new ErrorHandler("Category not found", 404));
  }

  res.status(200).json({ category });
});

// Walks up a category's ancestry chain, returning true if `targetId`
// appears anywhere in it — used to block circular parent assignments.
const wouldCreateCycle = async (categoryId, targetId) => {
  let currentId = targetId;

  // Walk up the chain a bounded number of times as a safety net against
  // any pre-existing bad data looping forever; a healthy tree of
  // reasonable depth will always resolve well within this limit.
  for (let i = 0; i < 50; i++) {
    if (!currentId) return false;
    if (currentId.toString() === categoryId.toString()) return true;

    const current = await Category.findById(currentId).select("parent");
    if (!current || !current.parent) return false;

    currentId = current.parent;
  }

  return true; // hit the safety limit — treat as a cycle to be safe
};

// Create a category — admin only
export const createCategory = catchAsyncErrors(async (req, res, next) => {
  const { name, parent, imageUrl, description } = req.body;

  if (parent) {
    const parentExists = await Category.findById(parent);
    if (!parentExists) {
      return next(new ErrorHandler("Parent category not found", 404));
    }
  }

  const category = await Category.create({
    name,
    parent: parent || null,
    imageUrl,
    description,
    createdBy: req.staff._id,
  });

  res.status(201).json({ success: true, category });
});

// Update a category — admin only
export const updateCategory = catchAsyncErrors(async (req, res, next) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return next(new ErrorHandler("Category not found", 404));
  }

  const { parent } = req.body;

  // If the parent is being changed, validate it exists and doesn't
  // create a circular reference anywhere up the chain.
  if (parent !== undefined && parent !== null) {
    const parentExists = await Category.findById(parent);
    if (!parentExists) {
      return next(new ErrorHandler("Parent category not found", 404));
    }

    const isCycle = await wouldCreateCycle(category._id, parent);
    if (isCycle) {
      return next(
        new ErrorHandler(
          "Cannot set this parent — it would create a circular category structure.",
          400,
        ),
      );
    }
  }

  const updatableFields = [
    "name",
    "parent",
    "imageUrl",
    "description",
    "isActive",
  ];
  updatableFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      category[field] = req.body[field];
    }
  });

  await category.save();

  res.status(200).json({ success: true, category });
});

// Delete a category — admin only
export const deleteCategory = catchAsyncErrors(async (req, res, next) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return next(new ErrorHandler("Category not found", 404));
  }

  // Block deletion if this category has children — deleting a parent
  // out from under its sub-categories would leave them pointing at a
  // non-existent parent. Deactivate instead, or reassign/delete
  // children first.
  const childCount = await Category.countDocuments({ parent: category._id });
  if (childCount > 0) {
    return next(
      new ErrorHandler(
        `Cannot delete this category — it has ${childCount} sub-categor${childCount === 1 ? "y" : "ies"}. Remove or reassign them first.`,
        400,
      ),
    );
  }

  // Same future-proofed Product check as Brand, via mongoose.models.
  const mongoose = (await import("mongoose")).default;
  const Product = mongoose.models.Product;
  if (Product) {
    const productCount = await Product.countDocuments({
      category: category._id,
    });
    if (productCount > 0) {
      return next(
        new ErrorHandler(
          `Cannot delete this category — ${productCount} product(s) are using it. Deactivate it instead.`,
          400,
        ),
      );
    }
  }

  await category.deleteOne();

  res
    .status(200)
    .json({ success: true, message: "Category deleted successfully" });
});

// Upload a category image — admin only
export const uploadCategoryImage = catchAsyncErrors(async (req, res, next) => {
  if (!req.file) {
    return next(new ErrorHandler("No file uploaded", 400));
  }

  const category = await Category.findById(req.params.id);
  if (!category) {
    return next(new ErrorHandler("Category not found", 404));
  }

  const result = await uploadToCloudinary(req.file.buffer, "categories");

  category.imageUrl = result.secure_url;
  await category.save();

  res.status(200).json({ success: true, category });
});
