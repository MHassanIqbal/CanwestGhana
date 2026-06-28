import Counter from "../../models/counterModel.js";
import Staff from "../../models/staffModel.js";
import ProductVariant from "../../models/productVariantModel.js";
import ErrorHandler from "../error/errorHandler.js";
import Product from "../../models/productModel.js";

// Generate a unique proforma number based on the staff's initials and branch slug, with a sequential counter.
export const generateProformaNumber = async (staff) => {
  const firstInitial = staff.firstName?.[0]?.toUpperCase() ?? "X";
  const lastInitial = staff.lastName?.[0]?.toUpperCase() ?? "X";
  const initials = `${firstInitial}${lastInitial}`;

  const branchSlug = staff.branch?.slug?.toUpperCase();
  const prefix = branchSlug ? `CW-${initials}-${branchSlug}` : `CW-${initials}`;

  const key = `proforma:${prefix}`;

  const counter = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  );

  const padded = String(counter.seq).padStart(4, "0");
  return `${prefix}-${padded}`;
};

export const buildVisibilityFilter = async (staff) => {
  if (staff.role === "admin") return {};

  if (staff.role === "manager") {
    if (!staff.branch?._id) {
      return { sender: staff._id };
    }

    const branchEmployees = await Staff.find({
      branch: staff.branch._id,
      role: "employee",
    }).select("_id");

    const employeeIds = branchEmployees.map((e) => e._id);
    return { sender: { $in: [staff._id, ...employeeIds] } };
  }

  return { sender: staff._id };
};

// Compute subtotal, tax, and total for a proforma based on its line items, discount, and tax percentage.
export const computeTotals = (lineItems, discountGhs = 0, taxPercent = 0) => {
  const subtotalGhs = lineItems.reduce((sum, item) => sum + item.totalGhs, 0);
  const taxGhs = ((subtotalGhs - discountGhs) * taxPercent) / 100;
  const totalGhs = subtotalGhs - discountGhs + taxGhs;
  return { subtotalGhs, taxGhs, totalGhs };
};

// Resolve line items to ensure they have the correct product snapshots and pricing, whether they reference a variant or are manual entries.
export const resolveLineItems = async (rawItems, ghsRate) =>
  Promise.all(
    rawItems.map(async (item) => {
      // Case 1: variant selected — price derives from the variant
      if (item.variant) {
        const variant = await ProductVariant.findById(item.variant).populate(
          "product",
          "title",
        );

        if (!variant)
          throw new ErrorHandler(`Variant ${item.variant} not found`, 404);

        const unitPriceGhs = item.unitPriceGhs ?? variant.priceUsd * ghsRate;
        const totalGhs = unitPriceGhs * item.quantity;

        return {
          product: variant.product._id,
          variant: variant._id,
          productSnapshot: {
            name: variant.product.title,
            sku: variant.sku,
            attributes: variant.attributes,
          },
          quantity: item.quantity,
          unitPriceGhs,
          totalGhs,
        };
      }

      // Case 2: product selected, no variant — staff must supply the price,
      // same as manual, but the product link is still tracked
      if (item.product) {
        const product = await Product.findById(item.product).select("title");

        if (!product)
          throw new ErrorHandler(`Product ${item.product} not found`, 404);

        if (item.unitPriceGhs == null) {
          throw new ErrorHandler(
            "A unit price is required when no variant is selected",
            400,
          );
        }

        const unitPriceGhs = item.unitPriceGhs;
        const totalGhs = unitPriceGhs * item.quantity;

        return {
          product: product._id,
          variant: null,
          productSnapshot: {
            name: product.title,
            sku: null,
            attributes: [],
          },
          quantity: item.quantity,
          unitPriceGhs,
          totalGhs,
        };
      }

      // Case 3: fully manual — no product, no variant
      if (!item.productSnapshot?.name) {
        throw new ErrorHandler("Manual line items require a product name", 400);
      }
      if (item.unitPriceGhs == null) {
        throw new ErrorHandler("Manual line items require a unit price", 400);
      }

      const unitPriceGhs = item.unitPriceGhs;
      const totalGhs = unitPriceGhs * item.quantity;

      return {
        product: null,
        variant: null,
        productSnapshot: {
          name: item.productSnapshot.name,
          sku: item.productSnapshot.sku ?? null,
          attributes: item.productSnapshot.attributes ?? [],
        },
        quantity: item.quantity,
        unitPriceGhs,
        totalGhs,
      };
    }),
  );
