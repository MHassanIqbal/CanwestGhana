import { useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { proformaApi } from "@/api/proformaApi";
import { customerApi } from "@/api/customerApi";
import { productApi } from "@/api/productApi";
import { companyApi } from "@/api/companyApi";
import { APP_ROUTES } from "@/routes/appRoutes";
import PageMeta from "@/meta/PageMeta";
import { PAGE_META_DATA } from "@/meta/pageMetaData";
import type {
  UpdateProformaInput,
  CustomerSnapshot,
  LineItemInput,
  Proforma,
} from "@/types/proforma";
import type { Customer } from "@/types/customer";
import type { ProductSearchOption } from "@/types/product";
import {
  ArrowLeft,
  Plus,
  Trash2,
  ChevronsUpDown,
  Loader2,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import FullPageLoader from "@/components/loader/FullPageLoader";
import InlineLoader from "@/components/loader/InlineLoader";

// ── local types ────────────────────────────────────────────────────────────

interface LineItemDraft extends LineItemInput {
  _key: string;
  isManual: boolean;
  optionLabel: string;
}

// ── helpers ────────────────────────────────────────────────────────────────

const emptyLineItem = (): LineItemDraft => ({
  _key: crypto.randomUUID(),
  isManual: true,
  product: null,
  variant: null,
  optionLabel: "",
  productSnapshot: { name: "", sku: null, attributes: [] },
  quantity: 1,
  unitPriceGhs: 0,
});

const formatGhs = (amount: number) =>
  `GHS ${amount.toLocaleString("en-GH", { minimumFractionDigits: 2 })}`;

const round2 = (n: number) => Math.round(n * 100) / 100;

// ── loader / lock wrapper ───────────────────────────────────────────────────

const EditProformaPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: proforma,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["proforma", id],
    queryFn: () => proformaApi.getProformaById(id!),
    enabled: !!id,
  });

  const { mutate: duplicateProforma, isPending: isDuplicating } = useMutation({
    mutationFn: () => proformaApi.duplicateProforma(id!),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["proforma"] });
      toast.success("Duplicate created — now editable.");
      navigate(APP_ROUTES.proformaEdit(created._id));
    },
    onError: (err: { message: string }) => {
      toast.error(err.message ?? "Failed to duplicate proforma.");
    },
  });

  if (isLoading) return <InlineLoader text="Loading proforma…" />;
  if (isError || !proforma)
    return <p className="text-sm text-destructive">Proforma not found.</p>;

  if (proforma.issuedAt) {
    return (
      <>
        <PageMeta
          title={PAGE_META_DATA.proformaEdit.title}
          description={PAGE_META_DATA.proformaEdit.description}
        />
        {isDuplicating && <FullPageLoader />}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(APP_ROUTES.proforma)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-semibold text-foreground">
              {proforma.proformaNumber}
            </h1>
          </div>
          <Card className="shadow-sm">
            <CardContent className="pt-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                This proforma was issued on{" "}
                {format(new Date(proforma.issuedAt), "dd MMM yyyy")} and can no
                longer be edited. Create a duplicate to make changes — it gets a
                new number and starts as an editable draft.
              </p>
              <Button
                onClick={() => duplicateProforma()}
                disabled={isDuplicating}
              >
                {isDuplicating ? "Duplicating…" : "Duplicate to edit"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return <EditProformaForm proforma={proforma} />;
};

// ── main form ──────────────────────────────────────────────────────────────

const EditProformaForm = ({ proforma }: { proforma: Proforma }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Customer
  const [customerSnapshot, setCustomerSnapshot] = useState<CustomerSnapshot>(
    proforma.customerSnapshot,
  );
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    proforma.customer?._id ?? null,
  );
  const [customerPopoverOpen, setCustomerPopoverOpen] = useState(false);

  // Line items
  const [lineItems, setLineItems] = useState<LineItemDraft[]>(
    proforma.lineItems.map((item) => ({
      _key: item._id,
      isManual: !item.product,
      product: item.product,
      variant: item.variant,
      optionLabel: item.product
        ? item.productSnapshot.sku
          ? `${item.productSnapshot.name} — ${item.productSnapshot.sku}`
          : item.productSnapshot.name
        : "",
      productSnapshot: item.productSnapshot,
      quantity: item.quantity,
      unitPriceGhs: item.unitPriceGhs,
    })),
  );

  // Product/variant search popovers
  const [optionPopoverOpen, setOptionPopoverOpen] = useState<
    Record<string, boolean>
  >({});

  const [error, setError] = useState<string | null>(null);

  // ── queries ───────────────────────────────────────────────────────────────

  const { data: company } = useQuery({
    queryKey: ["company"],
    queryFn: () => companyApi.getCompany(),
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["customers"],
    queryFn: () => customerApi.getAllCustomers(),
  });

  const { data: searchOptions = [] } = useQuery<ProductSearchOption[]>({
    queryKey: ["product-search-options"],
    queryFn: () => productApi.getSearchOptions(),
  });

  // ── mutations ─────────────────────────────────────────────────────────────

  const { mutate: updateProforma, isPending } = useMutation({
    mutationFn: (input: UpdateProformaInput) =>
      proformaApi.updateProforma(proforma._id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proforma"] });
      toast.success("Proforma updated.");
      navigate(APP_ROUTES.proforma);
    },
    onError: (err: { message: string }) => {
      toast.error(err.message ?? "Failed to update proforma.");
    },
  });

  const { mutate: saveCustomerRecord, isPending: isSavingCustomer } =
    useMutation({
      mutationFn: () =>
        customerApi.createCustomer({
          name: customerSnapshot.name,
          email: customerSnapshot.email ?? null,
          phone: customerSnapshot.phone ?? null,
          address: customerSnapshot.address ?? null,
          city: customerSnapshot.city ?? null,
          tin: customerSnapshot.tin ?? null,
        }),
      onSuccess: (saved) => {
        queryClient.invalidateQueries({ queryKey: ["customers"] });
        setSelectedCustomerId(saved._id);
        toast.success("Customer saved.");
      },
      onError: (err: { message: string }) => {
        toast.error(err.message ?? "Failed to save customer.");
      },
    });

  const { mutate: updateCustomerRecord, isPending: isUpdatingCustomer } =
    useMutation({
      mutationFn: () =>
        customerApi.updateCustomer(selectedCustomerId!, {
          name: customerSnapshot.name,
          email: customerSnapshot.email ?? null,
          phone: customerSnapshot.phone ?? null,
          address: customerSnapshot.address ?? null,
          city: customerSnapshot.city ?? null,
          tin: customerSnapshot.tin ?? null,
        }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["customers"] });
        toast.success("Customer updated.");
      },
      onError: (err: { message: string }) => {
        toast.error(err.message ?? "Failed to update customer.");
      },
    });

  // ── derived ───────────────────────────────────────────────────────────────

  const ghsRate = company?.usdToGhsRate ?? proforma.ghsRate;
  const taxPercent = company?.taxRate ?? proforma.taxPercent;

  const subtotal = lineItems.reduce(
    (sum, item) => sum + item.unitPriceGhs * item.quantity,
    0,
  );
  const taxGhs = (subtotal * taxPercent) / 100;
  const total = subtotal + taxGhs;

  const selectedCustomer =
    customers.find((c) => c._id === selectedCustomerId) ?? null;

  const snapshotDiffersFromSelected =
    selectedCustomerId &&
    selectedCustomer &&
    (customerSnapshot.name !== selectedCustomer.name ||
      (customerSnapshot.email ?? "") !== (selectedCustomer.email ?? "") ||
      (customerSnapshot.phone ?? "") !== (selectedCustomer.phone ?? "") ||
      (customerSnapshot.address ?? "") !== (selectedCustomer.address ?? "") ||
      (customerSnapshot.city ?? "") !== (selectedCustomer.city ?? "") ||
      (customerSnapshot.tin ?? "") !== (selectedCustomer.tin ?? ""));

  // ── handlers ──────────────────────────────────────────────────────────────

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomerId(customer._id);
    setCustomerSnapshot({
      name: customer.name,
      email: customer.email ?? null,
      phone: customer.phone ?? null,
      address: customer.address ?? null,
      city: customer.city ?? null,
      tin: customer.tin ?? null,
    });
    setCustomerPopoverOpen(false);
  };

  const handleClearCustomer = () => {
    setSelectedCustomerId(null);
    setCustomerSnapshot(proforma.customerSnapshot);
  };

  const updateLineItem = useCallback(
    (key: string, patch: Partial<LineItemDraft>) => {
      setLineItems((prev) =>
        prev.map((item) => (item._key === key ? { ...item, ...patch } : item)),
      );
    },
    [],
  );

  const handleSelectOption = (key: string, option: ProductSearchOption) => {
    updateLineItem(key, {
      product: option.product,
      variant: option.variant,
      isManual: false,
      optionLabel: option.label,
      productSnapshot: {
        name: option.title,
        sku: option.sku,
        attributes: option.attributes,
      },
      unitPriceGhs:
        option.priceUsd != null ? round2(option.priceUsd * ghsRate) : 0,
    });
    setOptionPopoverOpen((prev) => ({ ...prev, [key]: false }));
  };

  const handleClearOption = (key: string) => {
    updateLineItem(key, {
      product: null,
      variant: null,
      isManual: true,
      optionLabel: "",
      productSnapshot: { name: "", sku: null, attributes: [] },
      unitPriceGhs: 0,
    });
  };

  // ── submit ────────────────────────────────────────────────────────────────

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerSnapshot.name.trim()) {
      setError("Customer name is required.");
      return;
    }
    if (lineItems.length === 0) {
      setError("At least one line item is required.");
      return;
    }
    for (const item of lineItems) {
      if (!item.product && !item.productSnapshot?.name?.trim()) {
        setError("Each line item needs a product or a manual description.");
        return;
      }
      if (item.quantity < 1) {
        setError("Quantity must be at least 1.");
        return;
      }
      if (item.unitPriceGhs < 0) {
        setError("Unit price cannot be negative.");
        return;
      }
    }

    const payload: UpdateProformaInput = {
      customerSnapshot,
      customer: selectedCustomerId ?? null,
      lineItems: lineItems.map((item) => ({
        product: item.product,
        variant: item.variant,
        productSnapshot: item.productSnapshot,
        quantity: item.quantity,
        unitPriceGhs: item.unitPriceGhs,
      })),
      discountGhs: 0,
      taxPercent,
    };

    updateProforma(payload);
  };

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <>
      <PageMeta
        title={PAGE_META_DATA.proformaEdit.title}
        description={PAGE_META_DATA.proformaEdit.description}
      />
      {isPending && <FullPageLoader />}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(APP_ROUTES.proforma)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              {proforma.proformaNumber}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {company
                ? `Rate: 1 USD = GHS ${ghsRate.toFixed(2)}  ·  Tax: ${taxPercent}%`
                : "Loading rates…"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* ── Customer ── */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4 border-b">
              <h2 className="text-sm font-medium text-foreground">Customer</h2>
              <p className="text-xs text-muted-foreground">
                Select an existing customer or enter details manually
              </p>
            </CardHeader>
            <CardContent className="pt-6 space-y-4 relative">
              {(isSavingCustomer || isUpdatingCustomer) && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-[2px] rounded-b-lg">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">
                      {isSavingCustomer
                        ? "Saving customer…"
                        : "Updating customer…"}
                    </span>
                  </div>
                </div>
              )}

              {/* Search row */}
              <div className="flex items-center gap-3">
                <Popover
                  open={customerPopoverOpen}
                  onOpenChange={setCustomerPopoverOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-72 justify-between"
                    >
                      {selectedCustomerId
                        ? customers.find((c) => c._id === selectedCustomerId)
                            ?.name
                        : "Search existing customers…"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search by name…" />
                      <CommandList>
                        <CommandEmpty>No customers found.</CommandEmpty>
                        <CommandGroup>
                          {customers.map((c) => (
                            <CommandItem
                              key={c._id}
                              value={c.name}
                              onSelect={() => handleSelectCustomer(c)}
                            >
                              <div>
                                <p className="text-sm font-medium">{c.name}</p>
                                {c.phone && (
                                  <p className="text-xs text-muted-foreground">
                                    {c.phone}
                                  </p>
                                )}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                {selectedCustomerId && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearCustomer}
                  >
                    Clear
                  </Button>
                )}
              </div>

              {/* Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>
                    Customer name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={customerSnapshot.name}
                    onChange={(e) =>
                      setCustomerSnapshot((p) => ({
                        ...p,
                        name: e.target.value,
                      }))
                    }
                    placeholder="Acme Ltd"
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input
                    value={customerSnapshot.phone ?? ""}
                    onChange={(e) =>
                      setCustomerSnapshot((p) => ({
                        ...p,
                        phone: e.target.value || null,
                      }))
                    }
                    placeholder="+233 …"
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={customerSnapshot.email ?? ""}
                    onChange={(e) =>
                      setCustomerSnapshot((p) => ({
                        ...p,
                        email: e.target.value || null,
                      }))
                    }
                    placeholder="info@acme.com"
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>TIN (optional)</Label>
                  <Input
                    value={customerSnapshot.tin ?? ""}
                    onChange={(e) =>
                      setCustomerSnapshot((p) => ({
                        ...p,
                        tin: e.target.value || null,
                      }))
                    }
                    placeholder="Tax identification number"
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Address</Label>
                  <Input
                    value={customerSnapshot.address ?? ""}
                    onChange={(e) =>
                      setCustomerSnapshot((p) => ({
                        ...p,
                        address: e.target.value || null,
                      }))
                    }
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>City</Label>
                  <Input
                    value={customerSnapshot.city ?? ""}
                    onChange={(e) =>
                      setCustomerSnapshot((p) => ({
                        ...p,
                        city: e.target.value || null,
                      }))
                    }
                    disabled={isPending}
                  />
                </div>
              </div>

              {/* Save / update customer */}
              {(() => {
                const isWorking =
                  isSavingCustomer || isUpdatingCustomer || isPending;

                if (!selectedCustomerId && customerSnapshot.name.trim()) {
                  return (
                    <div className="flex items-center gap-3 pt-3 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => saveCustomerRecord()}
                        disabled={isWorking}
                      >
                        {isSavingCustomer ? (
                          <>
                            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                            Saving…
                          </>
                        ) : (
                          "Save as customer record"
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Saves this customer for future proformas
                      </p>
                    </div>
                  );
                }

                if (snapshotDiffersFromSelected) {
                  return (
                    <div className="flex items-center gap-3 pt-3 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => updateCustomerRecord()}
                        disabled={isWorking}
                      >
                        {isUpdatingCustomer ? (
                          <>
                            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                            Updating…
                          </>
                        ) : (
                          "Update customer record"
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Overwrites the saved customer with these details
                      </p>
                    </div>
                  );
                }

                return null;
              })()}
            </CardContent>
          </Card>

          {/* ── Line Items ── */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4 border-b">
              <h2 className="text-sm font-medium text-foreground">
                Line items
              </h2>
              <p className="text-xs text-muted-foreground">
                Search and select a product to auto-fill the title. If it has a
                variant, price auto-fills too — otherwise enter a price
                manually.
              </p>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {lineItems.map((item, idx) => (
                <div
                  key={item._key}
                  className="space-y-3 pb-6 border-b last:border-0 last:pb-0"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Item {idx + 1}
                    </p>
                    {lineItems.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() =>
                          setLineItems((prev) =>
                            prev.filter((i) => i._key !== item._key),
                          )
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>

                  {/* Product search */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                      Link to a product (optional — auto-fills title & price if
                      available)
                    </Label>
                    <div className="flex items-center gap-2">
                      <Popover
                        open={optionPopoverOpen[item._key] ?? false}
                        onOpenChange={(open) =>
                          setOptionPopoverOpen((prev) => ({
                            ...prev,
                            [item._key]: open,
                          }))
                        }
                      >
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className={`flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                              item.optionLabel
                                ? "border-input bg-background text-foreground"
                                : "border-input bg-background text-muted-foreground"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                              <span className="truncate">
                                {item.optionLabel ||
                                  "Search by product title or SKU…"}
                              </span>
                            </div>
                            <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-40" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-140 p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Type product title or SKU…" />
                            <CommandList className="max-h-64">
                              <CommandEmpty>No products found.</CommandEmpty>
                              <CommandGroup>
                                {searchOptions.map((opt) => (
                                  <CommandItem
                                    key={opt.variant ?? opt.product}
                                    value={opt.label}
                                    onSelect={() =>
                                      handleSelectOption(item._key, opt)
                                    }
                                    className="flex items-center justify-between gap-4 py-2.5"
                                  >
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium truncate">
                                        {opt.title}
                                      </p>
                                      <p className="text-xs text-muted-foreground truncate">
                                        {opt.sku
                                          ? `SKU: ${opt.sku}`
                                          : "No variant yet"}
                                        {opt.attributes.length > 0 &&
                                          ` · ${opt.attributes
                                            .map((a) => `${a.name}: ${a.value}`)
                                            .join(", ")}`}
                                      </p>
                                    </div>
                                    <span className="text-sm font-semibold text-foreground shrink-0">
                                      {opt.priceUsd != null
                                        ? formatGhs(
                                            round2(opt.priceUsd * ghsRate),
                                          )
                                        : "—"}
                                    </span>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>

                      {!item.isManual && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="shrink-0 text-muted-foreground hover:text-foreground"
                          onClick={() => handleClearOption(item._key)}
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Description + qty + price */}
                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-6 space-y-1.5">
                      <Label className="text-xs">
                        Description <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        value={item.productSnapshot?.name ?? ""}
                        onChange={(e) =>
                          updateLineItem(item._key, {
                            productSnapshot: {
                              ...item.productSnapshot,
                              name: e.target.value,
                            },
                          })
                        }
                        placeholder="Product title / description"
                        disabled={isPending || !item.isManual}
                      />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <Label className="text-xs">
                        Qty <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) =>
                          updateLineItem(item._key, {
                            quantity: Number(e.target.value),
                          })
                        }
                        disabled={isPending}
                      />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <Label className="text-xs">
                        Price (GHS) <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.unitPriceGhs}
                        onChange={(e) =>
                          updateLineItem(item._key, {
                            unitPriceGhs: Number(e.target.value),
                          })
                        }
                        disabled={isPending}
                      />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <Label className="text-xs">Total</Label>
                      <p className="h-10 flex items-center text-sm font-medium text-foreground">
                        {formatGhs(item.unitPriceGhs * item.quantity)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setLineItems((prev) => [...prev, emptyLineItem()])
                }
              >
                <Plus className="h-4 w-4 mr-2" />
                Add line item
              </Button>

              {/* Totals */}
              <div className="border-t pt-4 space-y-2 max-w-xs ml-auto">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatGhs(subtotal)}</span>
                </div>
                {taxPercent > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Tax ({taxPercent}%)
                    </span>
                    <span>{formatGhs(taxGhs)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-semibold border-t pt-2">
                  <span>Total</span>
                  <span>{formatGhs(total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(APP_ROUTES.proforma)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
};

export default EditProformaPage;
