import catchAsyncErrors from "../utils/error/catchAsyncErrors.js";
import ErrorHandler from "../utils/error/errorHandler.js";
import Company from "../models/companyModel.js";
import { uploadToCloudinary } from "../utils/cloudinary/uploadToCloudinary.js";

// Get company info — public, auto-creates a default document on first call
export const getCompany = catchAsyncErrors(async (req, res, next) => {
  let company = await Company.findOne();

  if (!company) {
    company = await Company.create({
      companyName: process.env.DEFAULT_COMPANY_NAME,
      usdToGhsRate: parseFloat(process.env.DEFAULT_USD_TO_GHS_RATE),
      taxRate: parseFloat(process.env.DEFAULT_TAX_RATE),
    });
  }

  res.status(200).json({ company });
});

// Update company info — admin only
export const updateCompany = catchAsyncErrors(async (req, res, next) => {
  let company = await Company.findOne();

  if (!company) {
    return next(
      new ErrorHandler("Company settings have not been initialized yet.", 404),
    );
  }

  const updatableFields = [
    "companyName",
    "slogan",
    "logoUrl",
    "contactEmail",
    "contactPhone",
    "address",
    "usdToGhsRate",
    "taxRate",
    "socialLinks",
    "businessHours",
  ];

  updatableFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      company[field] = req.body[field];
    }
  });

  company.updatedBy = req.staff._id;

  await company.save();

  res.status(200).json({ success: true, company });
});

// Upload or update company logo — admin only
export const uploadCompanyLogo = catchAsyncErrors(async (req, res, next) => {
  if (!req.file) {
    return next(new ErrorHandler("No file uploaded", 400));
  }

  let company = await Company.findOne();
  if (!company) {
    return next(
      new ErrorHandler("Company settings have not been initialized yet.", 404),
    );
  }

  const result = await uploadToCloudinary(req.file.buffer, "company");

  company.logoUrl = result.secure_url;
  company.updatedBy = req.staff._id;
  await company.save();

  res.status(200).json({ success: true, company });
});
