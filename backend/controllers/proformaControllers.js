import crypto from "crypto";
import catchAsyncErrors from "../utils/error/catchAsyncErrors.js";
import ErrorHandler from "../utils/error/errorHandler.js";
import Proforma from "../models/proformaModel.js";
import Product from "../models/productModel.js";
import Company from "../models/companyModel.js";
import {
  generateProformaNumber,
  buildVisibilityFilter,
  computeTotals,
  resolveLineItems,
} from "../utils/proforma/proformaHelper.js";
import { buildProformaPdf } from "../utils/proforma/buildProformaPdf.js";

// Staff-only — creates a new proforma draft, or a duplicate of an existing one
export const createProforma = catchAsyncErrors(async (req, res, next) => {
  const company = await Company.findOne();
  if (!company) return next(new ErrorHandler("Company not found", 404));

  const ghsRate = company.usdToGhsRate;

  const {
    customerSnapshot,
    customer = null,
    lineItems: rawItems,
    discountGhs = 0,
    taxPercent = 0,
  } = req.body;

  if (!customerSnapshot?.name) {
    return next(new ErrorHandler("Customer name is required", 400));
  }

  if (!rawItems?.length) {
    return next(new ErrorHandler("At least one line item is required", 400));
  }

  const lineItems = await resolveLineItems(rawItems, ghsRate);
  const { subtotalGhs, taxGhs, totalGhs } = computeTotals(
    lineItems,
    discountGhs,
    taxPercent,
  );

  const proformaNumber = await generateProformaNumber(req.staff);
  const verificationToken = crypto.randomBytes(32).toString("hex");

  const proforma = await Proforma.create({
    proformaNumber,
    verificationToken,
    sender: req.staff._id,
    customer,
    customerSnapshot,
    lineItems,
    ghsRate,
    subtotalGhs,
    discountGhs,
    taxPercent,
    taxGhs,
    totalGhs,
    createdBy: req.staff._id,
  });

  res.status(201).json({ success: true, proforma });
});

// Staff-only — returns all proformas visible to the staff member
export const getAllProforma = catchAsyncErrors(async (req, res, next) => {
  const filter = await buildVisibilityFilter(req.staff);

  const proformas = await Proforma.find(filter)
    .populate("sender", "firstName lastName email branch")
    .populate("customer", "name email phone")
    .sort({ createdAt: -1 });

  res.status(200).json({ proformas });
});

export const getProformaById = catchAsyncErrors(async (req, res, next) => {
  const filter = await buildVisibilityFilter(req.staff);

  const proforma = await Proforma.findOne({
    _id: req.params.id,
    ...filter,
  })
    .populate("sender", "firstName lastName email branch")
    .populate("customer", "name email phone tin address city")
    .populate("lineItems.variant", "sku attributes imageUrl");

  if (!proforma) return next(new ErrorHandler("Proforma not found", 404));

  res.status(200).json({ proforma });
});

// Staff-only — updates an existing proforma draft (not issued yet)
export const updateProforma = catchAsyncErrors(async (req, res, next) => {
  const filter = await buildVisibilityFilter(req.staff);

  const proforma = await Proforma.findOne({
    _id: req.params.id,
    ...filter,
  });

  if (!proforma) return next(new ErrorHandler("Proforma not found", 404));

  if (proforma.issuedAt) {
    return next(
      new ErrorHandler(
        "This proforma has already been issued and can no longer be edited. Use duplicate to create an editable copy.",
        400,
      ),
    );
  }

  const ghsRate = proforma.ghsRate; // keep original rate, don't re-lock

  const {
    customerSnapshot,
    customer,
    lineItems: rawItems,
    discountGhs,
    taxPercent,
  } = req.body;

  if (customerSnapshot) proforma.customerSnapshot = customerSnapshot;
  if (customer !== undefined) proforma.customer = customer;

  if (rawItems?.length) {
    proforma.lineItems = await resolveLineItems(rawItems, ghsRate);
  }

  if (discountGhs !== undefined) proforma.discountGhs = discountGhs;
  if (taxPercent !== undefined) proforma.taxPercent = taxPercent;

  // Recompute whenever items, discount, OR tax changed — not just items
  if (
    rawItems?.length ||
    discountGhs !== undefined ||
    taxPercent !== undefined
  ) {
    const totals = computeTotals(
      proforma.lineItems,
      proforma.discountGhs,
      proforma.taxPercent,
    );
    proforma.subtotalGhs = totals.subtotalGhs;
    proforma.taxGhs = totals.taxGhs;
    proforma.totalGhs = totals.totalGhs;
  }

  await proforma.save();
  res.status(200).json({ success: true, proforma });
});

// Staff-only — deletes an existing proforma draft (not issued yet)
export const deleteProforma = catchAsyncErrors(async (req, res, next) => {
  const filter = await buildVisibilityFilter(req.staff);
  const proforma = await Proforma.findOne({
    _id: req.params.id,
    ...filter,
  });

  if (!proforma) return next(new ErrorHandler("Proforma not found", 404));

  if (proforma.issuedAt && req.staff.role !== "admin") {
    return next(
      new ErrorHandler(
        "This proforma has already been issued and cannot be deleted, since a customer may hold a verifiable copy of it.",
        403,
      ),
    );
  }

  await proforma.deleteOne();
  res
    .status(200)
    .json({ success: true, message: "Proforma deleted successfully" });
});

// Staff-only — creates a duplicate of an existing proforma draft (not issued yet)
export const duplicateProforma = catchAsyncErrors(async (req, res, next) => {
  const filter = await buildVisibilityFilter(req.staff);
  const original = await Proforma.findOne({ _id: req.params.id, ...filter });
  if (!original) return next(new ErrorHandler("Proforma not found", 404));

  const company = await Company.findOne();
  const ghsRate = company?.usdToGhsRate ?? original.ghsRate; // refresh to today's rate

  const proformaNumber = await generateProformaNumber(req.staff);
  const verificationToken = crypto.randomBytes(32).toString("hex");

  const duplicate = await Proforma.create({
    proformaNumber,
    verificationToken,
    sender: req.staff._id,
    customer: original.customer,
    customerSnapshot: original.customerSnapshot,
    lineItems: original.lineItems.map(
      ({ variant, productSnapshot, quantity, unitPriceGhs, totalGhs }) => ({
        variant,
        productSnapshot,
        quantity,
        unitPriceGhs,
        totalGhs,
      }),
    ),
    ghsRate,
    subtotalGhs: original.subtotalGhs,
    discountGhs: original.discountGhs,
    taxPercent: original.taxPercent,
    taxGhs: original.taxGhs,
    totalGhs: original.totalGhs,
    createdBy: req.staff._id,
    // issuedAt intentionally left unset -> new, editable draft
  });

  res.status(201).json({ success: true, proforma: duplicate });
});

// Staff-only — generates a PDF of the proforma and sends it as a download
export const downloadProformaPdf = catchAsyncErrors(async (req, res, next) => {
  const filter = await buildVisibilityFilter(req.staff);

  const proforma = await Proforma.findOne({ _id: req.params.id, ...filter })
    .populate("sender", "firstName lastName")
    .populate("customer", "name email phone tin address city");

  if (!proforma) return next(new ErrorHandler("Proforma not found", 404));

  const company = await Company.findOne();

  // Stamp issuedAt on first PDF generation (draft → issued transition)
  if (!proforma.issuedAt) {
    proforma.issuedAt = new Date();
    await proforma.save();
  }

  const pdfBuffer = await buildProformaPdf(proforma, company);

  const filename = `${proforma.proformaNumber}.pdf`;

  res.set({
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Content-Length": pdfBuffer.length,
  });

  res.send(pdfBuffer);
});

// Staff-only — confirms a proforma exists in our DB (i.e. genuinely issued by us)
export const verifyProforma = catchAsyncErrors(async (req, res, next) => {
  const proforma = await Proforma.findOne({
    verificationToken: req.params.token,
  }).populate("sender", "firstName lastName");

  if (!proforma) {
    return next(
      new ErrorHandler(
        "No matching record — not issued by us, or the code is invalid",
        404,
      ),
    );
  }

  res.status(200).json({
    success: true,
    proformaNumber: proforma.proformaNumber,
    issuedBy: proforma.sender
      ? `${proforma.sender.firstName} ${proforma.sender.lastName}`
      : null,
    issuedOn: proforma.issuedAt ?? proforma.createdAt,
    customerName: proforma.customerSnapshot.name,
    totalGhs: proforma.totalGhs,
  });
});

// Get unified search options for line-item pickers — public to staff.
// Each active variant becomes one row; each active product with NO active
// variants becomes one placeholder row (so it's still pickable even without
// a variant). Frontend multiplies priceUsd by the live company rate itself,
// same pattern as everywhere else — this endpoint never touches GHS/tax.
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
