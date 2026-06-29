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
import { productApi } from "@/api/productApi";
import { brandApi } from "@/api/brandApi";
import { categoryApi } from "@/api/categoryApi";
import { APP_ROUTES } from "@/routes/appRoutes";
import InlineLoader from "@/components/loader/InlineLoader";
import PageMeta from "@/meta/PageMeta";
import { PAGE_META_DATA } from "@/meta/pageMetaData";
import type { Product } from "@/types/product";
import { MoreHorizontal, Pencil, Trash2, Plus, Search } from "lucide-react";
import { format } from "date-fns";

const ProductListPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const {
    data: allProducts = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["product", "list"],
    queryFn: () => productApi.getAllProducts(),
  });

  const { data: allBrands = [] } = useQuery({
    queryKey: ["brand", "list"],
    queryFn: () => brandApi.getAllBrands(),
  });

  const { data: allCategories = [] } = useQuery({
    queryKey: ["category", "list"],
    queryFn: () => categoryApi.getAllCategories(),
  });

  const brandMap = Object.fromEntries(allBrands.map((b) => [b._id, b.name]));
  const categoryMap = Object.fromEntries(
    allCategories.map((c) => [c._id, c.name]),
  );

  // Updated filter lookup pointer to utilize 'title' instead of 'name'
  const filteredProducts = allProducts.filter((p) =>
    p.title.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const { mutate: deleteProduct, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => productApi.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product"] });
      toast.success("Product deleted.");
    },
    onError: (err: { message: string }) => {
      toast.error(err.message ?? "Failed to delete product.");
    },
  });

  const confirmDelete = () => {
    if (productToDelete) {
      deleteProduct(productToDelete._id);
      setProductToDelete(null);
    }
  };

  return (
    <>
      <PageMeta
        title={PAGE_META_DATA.product.title}
        description={PAGE_META_DATA.product.description}
      />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Products</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {filteredProducts.length} product
              {filteredProducts.length !== 1 ? "s" : ""}
              {search && ` (filtered from ${allProducts.length})`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button onClick={() => navigate(APP_ROUTES.productNew)}>
              <Plus className="mr-2 h-4 w-4" />
              Add product
            </Button>
          </div>
        </div>

        {isLoading && <InlineLoader text="Loading products…" />}
        {isError && (
          <p className="text-sm text-destructive">
            Failed to load products. Please refresh.
          </p>
        )}

        {!isLoading && !isError && (
          <div className="rounded-lg border border-border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Summary</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-12 text-muted-foreground text-sm"
                    >
                      {search
                        ? "No products match your search."
                        : "No products found."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product._id}>
                      <TableCell className="flex items-center gap-3">
                        {product.images[0] && (
                          <div className="h-7 w-7 rounded bg-muted flex items-center justify-center overflow-hidden shrink-0">
                            <img
                              src={product.images[0]}
                              alt={product.title}
                              className="h-full w-full object-contain"
                            />
                          </div>
                        )}
                        {/* Swapped data key reference here */}
                        <span className="text-sm font-medium text-foreground">
                          {product.title}
                        </span>
                      </TableCell>

                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                        {product.summary || "—"}
                      </TableCell>

                      <TableCell className="text-sm text-muted-foreground">
                        {brandMap[product.brand] ?? "—"}
                      </TableCell>

                      <TableCell className="text-sm text-muted-foreground">
                        {categoryMap[product.category] ?? "—"}
                      </TableCell>

                      <TableCell>
                        <Badge
                          className={
                            product.isActive
                              ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-muted text-muted-foreground"
                          }
                        >
                          {product.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(product.createdAt), "dd MMM yyyy")}
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
                                navigate(APP_ROUTES.productEdit(product._id))
                              }
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setProductToDelete(product)}
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
        open={!!productToDelete}
        onOpenChange={(open) => !open && setProductToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete product?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              {/* Swapped dialog confirmation display key targeting context */}
              <span className="font-medium text-foreground">
                {productToDelete?.title}
              </span>
              . Deletion is blocked if it has any variants.
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

export default ProductListPage;
