import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { staffApi } from "@/api/staffApi";
import { APP_ROUTES } from "@/routes/appRoutes";
import PageMeta from "@/meta/PageMeta";
import { PAGE_META_DATA } from "@/meta/pageMetaData";
import { CircleX } from "lucide-react";

const ResetPasswordPage = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { isLoading: isValidating, isError: isInvalidToken } = useQuery({
    queryKey: ["resetToken", token],
    queryFn: () => staffApi.validateResetToken(token!),
    enabled: !!token,
    retry: false,
  });

  const { mutate: resetPassword, isPending } = useMutation({
    mutationFn: () =>
      staffApi.resetPassword(token!, { password, confirmPassword }),
    onSuccess: () => {
      navigate(APP_ROUTES.login, { replace: true });
    },
    onError: (err: { message: string }) => {
      setError(err.message ?? "Failed to reset password. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password || !confirmPassword) {
      setError("Both fields are required.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    resetPassword();
  };

  return (
    <>
      <PageMeta
        title={PAGE_META_DATA.resetPassword.title}
        description={PAGE_META_DATA.resetPassword.description}
      />

      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary mb-4">
              <span className="text-white font-bold text-lg">CW</span>
            </div>
            <h1 className="text-2xl font-semibold text-foreground">
              Canwest Ghana
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Workplace — set a new password
            </p>
          </div>

          <Card className="shadow-sm">
            {isValidating ? (
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Validating your reset link…
                </p>
              </CardContent>
            ) : isInvalidToken ? (
              <CardContent className="pt-6 text-center space-y-3">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-destructive/10 mx-auto">
                  <CircleX className="h-5 w-5 text-destructive" />
                </div>
                <h2 className="text-base font-medium text-foreground">
                  Link expired or invalid
                </h2>
                <p className="text-sm text-muted-foreground">
                  This password reset link is no longer valid. Reset links
                  expire after 30 minutes.
                </p>
                <Button asChild variant="outline" className="mt-2">
                  <Link to={APP_ROUTES.forgotPassword}>Request a new link</Link>
                </Button>
              </CardContent>
            ) : (
              <>
                <CardHeader className="pb-4">
                  <h2 className="text-lg font-medium text-foreground">
                    Set a new password
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Choose a strong password for your account.
                  </p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                      <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
                        {error}
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <Label htmlFor="password">New password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Min. 8 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isPending}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="confirmPassword">
                        Confirm new password
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

                    <p className="text-xs text-muted-foreground">
                      Must include uppercase, lowercase, a number, and a special
                      character.
                    </p>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isPending}
                    >
                      {isPending ? "Resetting…" : "Reset password"}
                    </Button>
                  </form>
                </CardContent>
              </>
            )}
          </Card>
        </div>
      </div>
    </>
  );
};

export default ResetPasswordPage;
