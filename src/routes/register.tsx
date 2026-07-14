import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Check, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/lib/theme";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/register")({
  component: Register,
  head: () => ({ meta: [{ title: "Create workspace — SupportAI" }] }),
});

const schema = z
  .object({
    companyName: z.string().min(2, "Company name must be at least 2 characters"),
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().min(1, "Work email is required").email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Za-z]/, "Password must contain at least one letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    industry: z.string().min(1, "Please select your industry"),
    companySize: z.string().min(1, "Please select your company size"),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: "You must accept the terms to create a workspace",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

function Register() {
  const { signUp, user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      companyName: "",
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      industry: "",
      companySize: "",
      acceptTerms: false,
    },
  });

  // Redirect if already logged in
  const { onboardingCompleted, isLoadingCompany } = useAuth();
  useEffect(() => {
    if (!authLoading && !isLoadingCompany && user) {
      if (onboardingCompleted) {
        navigate({ to: "/dashboard" });
      } else {
        navigate({ to: "/onboarding" });
      }
    }
  }, [user, authLoading, isLoadingCompany, onboardingCompleted, navigate]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    const { error, data: signUpData } = await signUp(data.email, data.password, {
      companyName: data.companyName,
      fullName: data.fullName,
      industry: data.industry,
      companySize: data.companySize,
    });

    if (error) {
      toast.error(error.message || "Failed to create account. Please try again.");
      setIsSubmitting(false);
    } else {
      // Check if user is auto-confirmed or needs email verification
      const isConfirmationRequired = signUpData?.user && !signUpData.session;

      if (isConfirmationRequired) {
        toast.success(
          "Workspace initialized! Please check your business email to verify your account.",
          {
            duration: 8000,
          },
        );
        setIsSubmitting(false);
        navigate({ to: "/login" });
      } else {
        toast.success("Workspace created! Welcome to SupportAI.");
        // Redirection is handled by the useEffect watching the `user` state
      }
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
      {/* Left pane - benefits */}
      <div className="relative hidden lg:flex flex-col justify-between p-10 bg-gradient-primary text-white overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
        <Logo compact />
        <div className="relative space-y-6">
          <h2 className="text-3xl font-semibold tracking-tight leading-tight">
            Ship AI support this week
          </h2>
          <ul className="space-y-3 text-sm">
            {[
              "14-day free trial · no credit card",
              "Unlimited team members during trial",
              "SOC 2 Type II · GDPR compliant",
              "Migrate from Zendesk or Intercom in minutes",
            ].map((f) => (
              <li key={f} className="flex items-start gap-2">
                <Check className="h-4 w-4 mt-0.5 shrink-0" />
                <span className="opacity-95">{f}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="relative text-xs opacity-80">Trusted by 1,200+ teams globally</div>
      </div>

      {/* Right pane - forms */}
      <div className="relative flex flex-col p-6 sm:p-10 overflow-y-auto">
        <div className="flex items-center justify-between">
          <Link to="/" className="lg:hidden">
            <Logo />
          </Link>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">Already have an account?</span>
            <Button asChild variant="outline" size="sm" className="rounded-lg">
              <Link to="/login">Sign in</Link>
            </Button>
            <ThemeToggle />
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center py-8">
          <div className="w-full max-w-sm">
            <h1 className="text-2xl font-semibold tracking-tight">Create your workspace</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              A dedicated, secure environment for your company.
            </p>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <Label htmlFor="companyName">Company name</Label>
                      <FormControl>
                        <Input
                          id="companyName"
                          placeholder="Acme Inc."
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
                  name="fullName"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <Label htmlFor="fullName">Full name</Label>
                      <FormControl>
                        <Input
                          id="fullName"
                          placeholder="Jane Doe"
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

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="industry"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <Label htmlFor="industry">Industry</Label>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger id="industry" className="h-11 rounded-lg">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ecom">E-commerce</SelectItem>
                            <SelectItem value="saas">SaaS</SelectItem>
                            <SelectItem value="fintech">Fintech</SelectItem>
                            <SelectItem value="health">Healthcare</SelectItem>
                            <SelectItem value="edu">Education</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="companySize"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <Label htmlFor="companySize">Company size</Label>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger id="companySize" className="h-11 rounded-lg">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1-10">1-10</SelectItem>
                            <SelectItem value="11-50">11-50</SelectItem>
                            <SelectItem value="51-200">51-200</SelectItem>
                            <SelectItem value="201-500">201-500</SelectItem>
                            <SelectItem value="501+">501+</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <FormControl>
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Min 8 characters"
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
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <FormControl>
                        <Input
                          id="confirmPassword"
                          type={showPassword ? "text" : "password"}
                          placeholder="Repeat password"
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
                  name="acceptTerms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-2 space-y-0 py-1">
                      <FormControl>
                        <Checkbox
                          id="acceptTerms"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="rounded-md border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary mt-0.5"
                        />
                      </FormControl>
                      <Label
                        htmlFor="acceptTerms"
                        className="text-xs text-muted-foreground leading-normal cursor-pointer select-none"
                      >
                        I agree to the{" "}
                        <a href="#" className="underline underline-offset-2 hover:text-foreground">
                          Terms of Service
                        </a>{" "}
                        and{" "}
                        <a href="#" className="underline underline-offset-2 hover:text-foreground">
                          Privacy Policy
                        </a>
                        .
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
                      Creating workspace...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-1.5">
                      Create workspace <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>
            </Form>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              By creating an account, you agree to our{" "}
              <a href="#" className="underline">
                Terms
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
