import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { staffApi } from "@/api/staffApi";
import { APP_ROUTES } from "@/routes/appRoutes";
import PageMeta from "@/meta/PageMeta";
import { PAGE_META_DATA } from "@/meta/pageMetaData";
import { ArrowLeft, MailCheck } from "lucide-react";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const {
    mutate: forgotPassword,
    isPending,
    isSuccess,
  } = useMutation({
    mutationFn: (email: string) => staffApi.forgotPassword(email),
    onError: (err: { message: string }) => {
      setError(err.message ?? "Something went wrong. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError("Email is required.");
      return;
    }

    forgotPassword(email);
  };

  return (
    <>
      <PageMeta
        title={PAGE_META_DATA.forgotPassword.title}
        description={PAGE_META_DATA.forgotPassword.description}
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
              Workplace — reset your password
            </p>
          </div>

          <Card className="shadow-sm">
            {isSuccess ? (
              <CardContent className="pt-6 text-center space-y-3">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 mx-auto">
                  <MailCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-base font-medium text-foreground">
                  Check your email
                </h2>
                <p className="text-sm text-muted-foreground">
                  If an account exists for <strong>{email}</strong>, a password
                  reset link has been sent. The link is valid for 30 minutes.
                </p>
                <Button asChild variant="outline" className="mt-2">
                  <Link to={APP_ROUTES.login}>Back to login</Link>
                </Button>
              </CardContent>
            ) : (
              <>
                <CardHeader className="pb-4">
                  <h2 className="text-lg font-medium text-foreground">
                    Forgot your password?
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Enter your email and we'll send you a reset link.
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
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@canwestghana.com"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isPending}
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isPending}
                    >
                      {isPending ? "Sending…" : "Send reset link"}
                    </Button>

                    <Link
                      to={APP_ROUTES.login}
                      className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Back to login
                    </Link>
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

export default ForgotPasswordPage;
