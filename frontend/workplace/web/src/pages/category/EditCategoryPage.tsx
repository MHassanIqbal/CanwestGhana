import { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { categoryApi } from "@/api/categoryApi";
import { APP_ROUTES } from "@/routes/appRoutes";
import InlineLoader from "@/components/loader/InlineLoader";
import PageMeta from "@/meta/PageMeta";
import { PAGE_META_DATA } from "@/meta/pageMetaData";
import type { Category, UpdateCategoryInput } from "@/types/category";
import { ArrowLeft, Pencil } from "lucide-react";

const EditCategoryPage = () => {
  const { id } = useParams<{ id: string }>();

  const {
    data: category,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["category", id],
    queryFn: () => categoryApi.getCategoryById(id!),
    enabled: !!id,
  });

  if (isLoading) return <InlineLoader text="Loading category…" />;
  if (isError || !category)
    return <p className="text-sm text-destructive">Category not found.</p>;

  return <EditCategoryForm category={category} />;
};

const EditCategoryForm = ({ category }: { category: Category }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [form, setForm] = useState<UpdateCategoryInput>({
    name: category.name,
    parent: category.parent ?? null,
    description: category.description ?? "",
    isActive: category.isActive,
  });
  const [error, setError] = useState<string | null>(null);

  // All categories for the parent dropdown — filter out self to prevent
  // direct self-assignment (backend also blocks this, but UX-first).
  const { data: allCategories = [] } = useQuery({
    queryKey: ["category", "list"],
    queryFn: () => categoryApi.getAllCategories(),
  });
  const parentOptions = allCategories.filter((c) => c._id !== category._id);

  const { mutate: updateCategory, isPending } = useMutation({
    mutationFn: (input: UpdateCategoryInput) =>
      categoryApi.updateCategory(category._id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["category"] });
      toast.success("Category updated.");
      navigate(APP_ROUTES.category);
    },
    onError: (err: { message: string }) => {
      setError(err.message ?? "Update failed.");
    },
  });

  const { mutate: uploadImage, isPending: isUploadingImage } = useMutation({
    mutationFn: (file: File) => categoryApi.uploadImage(category._id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["category"] });
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

  const handleImageUpload = () => {
    if (imageFile) uploadImage(imageFile);
  };

  const handleCancelImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.name?.trim()) {
      setError("Category name is required.");
      return;
    }
    updateCategory(form);
  };

  return (
    <>
      <PageMeta
        title={PAGE_META_DATA.categoryEdit.title}
        description={PAGE_META_DATA.categoryEdit.description}
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
              {category.name}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Edit category details
            </p>
          </div>
        </div>

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
                {imagePreview || category.imageUrl ? (
                  <img
                    src={imagePreview ?? category.imageUrl}
                    alt={category.name}
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
                  Click the image to choose a new one.
                </p>
                {imageFile && (
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleImageUpload}
                      disabled={isUploadingImage}
                    >
                      {isUploadingImage ? "Uploading…" : "Save image"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleCancelImage}
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
                  {parentOptions.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  The current category is excluded. Circular assignments are
                  blocked.
                </p>
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
                  rows={3}
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
                  onClick={() => navigate(APP_ROUTES.category)}
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
      </div>
    </>
  );
};

export default EditCategoryPage;
