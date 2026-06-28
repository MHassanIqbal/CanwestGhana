import catchAsyncErrors from "../utils/error/catchAsyncErrors.js";
import ProductVariant from "../models/productVariantModel.js";
import Product from "../models/productModel.js";
import Company from "../models/companyModel.js";

const round2 = (value) => Math.round(value * 100) / 100;

// All active variants by default; `q` narrows by SKU or product name.
// Open to every staff role — no authorizeRoles gate, since checking a
// price isn't a privileged action. Tax/rate management stays admin-only
// via Company settings; this endpoint only ever reads them.
export const getPriceList = catchAsyncErrors(async (req, res, next) => {
  const { q } = req.query;
  const hasSearch = q && q.trim();
  const searchRegex = hasSearch ? new RegExp(q.trim(), "i") : null;

  // When searching, narrow to active products whose title matches —
  // their variants (if any) get pulled in via the $or below, and any
  // matching products with zero variants still show up via the
  // placeholder pass further down.
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
    .populate({
      path: "product",
      select: "title brand category images isActive",
      populate: [
        { path: "brand", select: "name" },
        { path: "category", select: "name" },
      ],
    })
    .sort({ sku: 1 })
    .lean();

  const activeVariants = variants.filter((v) => v.product?.isActive);

  // Products already represented by a variant row — skip them in the
  // placeholder pass below so they don't show up twice.
  const productIdsWithVariants = new Set(
    activeVariants.map((v) => String(v.product._id)),
  );

  const company = await Company.findOne().select("usdToGhsRate taxRate");
  const rate = company?.usdToGhsRate ?? 0;
  const taxRate = company?.taxRate ?? 0;

  const variantResults = activeVariants.map((v) => {
    const totalStock = v.stock.reduce((sum, line) => sum + line.quantity, 0);
    const priceUsd = v.priceUsd;
    const priceGhs = round2(priceUsd * rate);
    const priceUsdWithTax = round2(priceUsd * (1 + taxRate / 100));
    const priceGhsWithTax = round2(priceGhs * (1 + taxRate / 100));

    return {
      variantId: v._id,
      productId: v.product._id,
      productName: v.product.title,
      brandName: v.product.brand?.name ?? null,
      categoryName: v.product.category?.name ?? null,
      sku: v.sku,
      attributes: v.attributes,
      imageUrl: v.imageUrl || v.product.images?.[0] || null,
      priceUsd,
      priceGhs,
      priceUsdWithTax,
      priceGhsWithTax,
      totalStock,
    };
  });

  // Products with no variants yet — show them anyway, just without
  // price/SKU/stock data, so they're not invisible until a variant is added.
  const placeholderProductFilter = hasSearch
    ? { _id: { $in: matchingProductIds }, isActive: true }
    : { isActive: true };

  const placeholderProducts = await Product.find(placeholderProductFilter)
    .populate("brand", "name")
    .populate("category", "name")
    .lean();

  const placeholderResults = placeholderProducts
    .filter((p) => !productIdsWithVariants.has(String(p._id)))
    .map((p) => ({
      variantId: null,
      productId: p._id,
      productName: p.title,
      brandName: p.brand?.name ?? null,
      categoryName: p.category?.name ?? null,
      sku: null,
      attributes: [],
      imageUrl: p.images?.[0] || null,
      priceUsd: null,
      priceGhs: null,
      priceUsdWithTax: null,
      priceGhsWithTax: null,
      totalStock: 0,
    }));

  const results = [...variantResults, ...placeholderResults].sort((a, b) =>
    a.productName.localeCompare(b.productName),
  );

  res.status(200).json({ rate, taxRate, results });
});
