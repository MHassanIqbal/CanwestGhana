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
import { categoryApi } from "@/api/categoryApi";
import { APP_ROUTES } from "@/routes/appRoutes";
import InlineLoader from "@/components/loader/InlineLoader";
import PageMeta from "@/meta/PageMeta";
import { PAGE_META_DATA } from "@/meta/pageMetaData";
import type { Category } from "@/types/category";
import { MoreHorizontal, Pencil, Trash2, Plus, Search } from "lucide-react";

const CategoryListPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null,
  );

  const {
    data: allCategories = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["category", "list"],
    queryFn: () => categoryApi.getAllCategories(),
  });

  // Build a name lookup so we can show the parent's name instead of its ID.
  const categoryMap = Object.fromEntries(allCategories.map((c) => [c._id, c]));

  const filteredCategories = allCategories.filter((c) =>
    c.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const { mutate: deleteCategory, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => categoryApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["category"] });
      toast.success("Category deleted.");
    },
    onError: (err: { message: string }) => {
      toast.error(err.message ?? "Failed to delete category.");
    },
  });

  const confirmDelete = () => {
    if (categoryToDelete) {
      deleteCategory(categoryToDelete._id);
      setCategoryToDelete(null);
    }
  };

  return (
    <>
      <PageMeta
        title={PAGE_META_DATA.category.title}
        description={PAGE_META_DATA.category.description}
      />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              Categories
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {filteredCategories.length} categor
              {filteredCategories.length !== 1 ? "ies" : "y"}
              {search && ` (filtered from ${allCategories.length})`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search categories…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button onClick={() => navigate(APP_ROUTES.categoryNew)}>
              <Plus className="mr-2 h-4 w-4" />
              Add category
            </Button>
          </div>
        </div>

        {isLoading && <InlineLoader text="Loading categories…" />}
        {isError && (
          <p className="text-sm text-destructive">
            Failed to load categories. Please refresh.
          </p>
        )}

        {!isLoading && !isError && (
          <div className="rounded-lg border border-border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-12 text-muted-foreground text-sm"
                    >
                      {search
                        ? "No categories match your search."
                        : "No categories found."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCategories.map((category) => (
                    <TableRow key={category._id}>
                      <TableCell className="flex items-center gap-3">
                        {category.imageUrl && (
                          <div className="h-7 w-7 rounded bg-muted flex items-center justify-center overflow-hidden shrink-0">
                            <img
                              src={category.imageUrl}
                              alt={category.name}
                              className="h-full w-full object-contain"
                            />
                          </div>
                        )}
                        <span className="text-sm font-medium text-foreground">
                          {category.name}
                        </span>
                      </TableCell>

                      <TableCell className="text-sm text-muted-foreground">
                        {category.slug}
                      </TableCell>

                      <TableCell className="text-sm text-muted-foreground">
                        {category.parent ? (
                          (categoryMap[category.parent]?.name ?? "—")
                        ) : (
                          <span className="text-xs text-muted-foreground/60">
                            Root
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                        {category.description || "—"}
                      </TableCell>

                      <TableCell>
                        <Badge
                          className={
                            category.isActive
                              ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-muted text-muted-foreground"
                          }
                        >
                          {category.isActive ? "Active" : "Inactive"}
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
                                navigate(APP_ROUTES.categoryEdit(category._id))
                              }
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setCategoryToDelete(category)}
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
        open={!!categoryToDelete}
        onOpenChange={(open) => !open && setCategoryToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-medium text-foreground">
                {categoryToDelete?.name}
              </span>
              . Deletion is blocked if it has sub-categories or assigned
              products.
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

export default CategoryListPage;
