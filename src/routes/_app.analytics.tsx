import { Fragment, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Topbar } from "@/components/topbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, MessageSquare, TrendingUp } from "lucide-react";
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
import { useAuth } from "@/hooks/use-auth";
import {
  fetchAnalytics,
  exportReportCSV,
  AnalyticsData,
} from "@/services/analyticsApi";

export const Route = createFileRoute("/_app/analytics")({
  component: Analytics,
  head: () => ({ meta: [{ title: "Analytics — SupportAI" }] }),
});

const colors = ["#10B981", "#334155", "#F59E0B", "#3B82F6", "#EF4444", "#8B5CF6", "#EC4899"];

// ─── Empty state helper ───────────────────────────────────────────────────────
function EmptyChart({ message = "No conversation data available yet" }: { message?: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-2 text-center border border-dashed border-border rounded-xl bg-muted/10">
      <MessageSquare className="h-8 w-8 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

// ─── Skeleton pulse ───────────────────────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className}`} />;
}

function Analytics() {
  const { session } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.access_token) return;
    setIsLoading(true);
    setError(null);
    fetchAnalytics(session.access_token)
      .then(setData)
      .catch((err) => setError(err.message ?? "Failed to load analytics"))
      .finally(() => setIsLoading(false));
  }, [session?.access_token]);

  const kpi = data?.kpi;
  const trend = data?.trend ?? [];
  const categories = data?.categories ?? [];
  const responseTime = data?.response_time ?? [];
  const heatmap = data?.heatmap ?? [];
  const topComplaints = data?.top_complaints ?? [];

  // Max heatmap count for intensity normalisation
  const maxHeatmap = Math.max(1, ...heatmap.map((h) => h.count));

  const kpiCards = [
    {
      l: "AI resolution rate",
      v: kpi
        ? kpi.ai_resolution_rate != null
          ? `${kpi.ai_resolution_rate}%`
          : "—"
        : null,
      d: kpi?.ai_resolution_rate != null ? "Based on resolved conversations" : "No conversations yet",
    },
    {
      l: "Avg. response time",
      v: kpi
        ? kpi.avg_response_time_s != null
          ? `${kpi.avg_response_time_s}s`
          : "—"
        : null,
      d: kpi?.avg_response_time_s != null ? "AI • Human data unavailable" : "No conversations yet",
    },
    {
      l: "Total conversations",
      v: kpi ? kpi.total_conversations.toLocaleString() : null,
      d: "Last 30 days & all time",
    },
    {
      l: "Knowledge base docs",
      v: kpi ? kpi.knowledge_base_documents.toLocaleString() : null,
      d: "Indexed documents",
    },
  ];

  return (
    <>
      <Topbar
        title="Analytics"
        subtitle="Deep insights across your support operation"
        actions={
          <Button
            size="sm"
            variant="outline"
            className="rounded-lg"
            onClick={() => data && exportReportCSV(data)}
            disabled={!data || isLoading}
          >
            <Download className="h-4 w-4 mr-1.5" /> Export report
          </Button>
        }
      />
      <div className="p-6 lg:p-8 space-y-6">

        {/* Migration pending notice */}
        {data?._notice && (
          <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 text-sm text-warning-foreground">
            <strong>Migration required:</strong> Run <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">supabase-migration-analytics.sql</code> in your Supabase SQL editor to enable analytics. Charts will populate automatically once conversations flow in.
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpiCards.map((s) => (
            <div key={s.l} className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="text-xs text-muted-foreground">{s.l}</div>
              <div className="mt-1 text-3xl font-semibold tracking-tight">
                {isLoading ? <Skeleton className="h-8 w-20 mt-1" /> : (s.v ?? "—")}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {isLoading ? <Skeleton className="h-3 w-28 mt-1" /> : s.d}
              </div>
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
            <Badge variant="secondary" className="rounded-full">
              30d
            </Badge>
          </div>
          <div className="h-72">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : trend.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend}>
                  <defs>
                    <linearGradient id="a1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="d"
                    stroke="var(--muted-foreground)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    interval={4}
                  />
                  <YAxis
                    stroke="var(--muted-foreground)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
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
                    fill="url(#a1)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Categories + CSAT */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="text-sm font-semibold mb-4">Complaint categories</div>
            <div className="h-64">
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : categories.length === 0 ? (
                <EmptyChart message="No categories detected yet" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categories}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={2}
                    >
                      {categories.map((_, i) => (
                        <Cell key={i} fill={colors[i % colors.length]} />
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
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="text-sm font-semibold mb-4">CSAT score over time</div>
            <div className="h-64 flex flex-col items-center justify-center text-center gap-3 border border-dashed border-border rounded-xl bg-muted/10">
              <TrendingUp className="h-8 w-8 text-muted-foreground/40" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">No feedback available yet</p>
                <p className="text-xs text-muted-foreground/70 mt-1 max-w-[220px]">
                  CSAT will populate once customers submit ratings.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Response time + Heatmap */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="text-sm font-semibold mb-4">Avg. response time (AI vs Human)</div>
            <div className="h-64">
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : responseTime.every((r) => r.AI == null) ? (
                <EmptyChart message="No response time data yet" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={responseTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="d"
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
                      unit="s"
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                      formatter={(value: number) => [`${value}s`]}
                    />
                    <Bar dataKey="AI" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Human" fill="var(--chart-3)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="text-sm font-semibold mb-4">Activity heatmap</div>
            {isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : heatmap.every((h) => h.count === 0) ? (
              <div className="h-40 flex flex-col items-center justify-center gap-2 border border-dashed border-border rounded-xl bg-muted/10">
                <MessageSquare className="h-7 w-7 text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground">No activity data yet</p>
              </div>
            ) : (
              <div className="grid gap-1" style={{ gridTemplateColumns: "auto repeat(24, 1fr)" }}>
                <div />
                {Array.from({ length: 24 }).map((_, h) => (
                  <div key={h} className="text-[9px] text-muted-foreground text-center">
                    {h % 4 === 0 ? h : ""}
                  </div>
                ))}
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, di) => (
                  <Fragment key={day}>
                    <div
                      key={day}
                      className="text-[10px] text-muted-foreground pr-2 flex items-center"
                    >
                      {day}
                    </div>
                    {Array.from({ length: 24 }).map((_, hi) => {
                      const cell = heatmap.find((h) => h.day === di && h.hour === hi);
                      const count = cell?.count ?? 0;
                      const intensity = count / maxHeatmap;
                      return (
                        <div
                          key={`${di}-${hi}`}
                          className="aspect-square rounded"
                          title={`${day} ${hi}:00 — ${count} conversations`}
                          style={{
                            background: `color-mix(in oklab, var(--primary) ${Math.min(intensity * 100, 90)}%, transparent)`,
                          }}
                        />
                      );
                    })}
                  </Fragment>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top complaints */}
        <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
          <div className="p-5 border-b border-border">
            <div className="text-sm font-semibold">Top complaints</div>
            <div className="text-xs text-muted-foreground">This month</div>
          </div>
          {isLoading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : topComplaints.length === 0 ? (
            <div className="p-8 flex flex-col items-center justify-center gap-2">
              <MessageSquare className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No complaints data yet</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {topComplaints.map((c, i) => (
                <li key={c.c} className="p-4 sm:px-5 flex items-center gap-4">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground text-xs font-mono">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{c.c}</div>
                    <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-gradient-primary"
                        style={{ width: `${(c.n / (topComplaints[0]?.n || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-sm font-semibold tabular-nums">{c.n}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
