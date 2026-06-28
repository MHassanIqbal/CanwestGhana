import { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { productApi } from "@/api/productApi";
import { productVariantApi } from "@/api/productVariantApi";
import { brandApi } from "@/api/brandApi";
import { categoryApi } from "@/api/categoryApi";
import { locationApi } from "@/api/locationApi";
import { APP_ROUTES } from "@/routes/appRoutes";
import InlineLoader from "@/components/loader/InlineLoader";
import PageMeta from "@/meta/PageMeta";
import { PAGE_META_DATA } from "@/meta/pageMetaData";
import AdjustStockDialog from "@/components/product/AdjustStockDialog";
import type { Product, UpdateProductInput } from "@/types/product";
import type { ProductVariant } from "@/types/productVariant";
import {
  ArrowLeft,
  X,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  PackagePlus,
} from "lucide-react";

const EditProductPage = () => {
  const { id } = useParams<{ id: string }>();

  const {
    data: product,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["product", id],
    queryFn: () => productApi.getProductById(id!),
    enabled: !!id,
  });

  if (isLoading) return <InlineLoader text="Loading product…" />;
  if (isError || !product)
    return <p className="text-sm text-destructive">Product not found.</p>;

  return <EditProductForm product={product} />;
};

const EditProductForm = ({ product }: { product: Product }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Swapped out 'name' for 'title' and added 'summary' field state matching UpdateProductInput
  const [form, setForm] = useState<UpdateProductInput>({
    title: product.title,
    summary: product.summary ?? "",
    brand: product.brand,
    category: product.category,
    description: product.description ?? "",
    isActive: product.isActive,
  });
  const [error, setError] = useState<string | null>(null);
  const [variantToDelete, setVariantToDelete] = useState<ProductVariant | null>(
    null,
  );
  const [variantToAdjust, setVariantToAdjust] = useState<ProductVariant | null>(
    null,
  );

  const { data: allBrands = [] } = useQuery({
    queryKey: ["brand", "list"],
    queryFn: () => brandApi.getAllBrands(),
  });

  const { data: allCategories = [] } = useQuery({
    queryKey: ["category", "list"],
    queryFn: () => categoryApi.getAllCategories(),
  });

  const { data: allLocations = [] } = useQuery({
    queryKey: ["location", "list"],
    queryFn: () => locationApi.getAllLocations(),
  });

  const { data: variants = [], isLoading: isLoadingVariants } = useQuery({
    queryKey: ["variant", "list", product._id],
    queryFn: () => productVariantApi.getAllVariants(product._id),
  });

  const { mutate: updateProduct, isPending } = useMutation({
    mutationFn: (input: UpdateProductInput) =>
      productApi.updateProduct(product._id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product"] });
      toast.success("Product updated.");
    },
    onError: (err: { message: string }) => {
      setError(err.message ?? "Update failed.");
    },
  });

  const { mutate: addImage, isPending: isAddingImage } = useMutation({
    mutationFn: (file: File) => productApi.addImage(product._id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product", product._id] });
      toast.success("Image added.");
    },
    onError: (err: { message: string }) => {
      toast.error(err.message ?? "Failed to add image.");
    },
  });

  const { mutate: removeImage, isPending: isRemovingImage } = useMutation({
    mutationFn: (imageUrl: string) =>
      productApi.removeImage(product._id, imageUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product", product._id] });
      toast.success("Image removed.");
    },
    onError: (err: { message: string }) => {
      toast.error(err.message ?? "Failed to remove image.");
    },
  });

  const { mutate: deleteVariant, isPending: isDeletingVariant } = useMutation({
    mutationFn: (variantId: string) =>
      productVariantApi.deleteVariant(variantId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["variant", "list", product._id],
      });
      toast.success("Variant deleted.");
    },
    onError: (err: { message: string }) => {
      toast.error(err.message ?? "Failed to delete variant.");
    },
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) addImage(file);
    e.target.value = "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    // Updated check constraint context to monitor 'title' instead of 'name'
    if (!form.title?.trim()) {
      setError("Product title is required.");
      return;
    }
    updateProduct(form);
  };

  const confirmDeleteVariant = () => {
    if (variantToDelete) {
      deleteVariant(variantToDelete._id);
      setVariantToDelete(null);
    }
  };

  return (
    <>
      <PageMeta
        title={PAGE_META_DATA.productEdit.title}
        description={PAGE_META_DATA.productEdit.description}
      />

      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(APP_ROUTES.product)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              {product.title}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Edit product, images, and variants
            </p>
          </div>
        </div>

        {/* Images */}
        <Card className="shadow-sm relative">
          {(isAddingImage || isRemovingImage) && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-[2px] rounded-lg">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span className="text-sm text-muted-foreground">Saving…</span>
              </div>
            </div>
          )}
          <CardHeader className="pb-4 border-b">
            <h2 className="text-sm font-medium text-foreground">Images</h2>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              {product.images.map((url) => (
                <div
                  key={url}
                  className="group relative h-24 w-24 rounded-lg border border-border overflow-hidden bg-muted shrink-0"
                >
                  <img
                    src={url}
                    alt={product.title}
                    className="h-full w-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(url)}
                    disabled={isRemovingImage}
                    className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3.5 w-3.5 text-white" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isAddingImage}
                className="h-24 w-24 rounded-lg border border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
              >
                <Plus className="h-5 w-5" />
                <span className="text-xs">Add image</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
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
              Product details
            </h2>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              {/* Title Field instead of Name */}
              <div className="space-y-1.5 max-w-md">
                <Label htmlFor="title">
                  Product title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  disabled={isPending}
                />
              </div>

              {/* New Summary Field */}
              <div className="space-y-1.5 max-w-md">
                <Label htmlFor="summary">Summary</Label>
                <Input
                  id="summary"
                  placeholder="Short listing blurb or key sub-highlight..."
                  value={form.summary}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, summary: e.target.value }))
                  }
                  disabled={isPending}
                />
              </div>

              <div className="grid grid-cols-2 gap-5 max-w-md">
                <div className="space-y-1.5">
                  <Label htmlFor="brand">Brand</Label>
                  <select
                    id="brand"
                    value={form.brand}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, brand: e.target.value }))
                    }
                    disabled={isPending}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
                  >
                    {allBrands.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    value={form.category}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, category: e.target.value }))
                    }
                    disabled={isPending}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
                  >
                    {allCategories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  disabled={isPending}
                  rows={4}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="isActive"
                  type="checkbox"
                  className="h-4 w-4 rounded border-input accent-primary"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, isActive: e.target.checked }))
                  }
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
                  onClick={() => navigate(APP_ROUTES.product)}
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

        {/* Variants */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4 border-b flex flex-row items-center justify-between">
            <h2 className="text-sm font-medium text-foreground">Variants</h2>
            <Button
              size="sm"
              onClick={() =>
                navigate(APP_ROUTES.productVariantNew(product._id))
              }
            >
              <PackagePlus className="mr-2 h-4 w-4" />
              Add variant
            </Button>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoadingVariants && <InlineLoader text="Loading variants…" />}

            {!isLoadingVariants && variants.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No variants yet. Add one to make this product sellable.
              </p>
            )}

            {!isLoadingVariants && variants.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Attributes</TableHead>
                    <TableHead>Price (USD)</TableHead>
                    <TableHead>Total stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {variants.map((variant) => (
                    <TableRow key={variant._id}>
                      <TableCell className="flex items-center gap-3">
                        {variant.imageUrl && (
                          <div className="h-7 w-7 rounded bg-muted flex items-center justify-center overflow-hidden shrink-0">
                            <img
                              src={variant.imageUrl}
                              alt={variant.sku}
                              className="h-full w-full object-contain"
                            />
                          </div>
                        )}
                        <span className="text-sm font-medium text-foreground">
                          {variant.sku}
                        </span>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {variant.attributes.length === 0 ? (
                            <span className="text-xs text-muted-foreground/60">
                              —
                            </span>
                          ) : (
                            variant.attributes.map((attr) => (
                              <Badge
                                key={`${attr.name}-${attr.value}`}
                                variant="secondary"
                                className="text-xs"
                              >
                                {attr.name}: {attr.value}
                              </Badge>
                            ))
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-sm text-muted-foreground">
                        ${variant.priceUsd.toFixed(2)}
                      </TableCell>

                      <TableCell className="text-sm text-muted-foreground">
                        {variant.totalStock}
                      </TableCell>

                      <TableCell>
                        <Badge
                          className={
                            variant.isActive
                              ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-muted text-muted-foreground"
                          }
                        >
                          {variant.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                navigate(
                                  APP_ROUTES.productVariantEdit(
                                    product._id,
                                    variant._id,
                                  ),
                                )
                              }
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setVariantToAdjust(variant)}
                            >
                              <PackagePlus className="mr-2 h-4 w-4" />
                              Adjust stock
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setVariantToDelete(variant)}
                              className="text-red-600 focus:text-red-700"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog
        open={!!variantToDelete}
        onOpenChange={(open) => !open && setVariantToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete variant?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-medium text-foreground">
                {variantToDelete?.sku}
              </span>
              . Deletion is blocked if it still has stock anywhere — zero it out
              first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingVariant}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteVariant}
              disabled={isDeletingVariant}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingVariant ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AdjustStockDialog
        variant={variantToAdjust}
        locations={allLocations.filter((l) => l.isActive)}
        open={!!variantToAdjust}
        onOpenChange={(open) => !open && setVariantToAdjust(null)}
      />
    </>
  );
};

export default EditProductPage;
