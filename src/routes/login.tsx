import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/lib/theme";

export const Route = createFileRoute("/login")({
  component: Login,
  head: () => ({ meta: [{ title: "Sign in — SupportAI" }] }),
});

function Login() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
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
      </div>

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

            <Button variant="outline" className="mt-6 w-full h-11 rounded-lg" type="button">
              <svg viewBox="0 0 24 24" className="mr-2 h-4 w-4">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
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

            <form className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Work email</Label>
                <Input id="email" type="email" placeholder="you@company.com" className="h-11 rounded-lg" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <a href="#" className="text-xs text-primary hover:underline">Forgot password?</a>
                </div>
                <Input id="password" type="password" placeholder="••••••••" className="h-11 rounded-lg" />
              </div>
              <Button asChild className="w-full h-11 rounded-lg" type="submit">
                <Link to="/dashboard">
                  Sign in <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            </form>

            <p className="mt-8 text-center text-xs text-muted-foreground">
              By continuing you agree to our <a href="#" className="underline">Terms</a> and{" "}
              <a href="#" className="underline">Privacy Policy</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
