import { createFileRoute } from "@tanstack/react-router";
import { Topbar } from "@/components/topbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowUpRight,
  ArrowDownRight,
  MessageSquare,
  Bot,
  Clock,
  Ticket,
  Smile,
  Plus,
  Upload,
  Workflow,
  Sparkles,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/_app/dashboard")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Dashboard — SupportAI" }] }),
});

const stats = [
  { label: "Total conversations", value: "12,847", trend: "+18.2%", up: true, icon: MessageSquare },
  { label: "Resolved by AI", value: "94.2%", trend: "+3.1%", up: true, icon: Bot },
  { label: "Open tickets", value: "128", trend: "-12%", up: true, icon: Ticket },
  { label: "Avg. response time", value: "1.4s", trend: "-32%", up: true, icon: Clock },
  { label: "CSAT score", value: "4.8/5", trend: "+0.3", up: true, icon: Smile },
];

const trendData = Array.from({ length: 14 }, (_, i) => ({
  day: `D${i + 1}`,
  Conversations: 320 + Math.round(Math.sin(i / 2) * 80 + i * 15 + Math.random() * 40),
  Resolved: 280 + Math.round(Math.sin(i / 2) * 70 + i * 14 + Math.random() * 30),
}));

const pieData = [
  { name: "Product", value: 42 },
  { name: "Billing", value: 24 },
  { name: "Shipping", value: 18 },
  { name: "Refund", value: 10 },
  { name: "Other", value: 6 },
];

const pieColors = ["#10B981", "#334155", "#F59E0B", "#3B82F6", "#EF4444"];

const activity = [
  { agent: "Response Agent", event: "Answered refund query", time: "just now", tag: "resolved" },
  {
    agent: "Retrieval Agent",
    event: "Reindexed shipping-policy.pdf",
    time: "2 min ago",
    tag: "info",
  },
  {
    agent: "Decision Agent",
    event: "Escalated to human — high-value order",
    time: "8 min ago",
    tag: "warning",
  },
  {
    agent: "Response Agent",
    event: "Sent follow-up to 34 conversations",
    time: "22 min ago",
    tag: "info",
  },
  {
    agent: "Analysis Agent",
    event: "New complaint category detected: 'delivery time'",
    time: "1h ago",
    tag: "warning",
  },
];

function Dashboard() {
  return (
    <>
      <Topbar
        title="Dashboard"
        subtitle="Overview of your customer support performance"
        actions={
          <Button size="sm" className="rounded-lg">
            <Plus className="h-4 w-4 mr-1.5" /> New conversation
          </Button>
        }
      />
      <div className="p-6 lg:p-8 space-y-6">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-center justify-between">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary-soft text-primary">
                  <s.icon className="h-4 w-4" />
                </div>
                <span
                  className={
                    "inline-flex items-center gap-0.5 text-xs font-medium " +
                    (s.up ? "text-success" : "text-destructive")
                  }
                >
                  {s.up ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {s.trend}
                </span>
              </div>
              <div className="mt-4 text-2xl font-semibold tracking-tight">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-sm font-semibold">Conversation volume</div>
                <div className="text-xs text-muted-foreground">Last 14 days</div>
              </div>
              <Badge variant="secondary" className="rounded-full">
                14d
              </Badge>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="day"
                    stroke="var(--muted-foreground)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="var(--muted-foreground)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="Conversations"
                    stroke="var(--chart-1)"
                    strokeWidth={2}
                    fill="url(#g1)"
                  />
                  <Area
                    type="monotone"
                    dataKey="Resolved"
                    stroke="var(--chart-2)"
                    strokeWidth={2}
                    fill="url(#g2)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="mb-2">
              <div className="text-sm font-semibold">Complaint categories</div>
              <div className="text-xs text-muted-foreground">This month</div>
            </div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={54}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={pieColors[i]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 space-y-1.5">
              {pieData.map((d, i) => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: pieColors[i] }} />
                    <span className="text-muted-foreground">{d.name}</span>
                  </div>
                  <span className="font-medium">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Activity + Quick actions */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card shadow-card">
            <div className="p-6 border-b border-border">
              <div className="text-sm font-semibold">Recent activity</div>
              <div className="text-xs text-muted-foreground">Live feed from your agents</div>
            </div>
            <ul className="divide-y divide-border">
              {activity.map((a, i) => (
                <li key={i} className="p-4 sm:px-6 flex items-start gap-4">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{a.event}</div>
                    <div className="text-xs text-muted-foreground">
                      {a.agent} · {a.time}
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className={
                      "rounded-full text-xs " +
                      (a.tag === "resolved"
                        ? "bg-success-soft text-success"
                        : a.tag === "warning"
                          ? "bg-warning-soft text-warning-foreground"
                          : "")
                    }
                  >
                    {a.tag}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="text-sm font-semibold">Quick actions</div>
            <div className="text-xs text-muted-foreground">Get set up in minutes</div>
            <div className="mt-4 space-y-3">
              {[
                { icon: Upload, title: "Upload documents", desc: "Feed your knowledge base" },
                { icon: Workflow, title: "Configure agents", desc: "Edit workflow pipeline" },
                { icon: Sparkles, title: "Install widget", desc: "Copy embed code" },
              ].map((q) => (
                <button
                  key={q.title}
                  className="w-full flex items-center gap-3 rounded-xl border border-border p-3 text-left hover:bg-muted/50 transition-colors"
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
                    <q.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{q.title}</div>
                    <div className="text-xs text-muted-foreground">{q.desc}</div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
