import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { brandApi } from "@/api/brandApi";
import { APP_ROUTES } from "@/routes/appRoutes";
import InlineLoader from "@/components/loader/InlineLoader";
import PageMeta from "@/meta/PageMeta";
import { PAGE_META_DATA } from "@/meta/pageMetaData";
import type { Brand } from "@/types/brand";
import { MoreHorizontal, Pencil, Trash2, Plus, Search } from "lucide-react";

const BrandListPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [brandToDelete, setBrandToDelete] = useState<Brand | null>(null);

  const {
    data: allBrands = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["brand", "list"],
    queryFn: () => brandApi.getAllBrands(),
  });

  const filteredBrands = allBrands.filter((brand) =>
    brand.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const { mutate: deleteBrand, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => brandApi.deleteBrand(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand"] });
      toast.success("Brand deleted.");
    },
    onError: (err: { message: string }) => {
      toast.error(err.message ?? "Failed to delete brand.");
    },
  });

  const confirmDelete = () => {
    if (brandToDelete) {
      deleteBrand(brandToDelete._id);
      setBrandToDelete(null);
    }
  };

  return (
    <>
      <PageMeta
        title={PAGE_META_DATA.brand.title}
        description={PAGE_META_DATA.brand.description}
      />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {filteredBrands.length} brand
            {filteredBrands.length !== 1 ? "s" : ""}
            {search && ` (filtered from ${allBrands.length})`}
          </p>

          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search brands…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button onClick={() => navigate(APP_ROUTES.brandNew)}>
              <Plus className="mr-2 h-4 w-4" />
              Add brand
            </Button>
          </div>
        </div>

        {isLoading && <InlineLoader text="Loading brands…" />}

        {isError && (
          <p className="text-sm text-destructive">
            Failed to load brands. Please refresh.
          </p>
        )}

        {!isLoading && !isError && (
          <div className="rounded-lg border border-border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBrands.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-12 text-muted-foreground text-sm"
                    >
                      {search
                        ? "No brands match your search."
                        : "No brands found."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBrands.map((brand) => (
                    <TableRow key={brand._id}>
                      <TableCell className="flex items-center gap-3">
                        {brand.logoUrl && (
                          <div className="h-7 w-7 rounded bg-muted flex items-center justify-center overflow-hidden shrink-0">
                            <img
                              src={brand.logoUrl}
                              alt={brand.name}
                              className="h-full w-full object-contain"
                            />
                          </div>
                        )}
                        <span className="text-sm font-medium text-foreground">
                          {brand.name}
                        </span>
                      </TableCell>

                      <TableCell className="text-sm text-muted-foreground">
                        {brand.slug}
                      </TableCell>

                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                        {brand.description || "—"}
                      </TableCell>

                      <TableCell>
                        <Badge
                          className={
                            brand.isActive
                              ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-muted text-muted-foreground"
                          }
                        >
                          {brand.isActive ? "Active" : "Inactive"}
                        </Badge>
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
                            <DropdownMenuItem
                              onClick={() =>
                                navigate(APP_ROUTES.brandDetail(brand._id))
                              }
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setBrandToDelete(brand)}
                              className="text-red-600 focus:text-red-700"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <AlertDialog
        open={!!brandToDelete}
        onOpenChange={(open) => !open && setBrandToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete brand?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-medium text-foreground">
                {brandToDelete?.name}
              </span>
              . If any products use this brand, deletion will be blocked.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default BrandListPage;
