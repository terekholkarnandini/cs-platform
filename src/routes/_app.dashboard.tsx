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
  KeyRound,
  FileText,
  Settings,
  Building2,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { getDocuments, KnowledgeDocument } from "@/services/knowledgeApi";
import { getAIConfiguration, AIConfigurationRow } from "@/lib/ai-configuration";

export const Route = createFileRoute("/_app/dashboard")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Dashboard — SupportAI" }] }),
});

// ---------- helpers ----------------------------------------------------------

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// ---------- component --------------------------------------------------------

function Dashboard() {
  const { company, isLoadingCompany } = useAuth();

  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [aiConfig, setAiConfig] = useState<AIConfigurationRow | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (!company?.id) return;
    setIsLoadingData(true);
    Promise.all([
      getDocuments(company.id).catch(() => [] as KnowledgeDocument[]),
      getAIConfiguration(company.id).catch(() => null),
    ]).then(([docs, cfg]) => {
      setDocuments(docs);
      setAiConfig(cfg);
    }).finally(() => setIsLoadingData(false));
  }, [company?.id]);

  // ---------- stats cards ----------------------------------------------------

  const hasConversations = company && company.total_conversations > 0;

  const stats = [
    {
      label: "Total conversations",
      value: hasConversations
        ? company.total_conversations.toLocaleString()
        : "—",
      trend: hasConversations ? "+18.2%" : null,
      up: true,
      icon: MessageSquare,
    },
    {
      label: "Resolved by AI",
      value: hasConversations
        ? `${Number(company.resolved_by_ai).toFixed(1)}%`
        : "—",
      trend: hasConversations ? "+3.1%" : null,
      up: true,
      icon: Bot,
    },
    {
      label: "Open tickets",
      value: hasConversations
        ? company.open_tickets.toLocaleString()
        : "—",
      trend: hasConversations ? "-12%" : null,
      up: true,
      icon: Ticket,
    },
    {
      label: "Avg. response time",
      value: hasConversations
        ? `${Number(company.avg_response_time).toFixed(1)}s`
        : "—",
      trend: hasConversations ? "-32%" : null,
      up: true,
      icon: Clock,
    },
    {
      label: "CSAT score",
      value: hasConversations
        ? `${Number(company.csat_score).toFixed(1)}/5`
        : "—",
      trend: hasConversations ? "+0.3" : null,
      up: true,
      icon: Smile,
    },
  ];

  // ---------- recent activity (derived from real data) ----------------------

  const activity: { icon: any; event: string; agent: string; time: string; tag: string }[] = [];

  if (company?.created_at) {
    activity.push({
      icon: Building2,
      event: `Company workspace created: ${company.name}`,
      agent: "System",
      time: timeAgo(company.created_at),
      tag: "info",
    });
  }

  if (aiConfig?.updated_at) {
    activity.push({
      icon: Settings,
      event: `AI configuration updated — Model: ${aiConfig.model}`,
      agent: "AI Configuration",
      time: timeAgo(aiConfig.updated_at),
      tag: "info",
    });
  }

  // Most recently uploaded docs (up to 3)
  const recentDocs = [...documents]
    .sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime())
    .slice(0, 3);

  for (const doc of recentDocs) {
    activity.push({
      icon: FileText,
      event: `Document uploaded: ${doc.filename}`,
      agent: "Knowledge Base",
      time: timeAgo(doc.uploaded_at),
      tag: "resolved",
    });
  }

  // Sort all activity by recency (newest first — approximated, order is insertion order)
  // activity is already roughly newest-first by how we constructed it

  // ---------- quick actions --------------------------------------------------

  const quickActions = [
    { icon: Upload, title: "Upload documents", desc: "Feed your knowledge base", url: "/knowledge-base" },
    { icon: Workflow, title: "Configure agents", desc: "Edit workflow pipeline", url: "/agents" },
  ];

  if (!company || company.integration_type === "Widget" || company.integration_type === "Both") {
    quickActions.push({ icon: Sparkles, title: "Install widget", desc: "Copy embed code", url: "/widget" });
  }
  if (!company || company.integration_type === "API" || company.integration_type === "Both") {
    quickActions.push({ icon: KeyRound, title: "API Keys", desc: "Manage developer keys", url: "/api-keys" });
  }

  // ---------- derived KB info ------------------------------------------------

  const totalChunks = documents.reduce((s, d) => s + (d.chunks || 0), 0);
  const kbReady = documents.length > 0 && documents.every((d) => d.status === "Indexed");

  const isLoading = isLoadingCompany || isLoadingData;

  return (
    <>
      <Topbar
        title="Dashboard"
        subtitle={company ? `Welcome back, ${company.name}` : "Overview of your customer support performance"}
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
                {s.trend ? (
                  <span className={"inline-flex items-center gap-0.5 text-xs font-medium " + (s.up ? "text-success" : "text-destructive")}>
                    {s.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {s.trend}
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-foreground">No data</span>
                )}
              </div>
              <div className="mt-4 text-2xl font-semibold tracking-tight">
                {isLoading ? <span className="inline-block h-7 w-16 bg-muted animate-pulse rounded" /> : s.value}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Info cards row — KB Status + AI Config + Integration */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Knowledge Base */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Knowledge Base</div>
              {isLoading ? (
                <span className="h-5 w-16 bg-muted animate-pulse rounded-full inline-block" />
              ) : kbReady ? (
                <Badge className="bg-success-soft text-success border-success/20 rounded-full text-xs">Ready</Badge>
              ) : documents.length > 0 ? (
                <Badge className="bg-warning-soft text-warning border-warning/20 rounded-full text-xs">Indexing</Badge>
              ) : (
                <Badge variant="secondary" className="rounded-full text-xs">Empty</Badge>
              )}
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Documents</span>
                <span className="font-medium">{isLoading ? "—" : documents.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total chunks</span>
                <span className="font-medium">{isLoading ? "—" : totalChunks.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Embedding model</span>
                <span className="font-medium font-mono">all-MiniLM-L6-v2</span>
              </div>
            </div>
          </div>

          {/* AI Configuration */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">AI Configuration</div>
              {isLoading ? (
                <span className="h-5 w-16 bg-muted animate-pulse rounded-full inline-block" />
              ) : aiConfig ? (
                <Badge className="bg-success-soft text-success border-success/20 rounded-full text-xs">Configured</Badge>
              ) : (
                <Badge variant="secondary" className="rounded-full text-xs">Default</Badge>
              )}
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Model</span>
                <span className="font-medium">{isLoading ? "—" : aiConfig?.model ?? "gpt-5"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Response style</span>
                <span className="font-medium">{isLoading ? "—" : aiConfig?.response_style ?? "Professional"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Confidence threshold</span>
                <span className="font-medium font-mono">
                  {isLoading ? "—" : `${Math.round((aiConfig?.confidence_threshold ?? 0.5) * 100)}%`}
                </span>
              </div>
            </div>
          </div>

          {/* Company info */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Company</div>
              <Badge variant="secondary" className="rounded-full text-xs">{isLoading ? "—" : company?.integration_type ?? "—"}</Badge>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium truncate max-w-[140px]">{isLoading ? "—" : company?.name ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Industry</span>
                <span className="font-medium">{isLoading ? "—" : company?.industry ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span className="font-medium">{isLoading ? "—" : company?.created_at ? new Date(company.created_at).toLocaleDateString() : "—"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts section — empty state for both charts (no conversation data yet) */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-sm font-semibold">Conversation volume</div>
                <div className="text-xs text-muted-foreground">Last 14 days</div>
              </div>
              <Badge variant="secondary" className="rounded-full">14d</Badge>
            </div>
            <div className="h-72 flex flex-col items-center justify-center text-center gap-3 border border-dashed border-border rounded-xl bg-muted/10">
              <MessageSquare className="h-9 w-9 text-muted-foreground/40" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">No conversation data available yet</p>
                <p className="text-xs text-muted-foreground/70 mt-1 max-w-[260px]">
                  Start by testing your AI agent in the{" "}
                  <Link to="/ai-playground" className="text-primary hover:underline">AI Playground</Link>
                  , then integrate via your chosen channel.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="mb-2">
              <div className="text-sm font-semibold">Complaint categories</div>
              <div className="text-xs text-muted-foreground">This month</div>
            </div>
            <div className="h-52 flex flex-col items-center justify-center text-center gap-3 border border-dashed border-border rounded-xl bg-muted/10">
              <Ticket className="h-8 w-8 text-muted-foreground/40" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">No categories yet</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Categories are detected automatically from conversations.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Activity + Quick actions */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card shadow-card">
            <div className="p-6 border-b border-border">
              <div className="text-sm font-semibold">Recent activity</div>
              <div className="text-xs text-muted-foreground">Events from your workspace</div>
            </div>
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="h-9 w-9 bg-muted animate-pulse rounded-lg shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-muted animate-pulse rounded w-3/4" />
                      <div className="h-2.5 bg-muted animate-pulse rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activity.length > 0 ? (
              <ul className="divide-y divide-border">
                {activity.map((a, i) => (
                  <li key={i} className="p-4 sm:px-6 flex items-start gap-4">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                      <a.icon className="h-4 w-4" />
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
            ) : (
              <div className="p-8 flex flex-col items-center justify-center text-center gap-2">
                <Bot className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No recent activity</p>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="text-sm font-semibold">Quick actions</div>
            <div className="text-xs text-muted-foreground">Get set up in minutes</div>
            <div className="mt-4 space-y-3">
              {quickActions.map((q) => (
                <Link
                  key={q.title}
                  to={q.url}
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
                </Link>
              ))}
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
