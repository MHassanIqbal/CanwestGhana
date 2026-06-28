import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { proformaApi } from "@/api/proformaApi";
import { APP_ROUTES } from "@/routes/appRoutes";
import PageMeta from "@/meta/PageMeta";
import { PAGE_META_DATA } from "@/meta/pageMetaData";
import InlineLoader from "@/components/loader/InlineLoader";
import FullPageLoader from "@/components/loader/FullPageLoader";
import type { Proforma } from "@/types/proforma";
import {
  MoreHorizontal,
  Search,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Copy,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";

const PAGE_SIZE = 10;

const formatGhs = (amount: number) =>
  `GHS ${amount.toLocaleString("en-GH", { minimumFractionDigits: 2 })}`;

const ProformaListPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [proformaToDelete, setProformaToDelete] = useState<Proforma | null>(
    null,
  );

  const {
    data: proformas = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["proforma"],
    queryFn: () => proformaApi.getAllProformas(),
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return proformas;
    return proformas.filter(
      (proforma) =>
        proforma.proformaNumber.toLowerCase().includes(q) ||
        proforma.customerSnapshot.name.toLowerCase().includes(q),
    );
  }, [proformas, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  const { currentUser } = useAuth();

  const isAdmin = currentUser?.role === "admin";

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const { mutate: deleteProforma, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => proformaApi.deleteProforma(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proforma"] });
      toast.success("Proforma deleted.");
      setProformaToDelete(null);
    },
    onError: (err: { message: string }) => {
      toast.error(err.message ?? "Failed to delete proforma.");
    },
  });

  const { mutate: duplicateProforma, isPending: isDuplicating } = useMutation({
    mutationFn: (id: string) => proformaApi.duplicateProforma(id),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["proforma"] });
      toast.success("Duplicate created.");
      navigate(APP_ROUTES.proformaEdit(created._id));
    },
    onError: (err: { message: string }) => {
      toast.error(err.message ?? "Failed to duplicate proforma.");
    },
  });

  return (
    <>
      <PageMeta
        title={PAGE_META_DATA.proforma.title}
        description={PAGE_META_DATA.proforma.description}
      />

      {(isDeleting || isDuplicating) && <FullPageLoader />}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Proforma</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {filtered.length} proforma{filtered.length !== 1 ? "s" : ""}
              {search && ` (filtered from ${proformas.length})`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by number or customer…"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button onClick={() => navigate(APP_ROUTES.proformaNew)}>
              New proforma
            </Button>
          </div>
        </div>

        {isLoading && <InlineLoader text="Loading proformas…" />}

        {isError && (
          <p className="text-sm text-destructive">
            Failed to load proformas. Please refresh.
          </p>
        )}

        {!isLoading && !isError && (
          <>
            <div className="rounded-lg border border-border bg-card shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Proforma #</TableHead>
                    <TableHead className="w-64">Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Subtotal</TableHead>
                    <TableHead>Tax</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center py-12 text-muted-foreground text-sm"
                      >
                        {search
                          ? "No proformas match your search."
                          : "No proformas yet."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginated.map((proforma) => (
                      <TableRow key={proforma._id}>
                        <TableCell className="font-mono text-sm font-medium">
                          {proforma.proformaNumber}
                        </TableCell>

                        <TableCell className="w-64">
                          <p className="text-sm font-medium text-foreground">
                            {proforma.customerSnapshot.name}
                          </p>
                          {proforma.customerSnapshot.phone && (
                            <p className="text-xs text-muted-foreground">
                              {proforma.customerSnapshot.phone}
                            </p>
                          )}
                        </TableCell>

                        <TableCell>
                          {proforma.issuedAt ? (
                            <Badge variant="secondary">Issued</Badge>
                          ) : (
                            <Badge variant="outline">Draft</Badge>
                          )}
                        </TableCell>

                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(proforma.createdAt), "dd MMM yyyy")}
                        </TableCell>

                        <TableCell className="text-sm text-muted-foreground">
                          {formatGhs(proforma.subtotalGhs)}
                        </TableCell>

                        <TableCell className="text-sm text-muted-foreground">
                          {proforma.taxGhs > 0
                            ? formatGhs(proforma.taxGhs)
                            : "—"}
                        </TableCell>

                        <TableCell className="text-sm font-semibold text-foreground">
                          {formatGhs(proforma.totalGhs)}
                        </TableCell>

                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {!proforma.issuedAt && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    navigate(
                                      APP_ROUTES.proformaEdit(proforma._id),
                                    )
                                  }
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuItem
                                onClick={() => duplicateProforma(proforma._id)}
                              >
                                <Copy className="mr-2 h-4 w-4" />
                                Duplicate
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() =>
                                  proformaApi.downloadPdf(
                                    proforma._id,
                                    proforma.proformaNumber,
                                  )
                                }
                              >
                                <Download className="mr-2 h-4 w-4" />
                                Download
                              </DropdownMenuItem>

                              {(!proforma.issuedAt || isAdmin) && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() =>
                                      setProformaToDelete(proforma)
                                    }
                                    className="text-red-600 focus:text-red-700"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <AlertDialog
        open={!!proformaToDelete}
        onOpenChange={(open) => !open && setProformaToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete proforma?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-medium text-foreground">
                {proformaToDelete?.proformaNumber}
              </span>
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (proformaToDelete) deleteProforma(proformaToDelete._id);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ProformaListPage;
