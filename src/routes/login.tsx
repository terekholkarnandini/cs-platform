import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Eye, EyeOff, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/lib/theme";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { FormEvent } from "react";
import * as z from "zod";
import { toast } from "sonner";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type LoginSearchParams = {
  redirect?: string;
};

export const Route = createFileRoute("/login")({
  component: Login,
  validateSearch: (search: Record<string, unknown>): LoginSearchParams => {
    return {
      redirect: typeof search.redirect === "string" ? search.redirect : undefined,
    };
  },
  head: () => ({ meta: [{ title: "Sign in — SupportAI" }] }),
});

const schema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().default(false),
});

type FormData = z.infer<typeof schema>;

function Login() {
  const {
    signIn,
    signInWithGoogle,
    resetPasswordForEmail,
    user,
    isLoading: authLoading,
  } = useAuth();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot password dialog states
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [isSendingForgot, setIsSendingForgot] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      const destination = search.redirect || "/dashboard";
      navigate({ to: destination });
    }
  }, [user, authLoading, navigate, search.redirect]);

  // Load saved email if rememberMe was previously set
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedEmail = localStorage.getItem("supportai_remember_email");
      if (savedEmail) {
        form.setValue("email", savedEmail);
        form.setValue("rememberMe", true);
      }
    }
  }, [form]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    const { error } = await signIn(data.email, data.password);

    if (error) {
      toast.error(error.message || "Invalid email or password.");
      setIsSubmitting(false);
    } else {
      toast.success("Welcome back to SupportAI!");

      if (data.rememberMe) {
        localStorage.setItem("supportai_remember_email", data.email);
      } else {
        localStorage.removeItem("supportai_remember_email");
      }

      // Redirection is handled by the useEffect watching the `user` state
    }
  };

  const handleGoogleSignIn = async () => {
    const { error } = await signInWithGoogle();
    if (error) {
      toast.error(error.message || "Could not authenticate with Google.");
    }
  };

  const handleSendForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!forgotEmail || !forgotEmail.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setIsSendingForgot(true);
    const { error } = await resetPasswordForEmail(forgotEmail);
    setIsSendingForgot(false);

    if (error) {
      toast.error(error.message || "Failed to send reset link.");
    } else {
      toast.success("Password reset instructions sent to your email!");
      setIsForgotOpen(false);
      setForgotEmail("");
    }
  };

  if (authLoading && !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left pane - branding and testimonials */}
      <div className="relative hidden lg:flex flex-col justify-between p-10 bg-gradient-primary text-white overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
        <div className="relative flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-white/15 backdrop-blur">
            <span className="text-sm font-bold">S</span>
          </div>
          <span className="font-semibold tracking-tight">SupportAI</span>
        </div>
        <div className="relative">
          <blockquote className="text-2xl font-medium leading-snug">
            "SupportAI cut our first response time from 4 hours to 1.2 seconds. Our customers
            genuinely think it's magic."
          </blockquote>
          <div className="mt-6 text-sm opacity-90">Alex Morgan — Head of Support, Ramp</div>
        </div>
        <div className="relative text-xs opacity-75 flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-indigo-200" /> Powered by enterprise-grade AI
        </div>
      </div>

      {/* Right pane - forms */}
      <div className="relative flex flex-col p-6 sm:p-10">
        <div className="flex items-center justify-between">
          <Link to="/" className="lg:hidden">
            <Logo />
          </Link>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">New here?</span>
            <Button asChild variant="outline" size="sm" className="rounded-lg">
              <Link to="/register">Create workspace</Link>
            </Button>
            <ThemeToggle />
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-sm">
            <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Sign in to your workspace to continue.
            </p>

            <Button
              variant="outline"
              className="mt-6 w-full h-11 rounded-lg border-border hover:bg-accent/40"
              type="button"
              onClick={handleGoogleSignIn}
            >
              <svg viewBox="0 0 24 24" className="mr-2 h-4 w-4">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
                />
              </svg>
              Continue with Google
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">or</span>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <Label htmlFor="email">Work email</Label>
                      <FormControl>
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@company.com"
                          className="h-11 rounded-lg focus-visible:ring-primary focus-visible:border-primary"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        <button
                          type="button"
                          onClick={() => setIsForgotOpen(true)}
                          className="text-xs text-primary hover:text-primary-hover font-medium transition-colors"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <FormControl>
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="h-11 rounded-lg pr-10 focus-visible:ring-primary focus-visible:border-primary"
                            {...field}
                          />
                        </FormControl>
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rememberMe"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2 space-y-0 py-1">
                      <FormControl>
                        <Checkbox
                          id="rememberMe"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="rounded-md border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                      </FormControl>
                      <Label
                        htmlFor="rememberMe"
                        className="text-xs text-muted-foreground cursor-pointer select-none"
                      >
                        Remember me for 30 days
                      </Label>
                    </FormItem>
                  )}
                />

                <Button
                  className="w-full h-11 rounded-lg bg-primary hover:bg-primary-hover text-white transition-all font-medium mt-2"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Signing in...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-1.5">
                      Sign in <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>
            </Form>

            <p className="mt-8 text-center text-xs text-muted-foreground leading-relaxed">
              By continuing you agree to our{" "}
              <a
                href="#"
                className="underline underline-offset-2 hover:text-foreground transition-colors"
              >
                Terms
              </a>{" "}
              and{" "}
              <a
                href="#"
                className="underline underline-offset-2 hover:text-foreground transition-colors"
              >
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={isForgotOpen} onOpenChange={setIsForgotOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <form onSubmit={handleSendForgotPassword}>
            <DialogHeader>
              <DialogTitle className="text-xl">Forgot Password</DialogTitle>
              <DialogDescription>
                Enter your work email address and we'll send you instructions to reset your
                password.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-2">
              <Label htmlFor="forgot-email">Work email</Label>
              <Input
                id="forgot-email"
                type="email"
                placeholder="you@company.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="h-11 rounded-lg"
                required
              />
            </div>
            <DialogFooter className="sm:justify-end gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsForgotOpen(false)}
                className="rounded-lg"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSendingForgot} className="rounded-lg bg-primary">
                {isSendingForgot ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Sending...
                  </span>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
