import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
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

export const Route = createFileRoute("/register")({
  component: Register,
  head: () => ({ meta: [{ title: "Create workspace — SupportAI" }] }),
});

function Register() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
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
        <div className="relative text-xs opacity-80">
          Trusted by 1,200+ teams globally
        </div>
      </div>

      <div className="relative flex flex-col p-6 sm:p-10">
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

        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-sm">
            <h1 className="text-2xl font-semibold tracking-tight">Create your workspace</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              A dedicated, secure environment for your company.
            </p>

            <form className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="company">Company name</Label>
                <Input id="company" placeholder="Acme Inc." className="h-11 rounded-lg" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Work email</Label>
                <Input id="email" type="email" placeholder="you@company.com" className="h-11 rounded-lg" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="industry">Industry</Label>
                <Select>
                  <SelectTrigger id="industry" className="h-11 rounded-lg">
                    <SelectValue placeholder="Select your industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ecom">E-commerce</SelectItem>
                    <SelectItem value="saas">SaaS</SelectItem>
                    <SelectItem value="fintech">Fintech</SelectItem>
                    <SelectItem value="health">Healthcare</SelectItem>
                    <SelectItem value="edu">Education</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="Min 8 characters" className="h-11 rounded-lg" />
              </div>
              <Button asChild className="w-full h-11 rounded-lg" type="submit">
                <Link to="/dashboard">
                  Create workspace <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              By creating an account, you agree to our <a href="#" className="underline">Terms</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
