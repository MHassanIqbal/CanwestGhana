import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { brandApi } from "@/api/brandApi";
import { APP_ROUTES } from "@/routes/appRoutes";
import PageMeta from "@/meta/PageMeta";
import { PAGE_META_DATA } from "@/meta/pageMetaData";
import type { CreateBrandInput, Brand } from "@/types/brand";

const CreateBrandPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<CreateBrandInput>({
    name: "",
    description: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [createdBrand, setCreatedBrand] = useState<Brand | null>(null);

  const { mutate: createBrand, isPending } = useMutation({
    mutationFn: (input: CreateBrandInput) => brandApi.createBrand(input),
    onSuccess: (brand) => {
      queryClient.invalidateQueries({ queryKey: ["brand"] });
      toast.success("Brand created. You can now add a logo.");
      setCreatedBrand(brand);
    },
    onError: (err: { message: string }) => {
      setError(err.message ?? "Failed to create brand. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name) {
      setError("Brand name is required.");
      return;
    }

    createBrand(form);
  };

  // Once created, switch to showing the logo upload step using the
  // existing brand-detail editing experience for consistency, rather
  // than duplicating upload logic here.
  if (createdBrand) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Brand created
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {createdBrand.name} has been added. You can add a logo now or later
            from the brand's edit page.
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={() => navigate(APP_ROUTES.brandDetail(createdBrand._id))}
          >
            Add a logo
          </Button>
          <Button variant="outline" onClick={() => navigate(APP_ROUTES.brand)}>
            Skip, go to brand list
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title={PAGE_META_DATA.brandNew.title}
        description={PAGE_META_DATA.brandNew.description}
      />

      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Add brand</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Create a new brand
          </p>
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
              Brand details
            </h2>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="space-y-1.5 max-w-md">
                <Label htmlFor="name">
                  Brand name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="HP"
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  disabled={isPending}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="A short description of this brand"
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  disabled={isPending}
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(APP_ROUTES.brand)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Creating…" : "Create brand"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default CreateBrandPage;
