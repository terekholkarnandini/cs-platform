import { createFileRoute } from "@tanstack/react-router";
import { Topbar } from "@/components/topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Copy, RefreshCw, Eye, EyeOff, ExternalLink } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_app/api-keys")({
  component: ApiKeys,
  head: () => ({ meta: [{ title: "API Keys — SupportAI" }] }),
});

const keys = [
  {
    name: "Production",
    key: "sk_live_4f9a3b2c8e7d5f1a9b3c",
    created: "Oct 8, 2025",
    used: "2 min ago",
  },
  {
    name: "Development",
    key: "sk_test_2b8e7d5f1a9b3c4f9a",
    created: "Sep 22, 2025",
    used: "3h ago",
  },
];

function ApiKeys() {
  const [reveal, setReveal] = useState<Record<string, boolean>>({});

  return (
    <>
      <Topbar title="API Keys" subtitle="Manage keys, webhooks, and API usage" />
      <div className="p-6 lg:p-8 space-y-6">
        {/* Usage */}
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { l: "Requests (24h)", v: "48,291", d: "of 100k limit" },
            { l: "Rate limit", v: "1,000/min", d: "current tier" },
            { l: "Uptime", v: "99.99%", d: "last 90 days" },
          ].map((s) => (
            <div key={s.l} className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="text-xs text-muted-foreground">{s.l}</div>
              <div className="mt-1 text-2xl font-semibold tracking-tight">{s.v}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.d}</div>
            </div>
          ))}
        </div>

        {/* Keys */}
        <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">API keys</div>
              <div className="text-xs text-muted-foreground">
                Keep these secret — treat like passwords
              </div>
            </div>
            <Button size="sm" className="rounded-lg">
              Generate new key
            </Button>
          </div>
          <ul className="divide-y divide-border">
            {keys.map((k) => (
              <li key={k.key} className="p-5 flex flex-wrap items-center gap-4">
                <div>
                  <div className="text-sm font-medium">{k.name}</div>
                  <div className="text-xs text-muted-foreground">
                    Created {k.created} · used {k.used}
                  </div>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <code className="text-xs font-mono px-3 py-1.5 rounded-lg bg-muted border border-border">
                    {reveal[k.key]
                      ? k.key
                      : k.key.replace(/./g, (c, i) => (i < 8 || i > k.key.length - 4 ? c : "•"))}
                  </code>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => setReveal((r) => ({ ...r, [k.key]: !r[k.key] }))}
                  >
                    {reveal[k.key] ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8">
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-lg">
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Regenerate
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Webhooks */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="text-sm font-semibold">Webhook endpoint</div>
          <div className="text-xs text-muted-foreground">
            Receive events for conversations, resolutions, and CSAT.
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
            <div className="space-y-1.5">
              <Label htmlFor="hook">Webhook URL</Label>
              <Input
                id="hook"
                defaultValue="https://api.acme.com/webhooks/supportai"
                className="h-10 rounded-lg font-mono text-sm"
              />
            </div>
            <div className="flex items-end">
              <Button className="rounded-lg h-10">Save webhook</Button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {["conversation.created", "message.sent", "conversation.resolved", "csat.received"].map(
              (e) => (
                <Badge key={e} variant="secondary" className="rounded-full font-mono text-[11px]">
                  {e}
                </Badge>
              ),
            )}
          </div>
        </div>

        {/* Docs */}
        <div className="rounded-2xl border border-border bg-gradient-to-br from-primary-soft to-transparent p-6 shadow-card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold">API Documentation</div>
              <div className="text-xs text-muted-foreground mt-1">
                Full reference, code samples, and interactive playground.
              </div>
            </div>
            <Button variant="outline" className="rounded-lg" size="sm">
              Open docs <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
