import { createFileRoute } from "@tanstack/react-router";
import { Topbar } from "@/components/topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserPlus, Search, MoreHorizontal } from "lucide-react";

export const Route = createFileRoute("/_app/team")({
  component: Team,
  head: () => ({ meta: [{ title: "Team — SupportAI" }] }),
});

const members = [
  {
    name: "Emma Wilson",
    email: "emma@acme.com",
    role: "Owner",
    status: "Active",
    last: "just now",
  },
  {
    name: "Marcus Chen",
    email: "marcus@acme.com",
    role: "Admin",
    status: "Active",
    last: "12m ago",
  },
  {
    name: "Sarah Kim",
    email: "sarah@acme.com",
    role: "Support Lead",
    status: "Active",
    last: "2h ago",
  },
  { name: "David Park", email: "david@acme.com", role: "Agent", status: "Active", last: "1d ago" },
  { name: "Lisa Rodriguez", email: "lisa@acme.com", role: "Agent", status: "Invited", last: "—" },
];

function Team() {
  return (
    <>
      <Topbar
        title="Team"
        subtitle="Manage teammates and their permissions"
        actions={
          <Button size="sm" className="rounded-lg">
            <UserPlus className="h-4 w-4 mr-1.5" /> Invite member
          </Button>
        }
      />
      <div className="p-6 lg:p-8 space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { l: "Total members", v: "5" },
            { l: "Active agents", v: "4" },
            { l: "Pending invites", v: "1" },
          ].map((s) => (
            <div key={s.l} className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="text-xs text-muted-foreground">{s.l}</div>
              <div className="mt-1 text-2xl font-semibold tracking-tight">{s.v}</div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold">Members</div>
              <div className="text-xs text-muted-foreground">{members.length} people</div>
            </div>
            <div className="relative w-64 hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search team" className="pl-9 h-9 rounded-lg" />
            </div>
          </div>
          <ul className="divide-y divide-border">
            {members.map((m) => (
              <li key={m.email} className="p-4 sm:px-5 flex items-center gap-4">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="text-xs bg-muted">
                    {m.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{m.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{m.email}</div>
                </div>
                <Badge variant="secondary" className="rounded-full hidden sm:inline-flex">
                  {m.role}
                </Badge>
                <Badge
                  variant="secondary"
                  className={
                    "rounded-full " +
                    (m.status === "Active"
                      ? "bg-success-soft text-success"
                      : "bg-warning-soft text-warning-foreground")
                  }
                >
                  {m.status}
                </Badge>
                <div className="text-xs text-muted-foreground hidden md:block w-20 text-right">
                  {m.last}
                </div>
                <Button size="icon" variant="ghost" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
