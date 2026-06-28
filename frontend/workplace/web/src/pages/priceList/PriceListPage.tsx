import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { priceListApi } from "@/api/priceListApi";
import InlineLoader from "@/components/loader/InlineLoader";
import PageMeta from "@/meta/PageMeta";
import { PAGE_META_DATA } from "@/meta/pageMetaData";
import { Search } from "lucide-react";

const PriceListPage = () => {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["price-list", debouncedSearch],
    queryFn: () => priceListApi.getPriceList(debouncedSearch || undefined),
  });

  const results = data?.results ?? [];

  return (
    <>
      <PageMeta
        title={PAGE_META_DATA.priceList.title}
        description={PAGE_META_DATA.priceList.description}
      />

      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              Price List
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {results.length} product{results.length !== 1 ? "s" : ""}
              {debouncedSearch && ` matching "${debouncedSearch}"`}
            </p>
          </div>

          {data && (
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>
                Rate:{" "}
                <span className="font-medium text-foreground">
                  1 USD = {data.rate} GHS
                </span>
              </span>
              <span>
                Tax:{" "}
                <span className="font-medium text-foreground">
                  {data.taxRate}%
                </span>
              </span>
            </div>
          )}
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or SKU…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
            autoFocus
          />
        </div>

        {isLoading && <InlineLoader text="Loading price list…" />}
        {isError && (
          <p className="text-sm text-destructive">
            Failed to load price list. Please refresh.
          </p>
        )}

        {!isLoading && !isError && (
          <div className="rounded-lg border border-border bg-card shadow-sm overflow-x-auto">
            <Table className="table-fixed w-full min-w-275">
              <colgroup>
                <col className="w-[3%]" />
                <col className="w-[11%]" />
                <col className="w-[30%]" />
                <col className="w-[13%]" />
                <col className="w-[8%]" />
                <col className="w-[8%]" />
                <col className="w-[9%]" />
                <col className="w-[9%]" />
                <col className="w-[9%]" />
              </colgroup>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Attributes</TableHead>
                  <TableHead>USD</TableHead>
                  <TableHead>GHS</TableHead>
                  <TableHead>USD (Tax)</TableHead>
                  <TableHead>GHS (Tax)</TableHead>
                  <TableHead>Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center py-12 text-muted-foreground text-sm"
                    >
                      {debouncedSearch
                        ? `No matches for "${debouncedSearch}".`
                        : "No products found."}
                    </TableCell>
                  </TableRow>
                ) : (
                  results.map((result, index) => (
                    <TableRow
                      key={result.variantId ?? `product-${result.productId}`}
                    >
                      <TableCell className="text-sm text-muted-foreground">
                        {index + 1}
                      </TableCell>

                      <TableCell
                        className="text-sm font-medium text-foreground truncate"
                        title={result.sku ?? undefined}
                      >
                        {result.sku ?? "—"}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-3 min-w-0">
                          {result.imageUrl && (
                            <div className="h-7 w-7 rounded bg-muted flex items-center justify-center overflow-hidden shrink-0">
                              <img
                                src={result.imageUrl}
                                alt={result.productName}
                                className="h-full w-full object-contain"
                              />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground wrap-break-word leading-snug">
                              {result.productName}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {[result.brandName, result.categoryName]
                                .filter(Boolean)
                                .join(" · ") || "—"}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {result.attributes.length === 0 ? (
                            <span className="text-xs text-muted-foreground/60">
                              —
                            </span>
                          ) : (
                            result.attributes.map((attr) => (
                              <Badge
                                key={`${attr.name}-${attr.value}`}
                                variant="secondary"
                                className="text-xs"
                              >
                                {attr.name}: {attr.value}
                              </Badge>
                            ))
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-sm text-muted-foreground">
                        {result.priceUsd != null
                          ? `$${result.priceUsd.toFixed(2)}`
                          : "—"}
                      </TableCell>

                      <TableCell className="text-sm text-muted-foreground">
                        {result.priceGhs != null
                          ? `GHS ${result.priceGhs.toFixed(2)}`
                          : "—"}
                      </TableCell>

                      <TableCell className="text-sm font-medium text-foreground">
                        {result.priceUsdWithTax != null
                          ? `$${result.priceUsdWithTax.toFixed(2)}`
                          : "—"}
                      </TableCell>

                      <TableCell className="text-sm font-medium text-foreground">
                        {result.priceGhsWithTax != null
                          ? `GHS ${result.priceGhsWithTax.toFixed(2)}`
                          : "—"}
                      </TableCell>

                      <TableCell>
                        {result.variantId ? (
                          <Badge
                            className={
                              result.totalStock > 0
                                ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400"
                            }
                          >
                            {result.totalStock}
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-muted-foreground"
                          >
                            No variant
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </>
  );
};

export default PriceListPage;
