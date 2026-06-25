import catchAsyncErrors from "../utils/error/catchAsyncErrors.js";
import ErrorHandler from "../utils/error/errorHandler.js";
import Product from "../models/productModel.js";
import ProductVariant from "../models/productVariantModel.js";
import Brand from "../models/brandModel.js";
import Category from "../models/categoryModel.js";
import { uploadToCloudinary } from "../utils/cloudinary/uploadToCloudinary.js";

// Get all products — public, flat list (frontend joins brand/category names,
// same convention as Category's parent lookup)
export const getAllProducts = catchAsyncErrors(async (req, res, next) => {
  const products = await Product.find().sort({ name: 1 });
  res.status(200).json({ products });
});

// Get a single product by ID — public
export const getProductById = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  res.status(200).json({ product });
});

// Create a product — admin/manager only
export const createProduct = catchAsyncErrors(async (req, res, next) => {
  const { name, brand, category, description } = req.body;

  const brandExists = await Brand.findById(brand);
  if (!brandExists) {
    return next(new ErrorHandler("Brand not found", 404));
  }

  const categoryExists = await Category.findById(category);
  if (!categoryExists) {
    return next(new ErrorHandler("Category not found", 404));
  }

  const product = await Product.create({
    name,
    brand,
    category,
    description,
    createdBy: req.staff._id,
  });

  res.status(201).json({ success: true, product });
});

// Update a product — admin/manager only
export const updateProduct = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  const { brand, category } = req.body;

  if (brand !== undefined) {
    const brandExists = await Brand.findById(brand);
    if (!brandExists) {
      return next(new ErrorHandler("Brand not found", 404));
    }
  }

  if (category !== undefined) {
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return next(new ErrorHandler("Category not found", 404));
    }
  }

  const updatableFields = [
    "name",
    "brand",
    "category",
    "description",
    "isActive",
  ];
  updatableFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      product[field] = req.body[field];
    }
  });

  await product.save();

  res.status(200).json({ success: true, product });
});

// Delete a product — admin/manager only
export const deleteProduct = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  // Block deletion if this product still has variants — deleting the
  // parent out from under them would orphan every SKU pointing at it.
  const variantCount = await ProductVariant.countDocuments({
    product: product._id,
  });
  if (variantCount > 0) {
    return next(
      new ErrorHandler(
        `Cannot delete this product — it has ${variantCount} variant(s). Remove them first.`,
        400,
      ),
    );
  }

  await product.deleteOne();

  res
    .status(200)
    .json({ success: true, message: "Product deleted successfully" });
});

// Add an image to a product's gallery — admin/manager only
export const addProductImage = catchAsyncErrors(async (req, res, next) => {
  if (!req.file) {
    return next(new ErrorHandler("No file uploaded", 400));
  }

  const product = await Product.findById(req.params.id);
  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  const result = await uploadToCloudinary(req.file.buffer, "products");

  product.images.push(result.secure_url);
  await product.save();

  res.status(200).json({ success: true, product });
});

// Remove an image from a product's gallery — admin/manager only
export const removeProductImage = catchAsyncErrors(async (req, res, next) => {
  const { imageUrl } = req.body;

  if (!imageUrl) {
    return next(new ErrorHandler("imageUrl is required", 400));
  }

  const product = await Product.findById(req.params.id);
  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  product.images = product.images.filter((url) => url !== imageUrl);
  await product.save();

  res.status(200).json({ success: true, product });
});
