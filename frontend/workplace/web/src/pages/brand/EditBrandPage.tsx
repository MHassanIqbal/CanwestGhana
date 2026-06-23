import { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { brandApi } from "@/api/brandApi";
import { APP_ROUTES } from "@/routes/appRoutes";
import InlineLoader from "@/components/loader/InlineLoader";
import PageMeta from "@/meta/PageMeta";
import { PAGE_META_DATA } from "@/meta/pageMetaData";
import type { Brand, UpdateBrandInput } from "@/types/brand";
import { Pencil } from "lucide-react";

const EditBrandPage = () => {
  const { id } = useParams<{ id: string }>();

  const {
    data: brand,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["brand", id],
    queryFn: () => brandApi.getBrandById(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return <InlineLoader text="Loading brand…" />;
  }

  if (isError || !brand) {
    return <p className="text-sm text-destructive">Brand not found.</p>;
  }

  return <EditBrandForm brand={brand} />;
};

const EditBrandForm = ({ brand }: { brand: Brand }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<UpdateBrandInput>({
    name: brand.name,
    description: brand.description ?? "",
    isActive: brand.isActive,
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { mutate: updateBrand, isPending } = useMutation({
    mutationFn: (input: UpdateBrandInput) =>
      brandApi.updateBrand(brand._id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand"] });
      toast.success("Brand updated.");
      navigate(APP_ROUTES.brand);
    },
    onError: (err: { message: string }) => {
      setError(err.message ?? "Update failed.");
    },
  });

  const { mutate: uploadLogo, isPending: isUploadingLogo } = useMutation({
    mutationFn: (file: File) => brandApi.uploadLogo(brand._id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand"] });
      toast.success("Logo updated.");
      setLogoFile(null);
      setLogoPreview(null);
    },
    onError: (err: { message: string }) => {
      toast.error(err.message ?? "Failed to upload logo.");
    },
  });

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleLogoUpload = () => {
    if (logoFile) uploadLogo(logoFile);
  };

  const handleCancelLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name) {
      setError("Brand name is required.");
      return;
    }

    updateBrand(form);
  };

  return (
    <>
      <PageMeta
        title={PAGE_META_DATA.brandEdit.title}
        description={PAGE_META_DATA.brandEdit.description}
      />

      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            {brand.name}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Edit brand details
          </p>
        </div>

        {/* Logo — same click-to-upload pattern as Company */}
        <Card className="shadow-sm relative">
          {isUploadingLogo && (
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
            <h2 className="text-sm font-medium text-foreground">Logo</h2>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex items-center gap-5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingLogo}
                className="group relative h-20 w-20 rounded-lg border border-border overflow-hidden bg-muted shrink-0 disabled:cursor-not-allowed"
              >
                {logoPreview || brand.logoUrl ? (
                  <img
                    src={logoPreview ?? brand.logoUrl}
                    alt={brand.name}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">
                      No logo
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
                onChange={handleLogoSelect}
                className="hidden"
              />

              <div className="flex-1 space-y-2">
                <p className="text-sm text-foreground">
                  Click the logo to choose a new image.
                </p>
                {logoFile && (
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleLogoUpload}
                      disabled={isUploadingLogo}
                    >
                      {isUploadingLogo ? "Uploading…" : "Save logo"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleCancelLogo}
                      disabled={isUploadingLogo}
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
                  onClick={() => navigate(APP_ROUTES.brand)}
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

export default EditBrandPage;
