import { createFileRoute } from "@tanstack/react-router";
import { Topbar } from "@/components/topbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Brain,
  User,
  Search,
  Scale,
  MessageSquareText,
  CircleCheck,
  ArrowDown,
  Plus,
  Settings2,
} from "lucide-react";

export const Route = createFileRoute("/_app/agents")({
  component: Agents,
  head: () => ({ meta: [{ title: "AI Agents — SupportAI" }] }),
});

const nodes = [
  {
    icon: Brain,
    title: "Complaint Analysis",
    desc: "Detect intent, sentiment, urgency",
    model: "GPT-4o",
    color: "chart-1",
  },
  {
    icon: User,
    title: "Customer Context",
    desc: "Fetch history, orders, tier",
    model: "Internal",
    color: "chart-5",
  },
  {
    icon: Search,
    title: "Knowledge Retrieval",
    desc: "RAG search across sources",
    model: "Embed-3",
    color: "chart-2",
  },
  {
    icon: Scale,
    title: "Decision Agent",
    desc: "Apply business rules",
    model: "Rules v4",
    color: "chart-3",
  },
  {
    icon: MessageSquareText,
    title: "Response Agent",
    desc: "Draft human-quality reply",
    model: "GPT-4o",
    color: "chart-4",
  },
  {
    icon: CircleCheck,
    title: "Follow-up Agent",
    desc: "Verify resolution + CSAT",
    model: "GPT-4o mini",
    color: "chart-1",
  },
];

function Agents() {
  return (
    <>
      <Topbar
        title="AI Agents"
        subtitle="Visual workflow that powers every conversation"
        actions={
          <>
            <Button variant="outline" size="sm" className="rounded-lg">
              <Settings2 className="h-4 w-4 mr-1.5" /> Configure
            </Button>
            <Button size="sm" className="rounded-lg">
              <Plus className="h-4 w-4 mr-1.5" /> Add agent
            </Button>
          </>
        }
      />
      <div className="p-6 lg:p-8">
        <div className="rounded-2xl border border-border bg-muted/20 p-8 lg:p-12 bg-grid">
          <div className="mx-auto max-w-md space-y-4">
            {nodes.map((n, i) => (
              <div key={n.title}>
                <div className="rounded-2xl border border-border bg-card shadow-elegant p-5 flex items-center gap-4">
                  <div
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white"
                    style={{ background: `var(--${n.color})` }}
                  >
                    <n.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-sm truncate">{n.title}</div>
                      <Badge variant="secondary" className="rounded-full text-[10px] px-2 py-0">
                        {n.model}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{n.desc}</div>
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground">0{i + 1}</div>
                </div>
                {i < nodes.length - 1 && (
                  <div className="flex justify-center py-2">
                    <div className="grid h-6 w-6 place-items-center rounded-full bg-card border border-border text-muted-foreground">
                      <ArrowDown className="h-3 w-3" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            { label: "Avg. pipeline latency", value: "1.2s" },
            { label: "Success rate (24h)", value: "98.7%" },
            { label: "Active agents", value: "6" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="text-xs text-muted-foreground">{s.label}</div>
              <div className="mt-1 text-2xl font-semibold tracking-tight">{s.value}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
