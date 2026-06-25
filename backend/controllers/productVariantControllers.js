import catchAsyncErrors from "../utils/error/catchAsyncErrors.js";
import ErrorHandler from "../utils/error/errorHandler.js";
import ProductVariant from "../models/productVariantModel.js";
import Product from "../models/productModel.js";
import Location from "../models/locationModel.js";
import { uploadToCloudinary } from "../utils/cloudinary/uploadToCloudinary.js";

// Get all variants — public. Optional ?product=<id> to scope to one product.
export const getAllVariants = catchAsyncErrors(async (req, res, next) => {
  const filter = {};
  if (req.query.product) {
    filter.product = req.query.product;
  }

  const variants = await ProductVariant.find(filter).sort({ sku: 1 });
  res.status(200).json({ variants });
});

// Get a single variant by ID — public
export const getVariantById = catchAsyncErrors(async (req, res, next) => {
  const variant = await ProductVariant.findById(req.params.id);

  if (!variant) {
    return next(new ErrorHandler("Variant not found", 404));
  }

  res.status(200).json({ variant });
});

// Create a variant — admin/manager only
export const createVariant = catchAsyncErrors(async (req, res, next) => {
  const { product, sku, attributes, priceUsd } = req.body;

  const productExists = await Product.findById(product);
  if (!productExists) {
    return next(new ErrorHandler("Product not found", 404));
  }

  // Stock is never accepted here — every variant starts empty everywhere
  // and is stocked deliberately via PUT /:id/stock, so there's always an
  // explicit, attributable trail for how units got there.
  const variant = await ProductVariant.create({
    product,
    sku,
    attributes,
    priceUsd,
    createdBy: req.staff._id,
  });

  res.status(201).json({ success: true, variant });
});

// Update a variant — admin/manager only. Stock is intentionally excluded;
// use PUT /:id/stock instead.
export const updateVariant = catchAsyncErrors(async (req, res, next) => {
  const variant = await ProductVariant.findById(req.params.id);

  if (!variant) {
    return next(new ErrorHandler("Variant not found", 404));
  }

  const updatableFields = ["sku", "attributes", "priceUsd", "isActive"];
  updatableFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      variant[field] = req.body[field];
    }
  });

  await variant.save();

  res.status(200).json({ success: true, variant });
});

// Delete a variant — admin/manager only
export const deleteVariant = catchAsyncErrors(async (req, res, next) => {
  const variant = await ProductVariant.findById(req.params.id);

  if (!variant) {
    return next(new ErrorHandler("Variant not found", 404));
  }

  // Block deletion while stock remains anywhere — deleting would silently
  // erase units presumably still sitting in a real location. Zero it out
  // via the stock endpoint first.
  const totalStock = variant.stock.reduce(
    (sum, line) => sum + line.quantity,
    0,
  );
  if (totalStock > 0) {
    return next(
      new ErrorHandler(
        `Cannot delete this variant — it still has ${totalStock} unit(s) in stock. Zero out stock first.`,
        400,
      ),
    );
  }

  await variant.deleteOne();

  res
    .status(200)
    .json({ success: true, message: "Variant deleted successfully" });
});

// Adjust stock at a single location — admin/manager only. This is the
// only entry point that changes stock numbers post-creation, so every
// change is deliberate and has a clear place to hang an audit log later
// if that's ever needed.
export const adjustStock = catchAsyncErrors(async (req, res, next) => {
  const { location, action, quantity } = req.body;

  if (!location || !action || quantity === undefined) {
    return next(
      new ErrorHandler("location, action, and quantity are required", 400),
    );
  }

  if (!["add", "remove", "set"].includes(action)) {
    return next(
      new ErrorHandler("action must be 'add', 'remove', or 'set'", 400),
    );
  }

  if (typeof quantity !== "number" || quantity < 0) {
    return next(
      new ErrorHandler("quantity must be a non-negative number", 400),
    );
  }

  const locationExists = await Location.findById(location);
  if (!locationExists) {
    return next(new ErrorHandler("Location not found", 404));
  }

  const variant = await ProductVariant.findById(req.params.id);
  if (!variant) {
    return next(new ErrorHandler("Variant not found", 404));
  }

  const stockLine = variant.stock.find(
    (line) => line.location.toString() === location.toString(),
  );

  if (action === "set") {
    if (stockLine) {
      stockLine.quantity = quantity;
    } else {
      variant.stock.push({ location, quantity });
    }
  } else if (action === "add") {
    if (stockLine) {
      stockLine.quantity += quantity;
    } else {
      variant.stock.push({ location, quantity });
    }
  } else if (action === "remove") {
    if (!stockLine || stockLine.quantity < quantity) {
      return next(
        new ErrorHandler(
          "Cannot remove more stock than currently exists at this location",
          400,
        ),
      );
    }
    stockLine.quantity -= quantity;
  }

  await variant.save();

  res.status(200).json({ success: true, variant });
});

// Upload/replace a variant's image — admin/manager only
export const uploadVariantImage = catchAsyncErrors(async (req, res, next) => {
  if (!req.file) {
    return next(new ErrorHandler("No file uploaded", 400));
  }

  const variant = await ProductVariant.findById(req.params.id);
  if (!variant) {
    return next(new ErrorHandler("Variant not found", 404));
  }

  const result = await uploadToCloudinary(req.file.buffer, "products/variants");

  variant.imageUrl = result.secure_url;
  await variant.save();

  res.status(200).json({ success: true, variant });
});
