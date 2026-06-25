import { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { productVariantApi } from "@/api/productVariantApi";
import { locationApi } from "@/api/locationApi";
import { APP_ROUTES } from "@/routes/appRoutes";
import InlineLoader from "@/components/loader/InlineLoader";
import PageMeta from "@/meta/PageMeta";
import { PAGE_META_DATA } from "@/meta/pageMetaData";
import AdjustStockDialog from "@/components/product/AdjustStockDialog";
import type {
  ProductVariant,
  ProductVariantAttribute,
  UpdateVariantInput,
} from "@/types/productVariant";
import { ArrowLeft, Plus, X, Pencil, PackagePlus } from "lucide-react";

const EditVariantPage = () => {
  const { productId, variantId } = useParams<{
    productId: string;
    variantId: string;
  }>();

  const {
    data: variant,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["variant", variantId],
    queryFn: () => productVariantApi.getVariantById(variantId!),
    enabled: !!variantId,
  });

  if (isLoading) return <InlineLoader text="Loading variant…" />;
  if (isError || !variant)
    return <p className="text-sm text-destructive">Variant not found.</p>;

  return <EditVariantForm variant={variant} productId={productId!} />;
};

const EditVariantForm = ({
  variant,
  productId,
}: {
  variant: ProductVariant;
  productId: string;
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showAdjustStock, setShowAdjustStock] = useState(false);

  const [sku, setSku] = useState(variant.sku);
  const [priceUsd, setPriceUsd] = useState(String(variant.priceUsd));
  const [isActive, setIsActive] = useState(variant.isActive);
  const [attributes, setAttributes] = useState<ProductVariantAttribute[]>(
    variant.attributes.length > 0
      ? variant.attributes
      : [{ name: "", value: "" }],
  );
  const [error, setError] = useState<string | null>(null);

  const { data: allLocations = [] } = useQuery({
    queryKey: ["location", "list"],
    queryFn: () => locationApi.getAllLocations(),
  });
  const locationMap = Object.fromEntries(
    allLocations.map((l) => [l._id, l.name]),
  );

  const { mutate: updateVariant, isPending } = useMutation({
    mutationFn: (input: UpdateVariantInput) =>
      productVariantApi.updateVariant(variant._id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["variant"] });
      toast.success("Variant updated.");
      navigate(APP_ROUTES.productEdit(productId));
    },
    onError: (err: { message: string }) => {
      setError(err.message ?? "Update failed.");
    },
  });

  const { mutate: uploadImage, isPending: isUploadingImage } = useMutation({
    mutationFn: (file: File) =>
      productVariantApi.uploadImage(variant._id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["variant", variant._id] });
      toast.success("Image updated.");
      setImageFile(null);
      setImagePreview(null);
    },
    onError: (err: { message: string }) => {
      toast.error(err.message ?? "Failed to upload image.");
    },
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const updateAttribute = (
    index: number,
    field: "name" | "value",
    value: string,
  ) => {
    setAttributes((prev) =>
      prev.map((attr, i) => (i === index ? { ...attr, [field]: value } : attr)),
    );
  };

  const addAttributeRow = () =>
    setAttributes((prev) => [...prev, { name: "", value: "" }]);
  const removeAttributeRow = (index: number) =>
    setAttributes((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!sku.trim()) {
      setError("SKU is required.");
      return;
    }
    const parsedPrice = Number(priceUsd);
    if (!priceUsd || Number.isNaN(parsedPrice) || parsedPrice < 0) {
      setError("Enter a valid, non-negative price.");
      return;
    }
    updateVariant({
      sku,
      priceUsd: parsedPrice,
      isActive,
      attributes: attributes.filter((a) => a.name.trim() && a.value.trim()),
    });
  };

  return (
    <>
      <PageMeta
        title={PAGE_META_DATA.productVariantEdit.title}
        description={PAGE_META_DATA.productVariantEdit.description}
      />

      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(APP_ROUTES.productEdit(productId))}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              {variant.sku}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Edit variant details
            </p>
          </div>
        </div>

        {/* Image */}
        <Card className="shadow-sm relative">
          {isUploadingImage && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-[2px] rounded-lg">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span className="text-sm text-muted-foreground">
                  Uploading…
                </span>
              </div>
            </div>
          )}
          <CardHeader className="pb-4 border-b">
            <h2 className="text-sm font-medium text-foreground">Image</h2>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex items-center gap-5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage}
                className="group relative h-20 w-20 rounded-lg border border-border overflow-hidden bg-muted shrink-0 disabled:cursor-not-allowed"
              >
                {imagePreview || variant.imageUrl ? (
                  <img
                    src={imagePreview ?? variant.imageUrl}
                    alt={variant.sku}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">
                      No image
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/50 transition-colors">
                  <Pencil className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />

              <div className="flex-1 space-y-2">
                <p className="text-sm text-foreground">
                  Click the image to choose a new one. Falls back to the
                  product's photos when unset.
                </p>
                {imageFile && (
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => uploadImage(imageFile)}
                      disabled={isUploadingImage}
                    >
                      {isUploadingImage ? "Uploading…" : "Save image"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                      disabled={isUploadingImage}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details */}
        <Card className="shadow-sm relative">
          {isPending && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-[2px] rounded-lg">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span className="text-sm text-muted-foreground">Saving…</span>
              </div>
            </div>
          )}
          <CardHeader className="pb-4 border-b">
            <h2 className="text-sm font-medium text-foreground">
              Variant details
            </h2>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-5 max-w-md">
                <div className="space-y-1.5">
                  <Label htmlFor="sku">
                    SKU <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="sku"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    disabled={isPending}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="priceUsd">
                    Price (USD) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="priceUsd"
                    type="number"
                    min={0}
                    step="0.01"
                    value={priceUsd}
                    onChange={(e) => setPriceUsd(e.target.value)}
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Attributes</Label>
                {attributes.map((attr, index) => (
                  <div key={index} className="flex items-center gap-2 max-w-md">
                    <Input
                      placeholder="Name (e.g. Color)"
                      value={attr.name}
                      onChange={(e) =>
                        updateAttribute(index, "name", e.target.value)
                      }
                      disabled={isPending}
                    />
                    <Input
                      placeholder="Value (e.g. Black)"
                      value={attr.value}
                      onChange={(e) =>
                        updateAttribute(index, "value", e.target.value)
                      }
                      disabled={isPending}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeAttributeRow(index)}
                      disabled={isPending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addAttributeRow}
                  disabled={isPending}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add attribute
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="isActive"
                  type="checkbox"
                  className="h-4 w-4 rounded border-input accent-primary"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  disabled={isPending}
                />
                <Label
                  htmlFor="isActive"
                  className="text-sm font-normal cursor-pointer"
                >
                  Active
                </Label>
              </div>

              <div className="flex items-center justify-end gap-3 border-t pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(APP_ROUTES.productEdit(productId))}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Stock */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4 border-b flex flex-row items-center justify-between">
            <h2 className="text-sm font-medium text-foreground">
              Stock by location ({variant.totalStock} total)
            </h2>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAdjustStock(true)}
            >
              <PackagePlus className="mr-2 h-4 w-4" />
              Adjust stock
            </Button>
          </CardHeader>
          <CardContent className="pt-6">
            {variant.stock.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No stock recorded at any location yet.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Location</TableHead>
                    <TableHead>Quantity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {variant.stock.map((line) => (
                    <TableRow key={line.location}>
                      <TableCell className="text-sm text-foreground">
                        {locationMap[line.location] ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {line.quantity}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <AdjustStockDialog
        variant={variant}
        locations={allLocations.filter((l) => l.isActive)}
        open={showAdjustStock}
        onOpenChange={setShowAdjustStock}
      />
    </>
  );
};

export default EditVariantPage;
