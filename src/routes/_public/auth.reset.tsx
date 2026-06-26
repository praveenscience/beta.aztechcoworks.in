import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useResetPassword } from "@/lib/queries";
import { z } from "zod";

const searchSchema = z.object({
  token: z.string().optional(),
});

export const Route = createFileRoute("/_public/auth/reset")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [{ title: "Reset password — Aztech Co-Works" }],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const { token } = Route.useSearch();
  const resetPassword = useResetPassword();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <main className="container mx-auto flex min-h-[60vh] max-w-md items-center justify-center px-4 py-12">
        <Card className="w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Invalid reset link. Please request a new one.</p>
            <Link to="/auth/forgot" className="mt-4 inline-flex items-center text-sm text-accent hover:underline">
              Request password reset
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords don't match");
      return;
    }

    resetPassword.mutate(
      { token, password },
      {
        onSuccess: () => {
          setDone(true);
          toast.success("Password reset successfully!");
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  return (
    <main className="container mx-auto flex min-h-[60vh] max-w-md items-center justify-center px-4 py-12">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Reset password</CardTitle>
          <CardDescription>Enter your new password below.</CardDescription>
        </CardHeader>
        <CardContent>
          {done ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-sm text-muted-foreground">
                Your password has been reset. You can now sign in with your new password.
              </p>
              <Button onClick={() => navigate({ to: "/auth" })} className="w-full">
                Sign in
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                />
              </div>
              <div>
                <Label htmlFor="confirm">Confirm password</Label>
                <Input
                  id="confirm"
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Re-enter password"
                />
              </div>
              <Button className="w-full" type="submit" size="lg" disabled={resetPassword.isPending}>
                {resetPassword.isPending ? "Resetting..." : "Reset password"}
              </Button>
              <div className="text-center">
                <Link to="/auth" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="mr-1 h-4 w-4" /> Back to sign in
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
