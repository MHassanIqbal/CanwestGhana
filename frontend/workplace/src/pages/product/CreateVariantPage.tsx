import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { productVariantApi } from "@/api/productVariantApi";
import { APP_ROUTES } from "@/routes/appRoutes";
import PageMeta from "@/meta/PageMeta";
import { PAGE_META_DATA } from "@/meta/pageMetaData";
import type {
  CreateVariantInput,
  ProductVariantAttribute,
} from "@/types/productVariant";
import { ArrowLeft, Plus, X } from "lucide-react";

const CreateVariantPage = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [sku, setSku] = useState("");
  const [priceUsd, setPriceUsd] = useState("");
  const [attributes, setAttributes] = useState<ProductVariantAttribute[]>([
    { name: "", value: "" },
  ]);
  const [error, setError] = useState<string | null>(null);

  const { mutate: createVariant, isPending } = useMutation({
    mutationFn: (input: CreateVariantInput) =>
      productVariantApi.createVariant(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["variant", "list", productId],
      });
      toast.success("Variant created.");
      navigate(APP_ROUTES.productEdit(productId!));
    },
    onError: (err: { message: string }) => {
      setError(err.message ?? "Failed to create variant. Please try again.");
    },
  });

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
    createVariant({
      product: productId!,
      sku,
      attributes: attributes.filter((a) => a.name.trim() && a.value.trim()),
      priceUsd: parsedPrice,
    });
  };

  return (
    <>
      <PageMeta
        title={PAGE_META_DATA.productVariantNew.title}
        description={PAGE_META_DATA.productVariantNew.description}
      />

      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(APP_ROUTES.productEdit(productId!))}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              Add variant
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Stock starts at zero everywhere — add it from the product page
              after.
            </p>
          </div>
        </div>

        <Card className="shadow-sm relative">
          {isPending && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-[2px] rounded-lg">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span className="text-sm text-muted-foreground">Creating…</span>
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
                    placeholder="e.g. TP-X1C-BLK-16GB"
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
                    placeholder="e.g. 1450"
                    value={priceUsd}
                    onChange={(e) => setPriceUsd(e.target.value)}
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Attributes</Label>
                <p className="text-xs text-muted-foreground -mt-1">
                  e.g. Color: Black, RAM: 16GB. Leave blank if this product has
                  no variant attributes.
                </p>
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

              <div className="flex items-center justify-end gap-3 border-t pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(APP_ROUTES.productEdit(productId!))}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Creating…" : "Create variant"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default CreateVariantPage;
