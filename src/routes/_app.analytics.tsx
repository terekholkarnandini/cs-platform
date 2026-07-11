import { createFileRoute } from "@tanstack/react-router";
import { Topbar } from "@/components/topbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/_app/analytics")({
  component: Analytics,
  head: () => ({ meta: [{ title: "Analytics — SupportAI" }] }),
});

const trend = Array.from({ length: 30 }, (_, i) => ({
  d: i + 1,
  Conversations: 300 + Math.round(i * 12 + Math.sin(i / 3) * 60 + Math.random() * 40),
}));

const categories = [
  { name: "Product", value: 42 },
  { name: "Billing", value: 24 },
  { name: "Shipping", value: 18 },
  { name: "Refund", value: 10 },
  { name: "Other", value: 6 },
];

const colors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

const csat = Array.from({ length: 12 }, (_, i) => ({
  m: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i],
  CSAT: 4.2 + Math.random() * 0.7,
}));

const response = Array.from({ length: 7 }, (_, i) => ({
  d: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][i],
  AI: 1 + Math.random() * 0.6,
  Human: 15 + Math.random() * 8,
}));

const topComplaints = [
  { c: "Delivery delayed", n: 342, trend: "+12%" },
  { c: "Product damaged", n: 218, trend: "+3%" },
  { c: "Refund not received", n: 187, trend: "-8%" },
  { c: "Wrong item shipped", n: 142, trend: "+5%" },
  { c: "Payment failed", n: 98, trend: "-14%" },
];

function Analytics() {
  return (
    <>
      <Topbar
        title="Analytics"
        subtitle="Deep insights across your support operation"
        actions={
          <Button size="sm" variant="outline" className="rounded-lg">
            <Download className="h-4 w-4 mr-1.5" /> Export report
          </Button>
        }
      />
      <div className="p-6 lg:p-8 space-y-6">
        {/* KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { l: "AI resolution rate", v: "94.2%", d: "+3.1% vs last month" },
            { l: "Avg. response time", v: "1.4s", d: "AI · 12min human" },
            { l: "CSAT score", v: "4.8/5", d: "based on 3,241 replies" },
            { l: "AI accuracy", v: "97.6%", d: "human-graded sample" },
          ].map((s) => (
            <div key={s.l} className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="text-xs text-muted-foreground">{s.l}</div>
              <div className="mt-1 text-3xl font-semibold tracking-tight">{s.v}</div>
              <div className="text-xs text-success mt-1">{s.d}</div>
            </div>
          ))}
        </div>

        {/* Trend */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-semibold">Conversation trend</div>
              <div className="text-xs text-muted-foreground">Last 30 days</div>
            </div>
            <Badge variant="secondary" className="rounded-full">30d</Badge>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="a1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="d" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
                />
                <Area type="monotone" dataKey="Conversations" stroke="var(--chart-1)" strokeWidth={2} fill="url(#a1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories + CSAT */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="text-sm font-semibold mb-4">Complaint categories</div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categories} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={2}>
                    {categories.map((_, i) => <Cell key={i} fill={colors[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="text-sm font-semibold mb-4">CSAT score over time</div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={csat}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="m" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis domain={[3.5, 5]} stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
                  <Line type="monotone" dataKey="CSAT" stroke="var(--chart-2)" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Response time + Heatmap */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="text-sm font-semibold mb-4">Avg. response time (AI vs Human)</div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={response}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="d" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="AI" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Human" fill="var(--chart-3)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="text-sm font-semibold mb-4">Activity heatmap</div>
            <div className="grid gap-1" style={{ gridTemplateColumns: "auto repeat(24, 1fr)" }}>
              <div />
              {Array.from({ length: 24 }).map((_, h) => (
                <div key={h} className="text-[9px] text-muted-foreground text-center">
                  {h % 4 === 0 ? h : ""}
                </div>
              ))}
              {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((day, di) => (
                <React.Fragment key={day}>
                  <div key={day} className="text-[10px] text-muted-foreground pr-2 flex items-center">{day}</div>
                  {Array.from({ length: 24 }).map((_, hi) => {
                    const intensity = Math.max(0, Math.sin((hi - 9) / 4) * 0.6 + (di < 5 ? 0.6 : 0.2) + Math.random() * 0.3);
                    return (
                      <div
                        key={`${di}-${hi}`}
                        className="aspect-square rounded"
                        style={{ background: `color-mix(in oklab, var(--primary) ${Math.min(intensity * 100, 90)}%, transparent)` }}
                      />
                    );
                  })}
                </>
              ))}
            </div>
          </div>
        </div>

        {/* Top complaints */}
        <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
          <div className="p-5 border-b border-border">
            <div className="text-sm font-semibold">Top complaints</div>
            <div className="text-xs text-muted-foreground">This month</div>
          </div>
          <ul className="divide-y divide-border">
            {topComplaints.map((c, i) => (
              <li key={c.c} className="p-4 sm:px-5 flex items-center gap-4">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground text-xs font-mono">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{c.c}</div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-gradient-primary" style={{ width: `${(c.n / topComplaints[0].n) * 100}%` }} />
                  </div>
                </div>
                <div className="text-sm font-semibold tabular-nums">{c.n}</div>
                <div className={"text-xs " + (c.trend.startsWith("+") ? "text-warning-foreground" : "text-success")}>
                  {c.trend}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
