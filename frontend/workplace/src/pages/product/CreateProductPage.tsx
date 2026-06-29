import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { productApi } from "@/api/productApi";
import { brandApi } from "@/api/brandApi";
import { categoryApi } from "@/api/categoryApi";
import { APP_ROUTES } from "@/routes/appRoutes";
import PageMeta from "@/meta/PageMeta";
import { PAGE_META_DATA } from "@/meta/pageMetaData";
import type { CreateProductInput } from "@/types/product";
import { ArrowLeft } from "lucide-react";

const CreateProductPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Swapped out 'name' for 'title' and added 'summary'
  const [form, setForm] = useState<CreateProductInput>({
    title: "",
    summary: "",
    brand: "",
    category: "",
    description: "",
  });
  const [error, setError] = useState<string | null>(null);

  const { data: allBrands = [] } = useQuery({
    queryKey: ["brand", "list"],
    queryFn: () => brandApi.getAllBrands(),
  });

  const { data: allCategories = [] } = useQuery({
    queryKey: ["category", "list"],
    queryFn: () => categoryApi.getAllCategories(),
  });

  const { mutate: createProduct, isPending } = useMutation({
    mutationFn: (input: CreateProductInput) => productApi.createProduct(input),
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: ["product"] });
      toast.success("Product created. Add images and variants next.");
      navigate(APP_ROUTES.productEdit(product._id));
    },
    onError: (err: { message: string }) => {
      setError(err.message ?? "Failed to create product. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Updated validation tracking logic
    if (!form.title.trim()) {
      setError("Product title is required.");
      return;
    }
    if (!form.brand) {
      setError("Brand is required.");
      return;
    }
    if (!form.category) {
      setError("Category is required.");
      return;
    }
    createProduct(form);
  };

  return (
    <>
      <PageMeta
        title={PAGE_META_DATA.productNew.title}
        description={PAGE_META_DATA.productNew.description}
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
              Add product
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Create a new product. Variants and images are added after.
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

              {/* Title Field */}
              <div className="space-y-1.5 max-w-md">
                <Label htmlFor="title">
                  Product title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="e.g. ThinkPad X1 Carbon Gen 11"
                  value={form.title}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  disabled={isPending}
                />
              </div>

              {/* Summary Field */}
              <div className="space-y-1.5 max-w-md">
                <Label htmlFor="summary">Summary</Label>
                <Input
                  id="summary"
                  placeholder="e.g. Ultralight 14-inch business laptop with carbon fiber top cover."
                  value={form.summary}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, summary: e.target.value }))
                  }
                  disabled={isPending}
                />
              </div>

              <div className="grid grid-cols-2 gap-5 max-w-md">
                <div className="space-y-1.5">
                  <Label htmlFor="brand">
                    Brand <span className="text-destructive">*</span>
                  </Label>
                  <select
                    id="brand"
                    value={form.brand}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, brand: e.target.value }))
                    }
                    disabled={isPending}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
                  >
                    <option value="">Select brand</option>
                    {allBrands.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="category">
                    Category <span className="text-destructive">*</span>
                  </Label>
                  <select
                    id="category"
                    value={form.category}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, category: e.target.value }))
                    }
                    disabled={isPending}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
                  >
                    <option value="">Select category</option>
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
                  placeholder="Detailed specifications, features, and deep overview..."
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  disabled={isPending}
                  rows={4} // Increased row depth slightly since there is a summary now
                />
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
                  {isPending ? "Creating…" : "Create product"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default CreateProductPage;
