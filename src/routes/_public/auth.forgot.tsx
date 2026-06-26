import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail } from "lucide-react";
import { toast } from "sonner";
import { useForgotPassword } from "@/lib/queries";

export const Route = createFileRoute("/_public/auth/forgot")({
  head: () => ({
    meta: [{ title: "Forgot password — Aztech Co-Works" }],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const forgotPassword = useForgotPassword();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    forgotPassword.mutate(
      { email },
      {
        onSuccess: () => {
          setSent(true);
          toast.success("If that email exists, a reset link has been sent.");
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  return (
    <main className="container mx-auto flex min-h-[60vh] max-w-md items-center justify-center px-4 py-12">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Forgot password</CardTitle>
          <CardDescription>
            Enter your email and we'll send you a link to reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-secondary">
                <Mail className="h-6 w-6 text-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                If an account exists for <strong>{email}</strong>, you'll receive a password reset email shortly. Check your inbox and spam folder.
              </p>
              <Link to="/auth" className="inline-flex items-center text-sm text-accent hover:underline">
                <ArrowLeft className="mr-1 h-4 w-4" /> Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                />
              </div>
              <Button className="w-full" type="submit" size="lg" disabled={forgotPassword.isPending}>
                {forgotPassword.isPending ? "Sending..." : "Send reset link"}
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
