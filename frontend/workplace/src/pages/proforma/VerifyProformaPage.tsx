import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { proformaApi } from "@/api/proformaApi";
import { APP_ROUTES } from "@/routes/appRoutes";
import PageMeta from "@/meta/PageMeta";
import { PAGE_META_DATA } from "@/meta/pageMetaData";
import InlineLoader from "@/components/loader/InlineLoader";
import { ShieldCheck, ShieldX, ArrowLeft } from "lucide-react";

const formatGhs = (amount: number) =>
  `GHS ${amount.toLocaleString("en-GH", { minimumFractionDigits: 2 })}`;

const VerifyProformaPage = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["proforma-verify", token],
    queryFn: () => proformaApi.verifyProforma(token!),
    enabled: !!token,
    retry: false,
  });

  return (
    <>
      <PageMeta
        title={PAGE_META_DATA.proformaVerify.title}
        description={PAGE_META_DATA.proformaVerify.description}
      />
      <div className="max-w-md mx-auto space-y-6 pt-8">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(APP_ROUTES.proforma)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-semibold text-foreground">
            Verify proforma
          </h1>
        </div>

        {isLoading && <InlineLoader text="Checking…" />}

        {isError && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="pt-6 flex items-start gap-3">
              <ShieldX className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive">
                  Not genuine
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {(error as { message?: string })?.message ??
                    "No matching record was found — this was not issued by us, or the code is invalid."}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {data && (
          <Card className="border-green-600/30 bg-green-600/5">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-700">
                    Genuine — issued by us
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Compare these details against the physical or PDF copy in
                    hand.
                  </p>
                </div>
              </div>

              <dl className="text-sm divide-y">
                <div className="flex justify-between py-2">
                  <dt className="text-muted-foreground">Proforma #</dt>
                  <dd className="font-mono font-medium">
                    {data.proformaNumber}
                  </dd>
                </div>
                <div className="flex justify-between py-2">
                  <dt className="text-muted-foreground">Issued by</dt>
                  <dd>{data.issuedBy ?? "—"}</dd>
                </div>
                <div className="flex justify-between py-2">
                  <dt className="text-muted-foreground">Issued on</dt>
                  <dd>{format(new Date(data.issuedOn), "dd MMM yyyy")}</dd>
                </div>
                <div className="flex justify-between py-2">
                  <dt className="text-muted-foreground">Customer</dt>
                  <dd>{data.customerName}</dd>
                </div>
                <div className="flex justify-between py-2">
                  <dt className="text-muted-foreground">Total</dt>
                  <dd className="font-semibold">{formatGhs(data.totalGhs)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};

export default VerifyProformaPage;
