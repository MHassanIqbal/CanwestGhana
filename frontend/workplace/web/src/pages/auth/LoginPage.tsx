import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { staffApi } from "@/api/staffApi";
import type { LoginCredentials } from "@/types/staff";
import PageMeta from "@/components/meta/PageMeta";
import { PAGE_META_DATA } from "@/components/meta/pageMetaData";
import { APP_ROUTES } from "@/routes/appRoutes";
import { useCompany } from "@/hooks/useCompany";

const LoginPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { company } = useCompany();

  const [form, setForm] = useState<LoginCredentials>({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [error, setError] = useState<string | null>(null);

  const { mutate: login, isPending } = useMutation({
    mutationFn: (credentials: LoginCredentials) => staffApi.login(credentials),
    onSuccess: (data) => {
      queryClient.setQueryData(["auth", "me"], data.user);
      navigate("/", { replace: true });
    },
    onError: (err: { message: string }) => {
      setError(err.message ?? "Login failed. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.email || !form.password) {
      setError("Email and password are required.");
      return;
    }

    login(form);
  };

  return (
    <>
      <PageMeta
        title={PAGE_META_DATA.login.title}
        description={PAGE_META_DATA.login.description}
      />

      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            {company?.logoUrl ? (
              <img
                src={company.logoUrl}
                alt={company.companyName}
                className="w-12 h-12 rounded-xl object-cover mx-auto mb-4"
              />
            ) : (
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary mb-4">
                <span className="text-white font-bold text-lg">
                  {company?.companyName?.[0] ?? "C"}
                </span>
              </div>
            )}
            <h1 className="text-2xl font-semibold text-foreground">
              {company?.companyName ?? "Workplace"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {company?.slogan ?? "Sign in to continue"}
            </p>
          </div>

          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <h2 className="text-lg font-medium text-foreground">Sign in</h2>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@canwestghana.com"
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                    disabled={isPending}
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link
                      to={APP_ROUTES.forgotPassword}
                      className="text-xs text-primary hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
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

                <div className="flex items-center gap-2">
                  <input
                    id="rememberMe"
                    type="checkbox"
                    className="h-4 w-4 rounded border-input accent-primary"
                    checked={form.rememberMe}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        rememberMe: e.target.checked,
                      }))
                    }
                    disabled={isPending}
                  />
                  <Label
                    htmlFor="rememberMe"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Keep me signed in
                  </Label>
                </div>

                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? "Signing in…" : "Sign in"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Canwest Ghana Workplace · Internal use only
          </p>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
