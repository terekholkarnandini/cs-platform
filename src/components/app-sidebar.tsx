import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Database,
  Workflow,
  MessageSquare,
  BarChart3,
  KeyRound,
  Code2,
  Users,
  Settings as SettingsIcon,
  Scale,
  LogOut,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

const items = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Knowledge Base", url: "/knowledge-base", icon: Database },
  { title: "AI Agents", url: "/agents", icon: Workflow },
  { title: "Conversations", url: "/conversations", icon: MessageSquare },
  { title: "Business Rules", url: "/business-rules", icon: Scale },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "API Keys", url: "/api-keys", icon: KeyRound },
  { title: "Widget", url: "/widget", icon: Code2 },
  { title: "Team", url: "/team", icon: Users },
  { title: "Settings", url: "/settings", icon: SettingsIcon },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { user, signOut, company } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (!error) {
      navigate({ to: "/login" });
    }
  };

  const fullName = user?.user_metadata?.full_name || "";
  const companyName = company?.name || user?.user_metadata?.company_name || "Workspace";
  const initials = fullName
    ? fullName
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.substring(0, 2).toUpperCase() || "SA";

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-sidebar-border bg-sidebar h-screen sticky top-0">
      <div className="h-16 px-5 flex items-center gap-3 border-b border-sidebar-border overflow-hidden">
        {company?.logo_url ? (
          <img
            src={company.logo_url}
            alt={companyName}
            className="h-8 w-8 rounded-lg object-contain bg-white border border-border shrink-0"
          />
        ) : (
          <Logo />
        )}
        {company?.logo_url && (
          <span className="font-semibold text-sm tracking-tight truncate text-sidebar-foreground">
            {companyName}
          </span>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        <div className="px-2 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Workspace
        </div>
        {items.map((item) => {
          const active = pathname === item.url;
          return (
            <Link
              key={item.url}
              to={item.url}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              )}
            >
              <item.icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} />
              <span className="truncate">{item.title}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-xl p-2 hover:bg-sidebar-accent/60 transition-colors">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-gradient-primary text-white text-xs font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium truncate">{companyName}</div>
            <div className="text-xs text-muted-foreground truncate">
              {user?.email || "Pro plan"}
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="text-muted-foreground hover:text-foreground p-1 transition-colors cursor-pointer"
            title="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
