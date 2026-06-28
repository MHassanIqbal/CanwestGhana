import catchAsyncErrors from "../utils/error/catchAsyncErrors.js";
import ErrorHandler from "../utils/error/errorHandler.js";
import Product from "../models/productModel.js";
import ProductVariant from "../models/productVariantModel.js";
import Brand from "../models/brandModel.js";
import Category from "../models/categoryModel.js";
import { uploadToCloudinary } from "../utils/cloudinary/uploadToCloudinary.js";

// Get all products — public, flat list (frontend joins brand/category names)
export const getAllProducts = catchAsyncErrors(async (req, res, next) => {
  // Sorted by title instead of name
  const products = await Product.find().sort({ title: 1 });
  res.status(200).json({ products });
});

// Get unified search options for line-item pickers (e.g. proforma creation) —
// staff-only. Each active variant becomes one row; each active product with
// NO active variants becomes one placeholder row, so it's still pickable
// even before a variant exists. Frontend handles USD→GHS conversion itself.
export const getProductSearchOptions = catchAsyncErrors(
  async (req, res, next) => {
    const { q } = req.query;
    const hasSearch = q && q.trim();
    const searchRegex = hasSearch ? new RegExp(q.trim(), "i") : null;

    let matchingProductIds = [];
    if (hasSearch) {
      const matchingProducts = await Product.find({
        isActive: true,
        title: searchRegex,
      }).select("_id");
      matchingProductIds = matchingProducts.map((p) => p._id);
    }

    const variantFilter = { isActive: true };
    if (hasSearch) {
      variantFilter.$or = [
        { sku: searchRegex },
        { product: { $in: matchingProductIds } },
      ];
    }

    const variants = await ProductVariant.find(variantFilter)
      .populate({ path: "product", select: "title isActive" })
      .sort({ sku: 1 })
      .lean();

    const activeVariants = variants.filter((v) => v.product?.isActive);

    const productIdsWithVariants = new Set(
      activeVariants.map((v) => String(v.product._id)),
    );

    const variantOptions = activeVariants.map((v) => ({
      product: v.product._id,
      variant: v._id,
      label: `${v.product.title} — ${v.sku}`,
      title: v.product.title,
      sku: v.sku,
      attributes: v.attributes,
      priceUsd: v.priceUsd,
    }));

    // Active products with zero active variants — still pickable, just
    // without a price/SKU until a variant is added later.
    const placeholderFilter = hasSearch
      ? { _id: { $in: matchingProductIds }, isActive: true }
      : { isActive: true };

    const placeholderProducts = await Product.find(placeholderFilter).lean();

    const placeholderOptions = placeholderProducts
      .filter((p) => !productIdsWithVariants.has(String(p._id)))
      .map((p) => ({
        product: p._id,
        variant: null,
        label: p.title,
        title: p.title,
        sku: null,
        attributes: [],
        priceUsd: null,
      }));

    const options = [...variantOptions, ...placeholderOptions].sort((a, b) =>
      a.title.localeCompare(b.title),
    );

    res.status(200).json({ options });
  },
);

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
  // Destructured title and summary into the request body
  const { title, summary, description, brand, category } = req.body;

  const brandExists = await Brand.findById(brand);
  if (!brandExists) {
    return next(new ErrorHandler("Brand not found", 404));
  }

  const categoryExists = await Category.findById(category);
  if (!categoryExists) {
    return next(new ErrorHandler("Category not found", 404));
  }

  const product = await Product.create({
    title,
    summary,
    description,
    brand,
    category,
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

  // Swapped "name" out for "title" and "summary"
  const updatableFields = [
    "title",
    "summary",
    "description",
    "brand",
    "category",
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

  // Block deletion if this product still has variants
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
