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

  const filter = { isActive: true };

  if (q && q.trim()) {
    const searchRegex = new RegExp(q.trim(), "i");
    const matchingProducts = await Product.find({ name: searchRegex }).select(
      "_id",
    );
    const matchingProductIds = matchingProducts.map((p) => p._id);
    filter.$or = [
      { sku: searchRegex },
      { product: { $in: matchingProductIds } },
    ];
  }

  const variants = await ProductVariant.find(filter)
    .populate({
      path: "product",
      select: "name brand category images isActive",
      populate: [
        { path: "brand", select: "name" },
        { path: "category", select: "name" },
      ],
    })
    .sort({ sku: 1 })
    .lean();

  const company = await Company.findOne().select("usdToGhsRate taxRate");
  const rate = company?.usdToGhsRate ?? 0;
  const taxRate = company?.taxRate ?? 0;

  const results = variants
    .filter((v) => v.product?.isActive)
    .map((v) => {
      const totalStock = v.stock.reduce((sum, line) => sum + line.quantity, 0);

      const priceUsd = v.priceUsd;
      const priceGhs = round2(priceUsd * rate);
      const priceUsdWithTax = round2(priceUsd * (1 + taxRate / 100));
      // Built off the already-rounded GHS figure, not raw USD*rate*tax —
      // matches what a customer actually sees on the no-tax line, rather
      // than carrying invisible sub-pesewa precision into the tax line.
      const priceGhsWithTax = round2(priceGhs * (1 + taxRate / 100));

      return {
        variantId: v._id,
        productId: v.product._id,
        productName: v.product.name,
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

  res.status(200).json({ rate, taxRate, results });
});
