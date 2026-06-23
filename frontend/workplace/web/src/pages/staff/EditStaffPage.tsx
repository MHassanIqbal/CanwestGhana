import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { staffApi } from "@/api/staffApi";
import { useAuth } from "@/hooks/useAuth";
import { APP_ROUTES } from "@/routes/appRoutes";
import InlineLoader from "@/components/loader/InlineLoader";
import PageMeta from "@/meta/PageMeta";
import { PAGE_META_DATA } from "@/meta/pageMetaData";
import type { UpdateStaffInput, StaffRole, Staff } from "@/types/staff";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import FullPageLoader from "@/components/loader/FullPageLoader";

const EditStaffPage = () => {
  const { id } = useParams<{ id: string }>();

  const {
    data: staff,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["staff", id],
    queryFn: async () => {
      const all = await staffApi.getAllStaff();
      const found = all.find((s) => s._id === id);
      if (!found) throw new Error("Staff member not found.");
      return found;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return <InlineLoader text="Loading staff member…" />;
  }

  if (isError || !staff) {
    return <p className="text-sm text-destructive">Staff member not found.</p>;
  }

  return <EditStaffForm staff={staff} />;
};

const EditStaffForm = ({ staff }: { staff: Staff }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === "admin";
  const isSelf = currentUser?._id === staff._id;

  const [form, setForm] = useState<UpdateStaffInput>({
    firstName: staff.firstName,
    middleName: staff.middleName ?? "",
    lastName: staff.lastName,
    role: staff.role,
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { mutate: updateStaff, isPending } = useMutation({
    mutationFn: (input: UpdateStaffInput) =>
      staffApi.updateStaff(staff._id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast.success("Staff updated successfully.");
      navigate(APP_ROUTES.staff);
    },
    onError: (err: { message: string }) => {
      toast.error(err.message ?? "Update failed.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.firstName || !form.lastName) {
      setError("First name and last name are required.");
      return;
    }

    updateStaff({
      ...form,
      middleName: form.middleName?.trim() || undefined,
    });
  };

  return (
    <>
      <PageMeta
        title={PAGE_META_DATA.staffEdit.title}
        description={PAGE_META_DATA.staffEdit.description}
      />

      {isPending && <FullPageLoader />}

      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(APP_ROUTES.staff)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              {staff.firstName} {staff.lastName}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Edit staff details
            </p>
          </div>
        </div>

        <Card className="shadow-sm">
          <CardHeader className="pb-4 border-b">
            <h2 className="text-sm font-medium text-foreground">
              Personal details
            </h2>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              {success && (
                <div className="rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 px-4 py-3 text-sm text-green-700 dark:text-green-400">
                  {success}
                </div>
              )}

              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-4 space-y-1.5">
                  <Label htmlFor="firstName">
                    First name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    value={form.firstName ?? ""}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        firstName: e.target.value,
                      }))
                    }
                    disabled={isPending}
                  />
                </div>
                <div className="col-span-4 space-y-1.5">
                  <Label htmlFor="middleName">Middle</Label>
                  <Input
                    id="middleName"
                    value={form.middleName ?? ""}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        middleName: e.target.value,
                      }))
                    }
                    disabled={isPending}
                  />
                </div>
                <div className="col-span-4 space-y-1.5">
                  <Label htmlFor="lastName">
                    Last name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    value={form.lastName ?? ""}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        lastName: e.target.value,
                      }))
                    }
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={staff.email}
                    disabled
                    className="bg-muted text-muted-foreground"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email address cannot be changed.
                  </p>
                </div>

                {isAdmin && (
                  <div className="space-y-1.5">
                    <Label htmlFor="role">Role</Label>
                    <Select
                      value={form.role}
                      onValueChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          role: value as StaffRole,
                        }))
                      }
                      disabled={isPending || isSelf}
                    >
                      <SelectTrigger id="role" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employee">Employee</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    {isSelf && (
                      <p className="text-xs text-muted-foreground">
                        You cannot change your own role.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 border-t pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(APP_ROUTES.staff)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default EditStaffPage;
