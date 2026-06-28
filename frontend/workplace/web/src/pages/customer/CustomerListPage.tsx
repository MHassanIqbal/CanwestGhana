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
import { customerApi } from "@/api/customerApi";
import { APP_ROUTES } from "@/routes/appRoutes";
import InlineLoader from "@/components/loader/InlineLoader";
import PageMeta from "@/meta/PageMeta";
import { PAGE_META_DATA } from "@/meta/pageMetaData";
import type { Customer } from "@/types/customer";
import { MoreHorizontal, Pencil, Trash2, Plus, Search } from "lucide-react";

const CustomerListPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(
    null,
  );

  const {
    data: allCustomers = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["customer", "list"],
    queryFn: () => customerApi.getAllCustomers(),
  });

  const filteredCustomers = allCustomers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(search.trim().toLowerCase()) ||
      (customer.email &&
        customer.email.toLowerCase().includes(search.trim().toLowerCase())),
  );

  const { mutate: deleteCustomer, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => customerApi.deleteCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer"] });
      toast.success("Customer deleted.");
    },
    onError: (err: { message: string }) => {
      toast.error(err.message ?? "Failed to delete customer.");
    },
  });

  const confirmDelete = () => {
    if (customerToDelete) {
      deleteCustomer(customerToDelete._id);
      setCustomerToDelete(null);
    }
  };

  return (
    <>
      <PageMeta
        title={PAGE_META_DATA.customer.title}
        description={PAGE_META_DATA.customer.description}
      />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Customers</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {filteredCustomers.length} customer
              {filteredCustomers.length !== 1 ? "s" : ""}
              {search && ` (filtered from ${allCustomers.length})`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button onClick={() => navigate(APP_ROUTES.customerNew)}>
              <Plus className="mr-2 h-4 w-4" />
              Add customer
            </Button>
          </div>
        </div>

        {isLoading && <InlineLoader text="Loading customers…" />}

        {isError && (
          <p className="text-sm text-destructive">
            Failed to load customers. Please refresh.
          </p>
        )}

        {!isLoading && !isError && (
          <div className="rounded-lg border border-border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>TIN</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-12 text-muted-foreground text-sm"
                    >
                      {search
                        ? "No customers match your search."
                        : "No customers found."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => (
                    <TableRow key={customer._id}>
                      <TableCell>
                        <span className="text-sm font-medium text-foreground">
                          {customer.name}
                        </span>
                      </TableCell>

                      <TableCell className="text-sm text-muted-foreground">
                        {customer.email || "—"}
                      </TableCell>

                      <TableCell className="text-sm text-muted-foreground">
                        {customer.phone || "—"}
                      </TableCell>

                      <TableCell className="text-sm text-muted-foreground">
                        {customer.tin || "—"}
                      </TableCell>

                      <TableCell className="text-sm text-muted-foreground">
                        {customer.city || "—"}
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
                                navigate(APP_ROUTES.customerEdit(customer._id))
                              }
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setCustomerToDelete(customer)}
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
        open={!!customerToDelete}
        onOpenChange={(open) => !open && setCustomerToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete customer?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-medium text-foreground">
                {customerToDelete?.name}
              </span>
              . This action cannot be undone.
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

export default CustomerListPage;
