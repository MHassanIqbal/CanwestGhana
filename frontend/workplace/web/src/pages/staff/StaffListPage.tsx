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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { staffApi } from "@/api/staffApi";
import { useAuth } from "@/hooks/useAuth";
import { APP_ROUTES } from "@/routes/appRoutes";
import InlineLoader from "@/components/loader/InlineLoader";
import PageMeta from "@/meta/PageMeta";
import { PAGE_META_DATA } from "@/meta/pageMetaData";
import type { Staff } from "@/types/staff";
import {
  MoreHorizontal,
  UserX,
  UserCheck,
  Trash2,
  Pencil,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
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
import { toast } from "sonner";
import FullPageLoader from "@/components/loader/FullPageLoader";

const PAGE_SIZE = 10;

const roleBadgeVariant = (role: Staff["role"]) => {
  if (role === "admin") return "destructive";
  if (role === "manager") return "default";
  return "secondary";
};

const getInitials = (firstName: string, lastName: string) =>
  `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();

const StaffListPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [staffToDelete, setStaffToDelete] = useState<Staff | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const {
    data: allStaff = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["staff", "list"],
    queryFn: () => staffApi.getAllStaff(),
  });

  // Filter by name or email, case-insensitive
  const filteredStaff = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return allStaff;

    return allStaff.filter((staff) => {
      const fullName = `${staff.firstName} ${staff.lastName}`.toLowerCase();
      return (
        fullName.includes(query) || staff.email.toLowerCase().includes(query)
      );
    });
  }, [allStaff, search]);

  const totalPages = Math.max(1, Math.ceil(filteredStaff.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const paginatedStaff = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredStaff.slice(start, start + PAGE_SIZE);
  }, [filteredStaff, currentPage]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1); // reset to first page whenever the search changes
  };

  const { mutate: deactivate } = useMutation({
    mutationFn: (id: string) => staffApi.deactivateStaff(id),
    onMutate: (id) => setPendingId(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast.success("Staff deactivated.");
    },
    onError: (err: { message: string }) => {
      toast.error(err.message ?? "Failed to deactivate staff.");
    },
    onSettled: () => setPendingId(null),
  });

  const { mutate: reactivate } = useMutation({
    mutationFn: (id: string) => staffApi.reactivateStaff(id),
    onMutate: (id) => setPendingId(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast.success("Staff reactivated.");
    },
    onError: (err: { message: string }) => {
      toast.error(err.message ?? "Failed to reactivate staff.");
    },
    onSettled: () => setPendingId(null),
  });

  const { mutate: deleteStaff, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => staffApi.deleteStaff(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast.success("Staff deleted.");
    },
    onError: (err: { message: string }) => {
      toast.error(err.message ?? "Failed to delete staff.");
    },
  });

  const handleDelete = (staff: Staff) => {
    setStaffToDelete(staff);
  };

  const confirmDelete = () => {
    if (staffToDelete) {
      deleteStaff(staffToDelete._id);
      setStaffToDelete(null);
    }
  };

  return (
    <>
      <PageMeta
        title={PAGE_META_DATA.staff.title}
        description={PAGE_META_DATA.staff.description}
      />

      {isDeleting && <FullPageLoader />}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Staff</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {filteredStaff.length} member
              {filteredStaff.length !== 1 ? "s" : ""}
              {search && ` (filtered from ${allStaff.length})`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email…"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-8"
              />
            </div>

            <Button onClick={() => navigate(APP_ROUTES.staffNew)}>
              Add staff
            </Button>
          </div>
        </div>

        {isLoading && <InlineLoader text="Loading staff…" />}

        {isError && (
          <p className="text-sm text-destructive">
            Failed to load staff. Please refresh.
          </p>
        )}

        {!isLoading && !isError && (
          <>
            <div className="rounded-lg border border-border bg-card shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedStaff.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-12 text-muted-foreground text-sm"
                      >
                        {search
                          ? "No staff match your search."
                          : "No staff found."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedStaff.map((staff) => (
                      <TableRow key={staff._id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
                                {getInitials(staff.firstName, staff.lastName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {staff.firstName} {staff.lastName}
                              </p>
                              {staff._id === currentUser?._id && (
                                <p className="text-xs text-muted-foreground">
                                  You
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="text-sm text-muted-foreground">
                          {staff.email}
                        </TableCell>

                        <TableCell>
                          <Badge variant={roleBadgeVariant(staff.role)}>
                            {staff.role}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          {pendingId === staff._id ? (
                            <div className="flex items-center gap-2">
                              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                              <span className="text-xs text-muted-foreground">
                                Updating…
                              </span>
                            </div>
                          ) : (
                            <Badge
                              className={
                                staff.isActive
                                  ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400"
                                  : "bg-muted text-muted-foreground"
                              }
                            >
                              {staff.isActive ? "Active" : "Inactive"}
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                disabled={pendingId === staff._id}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  navigate(APP_ROUTES.staffEdit(staff._id))
                                }
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>

                              {staff._id !== currentUser?._id && (
                                <>
                                  <DropdownMenuSeparator />
                                  {staff.isActive ? (
                                    <DropdownMenuItem
                                      onClick={() => deactivate(staff._id)}
                                      className="text-amber-600 focus:text-amber-700"
                                    >
                                      <UserX className="mr-2 h-4 w-4" />
                                      Deactivate
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem
                                      onClick={() => reactivate(staff._id)}
                                      className="text-green-600 focus:text-green-700"
                                    >
                                      <UserCheck className="mr-2 h-4 w-4" />
                                      Reactivate
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDelete(staff)}
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
        open={!!staffToDelete}
        onOpenChange={(open) => !open && setStaffToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete staff member?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-medium text-foreground">
                {staffToDelete?.firstName} {staffToDelete?.lastName}
              </span>
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
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

export default StaffListPage;
