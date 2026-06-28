import catchAsyncErrors from "../utils/error/catchAsyncErrors.js";
import ErrorHandler from "../utils/error/errorHandler.js";
import Customer from "../models/customerModel.js";

export const createCustomer = catchAsyncErrors(async (req, res, next) => {
  const { name, email, phone, address, city, tin } = req.body;

  const customer = await Customer.create({
    name,
    email,
    phone,
    address,
    city,
    tin,
    createdBy: req.staff._id,
  });

  res.status(201).json({ success: true, customer });
});

export const getAllCustomers = catchAsyncErrors(async (req, res, next) => {
  const customers = await Customer.find().sort({ name: 1 });
  res.status(200).json({ customers });
});

export const getCustomerById = catchAsyncErrors(async (req, res, next) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) return next(new ErrorHandler("Customer not found", 404));
  res.status(200).json({ customer });
});

export const updateCustomer = catchAsyncErrors(async (req, res, next) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) return next(new ErrorHandler("Customer not found", 404));

  const fields = ["name", "email", "phone", "address", "city", "tin"];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) customer[f] = req.body[f];
  });

  await customer.save();
  res.status(200).json({ success: true, customer });
});

export const deleteCustomer = catchAsyncErrors(async (req, res, next) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) return next(new ErrorHandler("Customer not found", 404));

  await customer.deleteOne();
  res.status(200).json({ success: true, message: "Customer deleted" });
});
