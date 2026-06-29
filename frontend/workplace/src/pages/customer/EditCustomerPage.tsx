import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { customerApi } from "@/api/customerApi";
import { APP_ROUTES } from "@/routes/appRoutes";
import InlineLoader from "@/components/loader/InlineLoader";
import PageMeta from "@/meta/PageMeta";
import { PAGE_META_DATA } from "@/meta/pageMetaData";
import type { Customer, UpdateCustomerInput } from "@/types/customer";
import { ArrowLeft } from "lucide-react";

const EditCustomerPage = () => {
  const { id } = useParams<{ id: string }>();

  const {
    data: customer,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["customer", id],
    queryFn: () => customerApi.getCustomerById(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return <InlineLoader text="Loading customer profile…" />;
  }

  if (isError || !customer) {
    return <p className="text-sm text-destructive">Customer not found.</p>;
  }

  return <EditCustomerForm customer={customer} />;
};

const EditCustomerForm = ({ customer }: { customer: Customer }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Controlled UI input elements tracking state via string fallbacks
  const [name, setName] = useState(customer.name);
  const [phone, setPhone] = useState(customer.phone ?? "");
  const [email, setEmail] = useState(customer.email ?? "");
  const [tin, setTin] = useState(customer.tin ?? "");
  const [address, setAddress] = useState(customer.address ?? "");
  const [city, setCity] = useState(customer.city ?? "");

  const [error, setError] = useState<string | null>(null);

  const { mutate: updateCustomer, isPending } = useMutation({
    mutationFn: (input: UpdateCustomerInput) =>
      customerApi.updateCustomer(customer._id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer"] });
      toast.success("Customer profile updated.");
      navigate(APP_ROUTES.customer);
    },
    onError: (err: { message: string }) => {
      setError(err.message ?? "Update failed.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Customer name is required.");
      return;
    }

    // Convert blank input strings back into clean database null values
    const payload: UpdateCustomerInput = {
      name: name.trim(),
      phone: phone.trim() || null,
      email: email.trim() || null,
      tin: tin.trim() || null,
      address: address.trim() || null,
      city: city.trim() || null,
    };

    updateCustomer(payload);
  };

  return (
    <>
      <PageMeta
        title={PAGE_META_DATA.customerEdit.title}
        description={PAGE_META_DATA.customerEdit.description}
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
              {customer.name}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Edit customer account information
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
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isPending}
                />
              </div>

              <div className="space-y-1.5 max-w-md">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isPending}
                />
              </div>

              <div className="space-y-1.5 max-w-md">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isPending}
                />
              </div>

              <div className="space-y-1.5 max-w-md">
                <Label htmlFor="tin">TIN</Label>
                <Input
                  id="tin"
                  value={tin}
                  onChange={(e) => setTin(e.target.value)}
                  disabled={isPending}
                />
              </div>

              <div className="space-y-1.5 max-w-md">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  disabled={isPending}
                />
              </div>

              <div className="space-y-1.5 max-w-md">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
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

export default EditCustomerPage;
