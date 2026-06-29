import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { customerApi } from "@/api/customerApi";
import { APP_ROUTES } from "@/routes/appRoutes";
import PageMeta from "@/meta/PageMeta";
import { PAGE_META_DATA } from "@/meta/pageMetaData";
import type { CreateCustomerInput } from "@/types/customer";
import { ArrowLeft } from "lucide-react";

const CreateCustomerPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<CreateCustomerInput>({
    name: "",
    phone: "",
    email: "",
    tin: "",
    address: "",
    city: "",
  });
  const [error, setError] = useState<string | null>(null);

  const { mutate: createCustomer, isPending } = useMutation({
    mutationFn: (input: CreateCustomerInput) =>
      customerApi.createCustomer(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer"] });
      toast.success("Customer created.");
      navigate(APP_ROUTES.customer);
    },
    onError: (err: { message: string }) => {
      setError(err.message ?? "Failed to create customer. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError("Customer name is required.");
      return;
    }

    createCustomer(form);
  };

  return (
    <>
      <PageMeta
        title={PAGE_META_DATA.customerNew.title}
        description={PAGE_META_DATA.customerNew.description}
      />

      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(APP_ROUTES.customer)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              Add customer
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Create a new customer profile
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
              Customer details
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
                  Customer name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Acme Ltd"
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  disabled={isPending}
                />
              </div>

              <div className="space-y-1.5 max-w-md">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  placeholder="+233 …"
                  value={form.phone ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      phone: e.target.value || null,
                    }))
                  }
                  disabled={isPending}
                />
              </div>

              <div className="space-y-1.5 max-w-md">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="info@acme.com"
                  value={form.email ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      email: e.target.value || null,
                    }))
                  }
                  disabled={isPending}
                />
              </div>

              <div className="space-y-1.5 max-w-md">
                <Label htmlFor="tin">TIN</Label>
                <Input
                  id="tin"
                  placeholder="Tax identification number"
                  value={form.tin ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      tin: e.target.value || null,
                    }))
                  }
                  disabled={isPending}
                />
              </div>

              <div className="space-y-1.5 max-w-md">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  placeholder="123 Street Ave"
                  value={form.address ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      address: e.target.value || null,
                    }))
                  }
                  disabled={isPending}
                />
              </div>

              <div className="space-y-1.5 max-w-md">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="Accra"
                  value={form.city ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      city: e.target.value || null,
                    }))
                  }
                  disabled={isPending}
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(APP_ROUTES.customer)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Creating…" : "Create customer"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default CreateCustomerPage;
