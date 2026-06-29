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
import { locationApi } from "@/api/locationApi";
import { APP_ROUTES } from "@/routes/appRoutes";
import InlineLoader from "@/components/loader/InlineLoader";
import PageMeta from "@/meta/PageMeta";
import { PAGE_META_DATA } from "@/meta/pageMetaData";
import type { Location } from "@/types/location";
import { MoreHorizontal, Pencil, Trash2, Plus, Search } from "lucide-react";

type LocationTypeFilter = "all" | "warehouse" | "branch";

const LocationListPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<LocationTypeFilter>("all");
  const [locationToDelete, setLocationToDelete] = useState<Location | null>(
    null,
  );

  const {
    data: allLocations = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["location", "list"],
    queryFn: () => locationApi.getAllLocations(),
  });

  const filteredLocations = allLocations.filter((l) => {
    const matchesSearch = l.name
      .toLowerCase()
      .includes(search.trim().toLowerCase());
    const matchesType = typeFilter === "all" || l.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const { mutate: deleteLocation, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => locationApi.deleteLocation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["location"] });
      toast.success("Location deleted.");
    },
    onError: (err: { message: string }) => {
      toast.error(err.message ?? "Failed to delete location.");
    },
  });

  const confirmDelete = () => {
    if (locationToDelete) {
      deleteLocation(locationToDelete._id);
      setLocationToDelete(null);
    }
  };

  return (
    <>
      <PageMeta
        title={PAGE_META_DATA.location.title}
        description={PAGE_META_DATA.location.description}
      />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Locations</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {filteredLocations.length} location
              {filteredLocations.length !== 1 ? "s" : ""}
              {search && ` (filtered from ${allLocations.length})`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(e.target.value as LocationTypeFilter)
              }
              className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="all">All types</option>
              <option value="warehouse">Warehouse</option>
              <option value="branch">Branch</option>
            </select>

            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search locations…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button onClick={() => navigate(APP_ROUTES.locationNew)}>
              <Plus className="mr-2 h-4 w-4" />
              Add location
            </Button>
          </div>
        </div>

        {isLoading && <InlineLoader text="Loading locations…" />}
        {isError && (
          <p className="text-sm text-destructive">
            Failed to load locations. Please refresh.
          </p>
        )}

        {!isLoading && !isError && (
          <div className="rounded-lg border border-border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLocations.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-12 text-muted-foreground text-sm"
                    >
                      {search || typeFilter !== "all"
                        ? "No locations match your filters."
                        : "No locations found."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLocations.map((location) => (
                    <TableRow key={location._id}>
                      <TableCell>
                        <span className="text-sm font-medium text-foreground">
                          {location.name}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          {location.slug}
                        </p>
                      </TableCell>

                      <TableCell>
                        <Badge
                          className={
                            location.type === "warehouse"
                              ? "bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400"
                              : "bg-purple-100 text-purple-800 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400"
                          }
                        >
                          {location.type === "warehouse"
                            ? "Warehouse"
                            : "Branch"}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-sm text-muted-foreground">
                        {location.city || "—"}
                      </TableCell>

                      <TableCell className="text-sm text-muted-foreground">
                        {location.phone || "—"}
                      </TableCell>

                      <TableCell>
                        <Badge
                          className={
                            location.isActive
                              ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-muted text-muted-foreground"
                          }
                        >
                          {location.isActive ? "Active" : "Inactive"}
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
                                navigate(APP_ROUTES.locationEdit(location._id))
                              }
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setLocationToDelete(location)}
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
        open={!!locationToDelete}
        onOpenChange={(open) => !open && setLocationToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete location?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-medium text-foreground">
                {locationToDelete?.name}
              </span>
              .
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

export default LocationListPage;
