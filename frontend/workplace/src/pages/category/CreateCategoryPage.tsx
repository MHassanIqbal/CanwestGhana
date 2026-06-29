import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { categoryApi } from "@/api/categoryApi";
import { APP_ROUTES } from "@/routes/appRoutes";
import PageMeta from "@/meta/PageMeta";
import { PAGE_META_DATA } from "@/meta/pageMetaData";
import type { Category, CreateCategoryInput } from "@/types/category";
import { ArrowLeft } from "lucide-react";

const CreateCategoryPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<CreateCategoryInput>({
    name: "",
    parent: null,
    description: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [createdCategory, setCreatedCategory] = useState<Category | null>(null);

  const { data: allCategories = [] } = useQuery({
    queryKey: ["category", "list"],
    queryFn: () => categoryApi.getAllCategories(),
  });

  const { mutate: createCategory, isPending } = useMutation({
    mutationFn: (input: CreateCategoryInput) =>
      categoryApi.createCategory(input),
    onSuccess: (category) => {
      queryClient.invalidateQueries({ queryKey: ["category"] });
      toast.success("Category created.");
      setCreatedCategory(category);
    },
    onError: (err: { message: string }) => {
      setError(err.message ?? "Failed to create category. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) {
      setError("Category name is required.");
      return;
    }
    createCategory(form);
  };

  if (createdCategory) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Category created
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {createdCategory.name} has been added. You can add an image now or
            later from the category's edit page.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() =>
              navigate(APP_ROUTES.categoryEdit(createdCategory._id))
            }
          >
            Add an image
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(APP_ROUTES.category)}
          >
            Skip, go to category list
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title={PAGE_META_DATA.categoryNew.title}
        description={PAGE_META_DATA.categoryNew.description}
      />

      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(APP_ROUTES.category)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              Add category
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Create a new category
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
              Category details
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
                  Category name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g. Laptops"
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  disabled={isPending}
                />
              </div>

              <div className="space-y-1.5 max-w-md">
                <Label htmlFor="parent">Parent category</Label>
                <select
                  id="parent"
                  value={form.parent ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      parent: e.target.value || null,
                    }))
                  }
                  disabled={isPending}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
                >
                  <option value="">None (root category)</option>
                  {allCategories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="A short description of this category"
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
                  onClick={() => navigate(APP_ROUTES.category)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Creating…" : "Create category"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default CreateCategoryPage;
