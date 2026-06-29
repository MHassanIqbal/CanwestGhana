import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { locationApi } from "@/api/locationApi";
import { APP_ROUTES } from "@/routes/appRoutes";
import InlineLoader from "@/components/loader/InlineLoader";
import PageMeta from "@/meta/PageMeta";
import { PAGE_META_DATA } from "@/meta/pageMetaData";
import type { Location, UpdateLocationInput } from "@/types/location";
import { ArrowLeft } from "lucide-react";

const EditLocationPage = () => {
  const { id } = useParams<{ id: string }>();

  const {
    data: location,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["location", id],
    queryFn: () => locationApi.getLocationById(id!),
    enabled: !!id,
  });

  if (isLoading) return <InlineLoader text="Loading location…" />;
  if (isError || !location)
    return <p className="text-sm text-destructive">Location not found.</p>;

  return <EditLocationForm location={location} />;
};

const EditLocationForm = ({ location }: { location: Location }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<UpdateLocationInput>({
    name: location.name,
    type: location.type,
    address: location.address ?? "",
    city: location.city ?? "",
    phone: location.phone ?? "",
    isActive: location.isActive,
  });
  const [error, setError] = useState<string | null>(null);

  const { mutate: updateLocation, isPending } = useMutation({
    mutationFn: (input: UpdateLocationInput) =>
      locationApi.updateLocation(location._id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["location"] });
      toast.success("Location updated.");
      navigate(APP_ROUTES.location);
    },
    onError: (err: { message: string }) => {
      setError(err.message ?? "Update failed.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.name?.trim()) {
      setError("Location name is required.");
      return;
    }
    updateLocation(form);
  };

  return (
    <>
      <PageMeta
        title={PAGE_META_DATA.locationEdit.title}
        description={PAGE_META_DATA.locationEdit.description}
      />

      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(APP_ROUTES.location)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              {location.name}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Edit location details
            </p>
          </div>
        </div>

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
              Location details
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
                  <Label htmlFor="name">
                    Name <span className="text-destructive">*</span>
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
                  <Label htmlFor="type">Type</Label>
                  <select
                    id="type"
                    value={form.type}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        type: e.target.value as UpdateLocationInput["type"],
                      }))
                    }
                    disabled={isPending}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
                  >
                    <option value="warehouse">Warehouse</option>
                    <option value="branch">Branch</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5 max-w-md">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={form.address}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, address: e.target.value }))
                  }
                  disabled={isPending}
                />
              </div>

              <div className="grid grid-cols-2 gap-5 max-w-md">
                <div className="space-y-1.5">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={form.city}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, city: e.target.value }))
                    }
                    disabled={isPending}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="isActive"
                  type="checkbox"
                  className="h-4 w-4 rounded border-input accent-primary"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      isActive: e.target.checked,
                    }))
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
                  onClick={() => navigate(APP_ROUTES.location)}
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

export default EditLocationPage;
