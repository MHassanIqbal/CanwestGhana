import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import PageMeta from "@/meta/PageMeta";
import { PAGE_META_DATA } from "@/meta/pageMetaData";
import type { CreateStaffInput, StaffRole } from "@/types/staff";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import FullPageLoader from "@/components/loader/FullPageLoader";

const CreateStaffPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === "admin";

  const [form, setForm] = useState<CreateStaffInput>({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    password: "",
    role: "employee",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { mutate: createStaff, isPending } = useMutation({
    mutationFn: (input: CreateStaffInput) => staffApi.createStaff(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast.success("Staff member created.");
      navigate(APP_ROUTES.staff);
    },
    onError: (err: { message: string }) => {
      toast.error(err.message ?? "Failed to create staff. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      setError("First name, last name, email and password are required.");
      return;
    }

    if (form.password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const payload: CreateStaffInput = {
      ...form,
      middleName: form.middleName?.trim() || undefined,
    };

    createStaff(payload);
  };

  return (
    <>
      <PageMeta
        title={PAGE_META_DATA.staffNew.title}
        description={PAGE_META_DATA.staffNew.description}
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
            <h1 className="text-xl font-semibold text-foreground">Add staff</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Create a new staff account
            </p>
          </div>
        </div>

        <Card className="shadow-sm">
          <CardHeader className="pb-4 border-b">
            <h2 className="text-sm font-medium text-foreground">
              Personal details
            </h2>
            <p className="text-xs text-muted-foreground">
              Basic information about the staff member
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-4 space-y-1.5">
                  <Label htmlFor="firstName">
                    First name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={form.firstName}
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
                    placeholder="Optional"
                    value={form.middleName}
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
                    placeholder="Doe"
                    value={form.lastName}
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

              {/* Email + Role side by side, since both are roughly equal in importance */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john.doe@canwestghana.com"
                    value={form.email}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                    disabled={isPending}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="role">
                    Role <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={form.role}
                    onValueChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        role: value as StaffRole,
                      }))
                    }
                    disabled={isPending}
                  >
                    <SelectTrigger id="role" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Employee</SelectItem>
                      {isAdmin && (
                        <SelectItem value="manager">Manager</SelectItem>
                      )}
                      {isAdmin && <SelectItem value="admin">Admin</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-t pt-6 space-y-1">
                <h3 className="text-sm font-medium text-foreground">
                  Account password
                </h3>
                <p className="text-xs text-muted-foreground">
                  This can updated later from the profile.
                </p>
              </div>

              {/* Password + confirm side by side */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="password">
                    Password <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Min. 8 characters"
                    value={form.password}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">
                    Confirm password <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isPending}
                  />
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters and include uppercase, lowercase,
                a number, and a special character.
              </p>

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
                  {isPending ? "Creating…" : "Create staff"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default CreateStaffPage;
