import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { staffApi } from "@/api/staffApi";
import { useAuth } from "@/hooks/useAuth";
import PageMeta from "@/components/meta/PageMeta";
import { PAGE_META_DATA } from "@/components/meta/pageMetaData";
import type { ChangePasswordInput, Staff } from "@/types/staff";
import { toast } from "sonner";

const roleBadgeVariant = (role: Staff["role"]) => {
  if (role === "admin") return "destructive";
  if (role === "manager") return "default";
  return "secondary";
};

const getInitials = (firstName?: string, lastName?: string) =>
  `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();

const ProfilePage = () => {
  const { currentUser } = useAuth();

  const [form, setForm] = useState<ChangePasswordInput>({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { mutate: changePassword, isPending } = useMutation({
    mutationFn: (input: ChangePasswordInput) => staffApi.changePassword(input),
    onSuccess: () => {
      toast.success("Password updated successfully.");
      setForm({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
    },
    onError: (err: { message: string }) => {
      toast.error(err.message ?? "Failed to update password.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (
      !form.currentPassword ||
      !form.newPassword ||
      !form.confirmNewPassword
    ) {
      setError("All fields are required.");
      return;
    }

    if (form.newPassword !== form.confirmNewPassword) {
      setError("New passwords do not match.");
      return;
    }

    changePassword(form);
  };

  return (
    <>
      <PageMeta
        title={PAGE_META_DATA.profile.title}
        description={PAGE_META_DATA.profile.description}
      />

      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Profile</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            View your account details and manage your password
          </p>
        </div>

        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14">
                <AvatarFallback className="text-base bg-primary/10 text-primary font-semibold">
                  {getInitials(currentUser?.firstName, currentUser?.lastName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-base font-semibold text-foreground">
                  {currentUser?.firstName} {currentUser?.middleName}{" "}
                  {currentUser?.lastName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {currentUser?.email}
                </p>
                <Badge
                  variant={roleBadgeVariant(currentUser?.role ?? "employee")}
                  className="mt-2"
                >
                  {currentUser?.role}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm relative">
          {isPending && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-[2px] rounded-lg">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span className="text-sm text-muted-foreground">Updating…</span>
              </div>
            </div>
          )}
          <CardHeader className="pb-4 border-b">
            <h2 className="text-sm font-medium text-foreground">
              Change password
            </h2>
            <p className="text-xs text-muted-foreground">
              Enter your current password to set a new one
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5 max-w-sm">
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

              <div className="space-y-1.5">
                <Label htmlFor="currentPassword">Current password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={form.currentPassword}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      currentPassword: e.target.value,
                    }))
                  }
                  disabled={isPending}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="newPassword">New password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={form.newPassword}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      newPassword: e.target.value,
                    }))
                  }
                  disabled={isPending}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmNewPassword">Confirm new password</Label>
                <Input
                  id="confirmNewPassword"
                  type="password"
                  value={form.confirmNewPassword}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      confirmNewPassword: e.target.value,
                    }))
                  }
                  disabled={isPending}
                />
              </div>

              <Button type="submit" disabled={isPending}>
                {isPending ? "Updating…" : "Update password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ProfilePage;
