import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { companyApi } from "@/api/companyApi";
import InlineLoader from "@/components/loader/InlineLoader";
import PageMeta from "@/meta/PageMeta";
import { PAGE_META_DATA } from "@/meta/pageMetaData";
import { Pencil } from "lucide-react";
import type {
  BusinessDay,
  BusinessHours,
  Company,
  SocialLinks,
  UpdateCompanyInput,
} from "@/types/company";

const DAYS: { key: keyof BusinessHours; label: string }[] = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

const DEFAULT_DAY: BusinessDay = {
  open: "09:00",
  close: "18:00",
  closed: false,
};

const buildDefaultHours = (existing?: BusinessHours): BusinessHours => {
  const result = {} as BusinessHours;
  for (const { key } of DAYS) {
    result[key] = existing?.[key] ?? { ...DEFAULT_DAY };
  }
  return result;
};

// Small, scoped loading overlay shared by every card on this page —
// sits within the card's own bounds (the card must be `relative`),
// not a full-page takeover, since these are quick in-place saves.
const CardSavingOverlay = ({
  show,
  label = "Saving…",
}: {
  show: boolean;
  label?: string;
}) => {
  if (!show) return null;

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-[2px] rounded-lg">
      <div className="flex items-center gap-2">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
    </div>
  );
};

const CompanyPage = () => {
  const {
    data: company,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["company"],
    queryFn: () => companyApi.getCompany(),
  });

  return (
    <>
      <PageMeta
        title={PAGE_META_DATA.company.title}
        description={PAGE_META_DATA.company.description}
      />

      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Company</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your company's branding, pricing, and contact information
          </p>
        </div>

        {isLoading && <InlineLoader text="Loading company settings…" />}

        {isError && !isLoading && (
          <p className="text-sm text-destructive">
            Failed to load company settings. Please refresh.
          </p>
        )}

        {!isLoading && !isError && company && (
          <CompanySettingsForm company={company} />
        )}
      </div>
    </>
  );
};

const CompanySettingsForm = ({ company }: { company: Company }) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---- Logo ----
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const { mutate: uploadLogo, isPending: isUploadingLogo } = useMutation({
    mutationFn: (file: File) => companyApi.uploadLogo(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company"] });
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

  // ---- Basic info ----
  const [basicInfo, setBasicInfo] = useState({
    companyName: company.companyName,
    slogan: company.slogan ?? "",
    contactEmail: company.contactEmail ?? "",
    contactPhone: company.contactPhone ?? "",
    address: company.address ?? "",
  });

  const { mutate: updateBasicInfo, isPending: isBasicInfoPending } =
    useMutation({
      mutationFn: (input: UpdateCompanyInput) =>
        companyApi.updateCompany(input),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["company"] });
        toast.success("Company settings updated.");
      },
      onError: (err: { message: string }) => {
        toast.error(err.message ?? "Failed to update settings.");
      },
    });

  const handleBasicInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateBasicInfo(basicInfo);
  };

  // ---- Currency & tax ----
  const [pricing, setPricing] = useState({
    usdToGhsRate: company.usdToGhsRate,
    taxRate: company.taxRate,
  });

  const { mutate: updatePricing, isPending: isPricingPending } = useMutation({
    mutationFn: (input: UpdateCompanyInput) => companyApi.updateCompany(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company"] });
      toast.success("Pricing settings updated.");
    },
    onError: (err: { message: string }) => {
      toast.error(err.message ?? "Failed to update pricing settings.");
    },
  });

  const handlePricingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updatePricing(pricing);
  };

  // ---- Social links ----
  const [socialLinks, setSocialLinks] = useState<Required<SocialLinks>>({
    facebook: company.socialLinks?.facebook ?? "",
    instagram: company.socialLinks?.instagram ?? "",
    twitter: company.socialLinks?.twitter ?? "",
    linkedin: company.socialLinks?.linkedin ?? "",
    whatsapp: company.socialLinks?.whatsapp ?? "",
  });

  const { mutate: updateSocialLinks, isPending: isSocialPending } = useMutation(
    {
      mutationFn: (input: UpdateCompanyInput) =>
        companyApi.updateCompany(input),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["company"] });
        toast.success("Social links updated.");
      },
      onError: (err: { message: string }) => {
        toast.error(err.message ?? "Failed to update social links.");
      },
    },
  );

  const handleSocialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSocialLinks({ socialLinks });
  };

  // ---- Business hours ----
  const [businessHours, setBusinessHours] = useState<BusinessHours>(
    buildDefaultHours(company.businessHours),
  );

  const { mutate: updateBusinessHours, isPending: isHoursPending } =
    useMutation({
      mutationFn: (input: UpdateCompanyInput) =>
        companyApi.updateCompany(input),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["company"] });
        toast.success("Business hours updated.");
      },
      onError: (err: { message: string }) => {
        toast.error(err.message ?? "Failed to update business hours.");
      },
    });

  const updateDay = (day: keyof BusinessHours, patch: Partial<BusinessDay>) => {
    setBusinessHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], ...patch },
    }));
  };

  const handleHoursSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateBusinessHours({ businessHours });
  };

  return (
    <div className="space-y-6">
      {/* Logo — click the preview itself to choose a new image */}
      <Card className="shadow-sm relative">
        <CardSavingOverlay show={isUploadingLogo} label="Uploading…" />
        <CardHeader className="pb-4 border-b">
          <h2 className="text-sm font-medium text-foreground">Logo</h2>
          <p className="text-xs text-muted-foreground">
            Used in the sidebar, login screen, and storefront
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingLogo}
              className="group relative h-20 w-20 rounded-lg border border-border overflow-hidden bg-muted shrink-0 disabled:cursor-not-allowed"
            >
              {logoPreview || company.logoUrl ? (
                <img
                  src={logoPreview ?? company.logoUrl}
                  alt="Company logo"
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">No logo</span>
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
              <p className="text-xs text-muted-foreground">
                PNG or JPG, square images work best.
              </p>

              {logoFile && (
                <div className="flex items-center gap-2 pt-1">
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

      {/* Basic information */}
      <Card className="shadow-sm relative">
        <CardSavingOverlay show={isBasicInfoPending} />
        <CardHeader className="pb-4 border-b">
          <h2 className="text-sm font-medium text-foreground">
            Basic information
          </h2>
          <p className="text-xs text-muted-foreground">
            Company name, contact details, and address
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleBasicInfoSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="companyName">Company name</Label>
                <Input
                  id="companyName"
                  value={basicInfo.companyName}
                  onChange={(e) =>
                    setBasicInfo((prev) => ({
                      ...prev,
                      companyName: e.target.value,
                    }))
                  }
                  disabled={isBasicInfoPending}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="slogan">Slogan</Label>
                <Input
                  id="slogan"
                  placeholder="A short tagline for your company"
                  value={basicInfo.slogan}
                  onChange={(e) =>
                    setBasicInfo((prev) => ({
                      ...prev,
                      slogan: e.target.value,
                    }))
                  }
                  disabled={isBasicInfoPending}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="contactEmail">Contact email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={basicInfo.contactEmail}
                  onChange={(e) =>
                    setBasicInfo((prev) => ({
                      ...prev,
                      contactEmail: e.target.value,
                    }))
                  }
                  disabled={isBasicInfoPending}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contactPhone">Contact phone</Label>
                <Input
                  id="contactPhone"
                  value={basicInfo.contactPhone}
                  onChange={(e) =>
                    setBasicInfo((prev) => ({
                      ...prev,
                      contactPhone: e.target.value,
                    }))
                  }
                  disabled={isBasicInfoPending}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={basicInfo.address}
                onChange={(e) =>
                  setBasicInfo((prev) => ({
                    ...prev,
                    address: e.target.value,
                  }))
                }
                disabled={isBasicInfoPending}
              />
            </div>

            <div className="flex justify-end border-t pt-6">
              <Button type="submit" disabled={isBasicInfoPending}>
                {isBasicInfoPending ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Currency & tax */}
      <Card className="shadow-sm relative">
        <CardSavingOverlay show={isPricingPending} />
        <CardHeader className="pb-4 border-b">
          <h2 className="text-sm font-medium text-foreground">
            Currency & tax
          </h2>
          <p className="text-xs text-muted-foreground">
            Product prices are stored in USD and converted to GHS using this
            rate
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handlePricingSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4 max-w-md">
              <div className="space-y-1.5">
                <Label htmlFor="usdToGhsRate">USD to GHS rate</Label>
                <Input
                  id="usdToGhsRate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={pricing.usdToGhsRate}
                  onChange={(e) =>
                    setPricing((prev) => ({
                      ...prev,
                      usdToGhsRate: parseFloat(e.target.value) || 0,
                    }))
                  }
                  disabled={isPricingPending}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="taxRate">Tax rate (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={pricing.taxRate}
                  onChange={(e) =>
                    setPricing((prev) => ({
                      ...prev,
                      taxRate: parseFloat(e.target.value) || 0,
                    }))
                  }
                  disabled={isPricingPending}
                />
              </div>
            </div>

            <div className="flex justify-end border-t pt-6">
              <Button type="submit" disabled={isPricingPending}>
                {isPricingPending ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Social links */}
      <Card className="shadow-sm relative">
        <CardSavingOverlay show={isSocialPending} />
        <CardHeader className="pb-4 border-b">
          <h2 className="text-sm font-medium text-foreground">Social links</h2>
          <p className="text-xs text-muted-foreground">
            Shown in the storefront footer
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSocialSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="facebook">Facebook</Label>
                <Input
                  id="facebook"
                  placeholder="https://facebook.com/..."
                  value={socialLinks.facebook}
                  onChange={(e) =>
                    setSocialLinks((prev) => ({
                      ...prev,
                      facebook: e.target.value,
                    }))
                  }
                  disabled={isSocialPending}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  placeholder="https://instagram.com/..."
                  value={socialLinks.instagram}
                  onChange={(e) =>
                    setSocialLinks((prev) => ({
                      ...prev,
                      instagram: e.target.value,
                    }))
                  }
                  disabled={isSocialPending}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="twitter">Twitter / X</Label>
                <Input
                  id="twitter"
                  placeholder="https://x.com/..."
                  value={socialLinks.twitter}
                  onChange={(e) =>
                    setSocialLinks((prev) => ({
                      ...prev,
                      twitter: e.target.value,
                    }))
                  }
                  disabled={isSocialPending}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input
                  id="linkedin"
                  placeholder="https://linkedin.com/company/..."
                  value={socialLinks.linkedin}
                  onChange={(e) =>
                    setSocialLinks((prev) => ({
                      ...prev,
                      linkedin: e.target.value,
                    }))
                  }
                  disabled={isSocialPending}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="whatsapp">WhatsApp number</Label>
                <Input
                  id="whatsapp"
                  placeholder="+233..."
                  value={socialLinks.whatsapp}
                  onChange={(e) =>
                    setSocialLinks((prev) => ({
                      ...prev,
                      whatsapp: e.target.value,
                    }))
                  }
                  disabled={isSocialPending}
                />
              </div>
            </div>

            <div className="flex justify-end border-t pt-6">
              <Button type="submit" disabled={isSocialPending}>
                {isSocialPending ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Business hours */}
      <Card className="shadow-sm relative">
        <CardSavingOverlay show={isHoursPending} />
        <CardHeader className="pb-4 border-b">
          <h2 className="text-sm font-medium text-foreground">
            Business hours
          </h2>
          <p className="text-xs text-muted-foreground">
            Default hours shown to customers
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleHoursSubmit} className="space-y-5">
            <div className="space-y-3">
              {DAYS.map(({ key, label }) => {
                const day = businessHours[key];
                return (
                  <div
                    key={key}
                    className="grid grid-cols-12 items-center gap-3"
                  >
                    <div className="col-span-2">
                      <span className="text-sm text-foreground">{label}</span>
                    </div>

                    <div className="col-span-2 flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`${key}-closed`}
                        checked={day.closed}
                        onChange={(e) =>
                          updateDay(key, { closed: e.target.checked })
                        }
                        className="h-4 w-4 rounded border-input accent-primary"
                      />
                      <Label
                        htmlFor={`${key}-closed`}
                        className="text-xs text-muted-foreground font-normal cursor-pointer"
                      >
                        Closed
                      </Label>
                    </div>

                    <div className="col-span-4">
                      <Input
                        type="time"
                        value={day.open ?? ""}
                        onChange={(e) =>
                          updateDay(key, { open: e.target.value })
                        }
                        disabled={day.closed || isHoursPending}
                      />
                    </div>

                    <div className="col-span-1 text-center text-xs text-muted-foreground">
                      to
                    </div>

                    <div className="col-span-3">
                      <Input
                        type="time"
                        value={day.close ?? ""}
                        onChange={(e) =>
                          updateDay(key, { close: e.target.value })
                        }
                        disabled={day.closed || isHoursPending}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end border-t pt-6">
              <Button type="submit" disabled={isHoursPending}>
                {isHoursPending ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyPage;
