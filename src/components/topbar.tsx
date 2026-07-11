import { Bell, Search, HelpCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

export function Topbar({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/70 backdrop-blur-xl">
      <div className="flex items-center gap-4 px-6 lg:px-8 h-16">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-semibold tracking-tight truncate">{title}</h1>
          {subtitle && (
            <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
          )}
        </div>
        <div className="hidden md:flex relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search…"
            className="pl-9 h-9 bg-muted/40 border-transparent focus-visible:bg-background"
          />
        </div>
        <div className="flex items-center gap-1">
          {actions}
          <Button variant="ghost" size="icon" aria-label="Help">
            <HelpCircle className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
            <Bell className="h-4 w-4" />
            <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-primary" />
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
