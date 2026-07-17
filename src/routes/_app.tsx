import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { user, isLoading, onboardingCompleted, isLoadingCompany } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isLoadingCompany) {
      if (!user) {
        const redirect = typeof window !== "undefined" ? window.location.pathname : "/dashboard";
        navigate({
          to: "/login",
          search: { redirect },
        });
      } else if (!onboardingCompleted) {
        navigate({ to: "/onboarding" });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isLoading, isLoadingCompany, onboardingCompleted]);

  if (isLoading || isLoadingCompany) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar />
      <main className="flex-1 min-w-0 flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
