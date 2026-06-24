import catchAsyncErrors from "../utils/error/catchAsyncErrors.js";
import ErrorHandler from "../utils/error/errorHandler.js";
import Location from "../models/locationModel.js";

// Get all locations — public, flat list (frontend can filter by type)
export const getAllLocations = catchAsyncErrors(async (req, res, next) => {
  const locations = await Location.find().sort({ name: 1 });
  res.status(200).json({ locations });
});

// Get a single location by ID — public
export const getLocationById = catchAsyncErrors(async (req, res, next) => {
  const location = await Location.findById(req.params.id);

  if (!location) {
    return next(new ErrorHandler("Location not found", 404));
  }

  res.status(200).json({ location });
});

// Create a location — admin/manager only
export const createLocation = catchAsyncErrors(async (req, res, next) => {
  const { name, type, address, city, phone } = req.body;

  const location = await Location.create({
    name,
    type,
    address,
    city,
    phone,
    createdBy: req.staff._id,
  });

  res.status(201).json({ success: true, location });
});

// Update a location — admin/manager only
export const updateLocation = catchAsyncErrors(async (req, res, next) => {
  const location = await Location.findById(req.params.id);

  if (!location) {
    return next(new ErrorHandler("Location not found", 404));
  }

  const updatableFields = [
    "name",
    "type",
    "address",
    "city",
    "phone",
    "isActive",
  ];
  updatableFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      location[field] = req.body[field];
    }
  });

  await location.save();

  res.status(200).json({ success: true, location });
});

// Delete a location — admin/manager only
export const deleteLocation = catchAsyncErrors(async (req, res, next) => {
  const location = await Location.findById(req.params.id);

  if (!location) {
    return next(new ErrorHandler("Location not found", 404));
  }

  // NOTE: once Product/ProductVariant's stock-by-location shape is decided,
  // add the same future-proofed mongoose.models.Product guard used in
  // Brand/Category here, to block deleting a location that still holds
  // stock. Skipped now since that field path isn't finalized yet.

  await location.deleteOne();

  res
    .status(200)
    .json({ success: true, message: "Location deleted successfully" });
});
