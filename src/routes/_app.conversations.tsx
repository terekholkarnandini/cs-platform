import { createFileRoute } from "@tanstack/react-router";
import { Topbar } from "@/components/topbar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Search, Send, Sparkles, Paperclip, Bot } from "lucide-react";

export const Route = createFileRoute("/_app/conversations")({
  component: Conversations,
  head: () => ({ meta: [{ title: "Conversations — SupportAI" }] }),
});

const list = [
  { name: "Emma Wilson", subject: "Where is my order #A-2841?", time: "2m", tag: "AI", unread: true },
  { name: "Marcus Chen", subject: "Refund for damaged product", time: "12m", tag: "Human", unread: true },
  { name: "Sarah Kim", subject: "Warranty question — Model X", time: "34m", tag: "AI" },
  { name: "David Park", subject: "How do I cancel my subscription?", time: "1h", tag: "AI" },
  { name: "Lisa Rodriguez", subject: "Product available in blue?", time: "2h", tag: "AI" },
  { name: "Tom Ashford", subject: "Bulk pricing for 500 units", time: "3h", tag: "Human" },
];

const messages = [
  { role: "user", text: "Hi, my order #A-2841 was supposed to arrive yesterday. Where is it?", time: "10:24" },
  { role: "ai", text: "Hi Emma — I'm sorry for the delay. Let me check your order right away.", time: "10:24" },
  { role: "ai", text: "Order #A-2841 shipped on Oct 8 and is currently in transit. UPS shows it's out for delivery today by 6pm. Tracking: 1Z999AA10123456784.", time: "10:24" },
  { role: "user", text: "Great, thank you! Can I change the delivery address?", time: "10:26" },
  { role: "ai", text: "Once a package is out for delivery, the address can't be changed from our side — but you can redirect it directly with UPS via UPS My Choice. Want me to send you the link?", time: "10:26" },
];

function Conversations() {
  return (
    <>
      <Topbar title="Conversations" subtitle="Live inbox from your AI + human agents" />
      <div className="p-6 lg:p-8">
        <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden grid lg:grid-cols-[320px_1fr] min-h-[70vh]">
          {/* List */}
          <div className="border-r border-border flex flex-col">
            <div className="p-4 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search inbox" className="pl-9 h-9 rounded-lg" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-border">
              {list.map((c, i) => (
                <button
                  key={c.name}
                  className={
                    "w-full text-left p-4 flex gap-3 hover:bg-muted/50 transition-colors " +
                    (i === 0 ? "bg-primary-soft/40" : "")
                  }
                >
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback className="text-xs bg-muted">
                      {c.name.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-medium truncate">{c.name}</div>
                      <div className="text-[11px] text-muted-foreground shrink-0">{c.time}</div>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{c.subject}</div>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <Badge
                        variant="secondary"
                        className={
                          "rounded-full text-[10px] px-2 py-0 " +
                          (c.tag === "AI" ? "bg-primary-soft text-primary" : "")
                        }
                      >
                        {c.tag}
                      </Badge>
                      {c.unread && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Thread */}
          <div className="flex flex-col">
            <div className="border-b border-border p-4 flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="text-xs bg-muted">EW</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">Emma Wilson</div>
                <div className="text-xs text-muted-foreground">emma@wilson.co · order #A-2841</div>
              </div>
              <Badge className="rounded-full bg-success-soft text-success" variant="secondary">
                Resolved by AI
              </Badge>
            </div>

            <div className="flex-1 p-6 space-y-4 overflow-y-auto bg-muted/20">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={"flex gap-3 " + (m.role === "user" ? "" : "flex-row-reverse")}
                >
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-card border border-border">
                    {m.role === "user" ? (
                      <span className="text-xs font-medium">E</span>
                    ) : (
                      <Bot className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div
                    className={
                      "max-w-md rounded-2xl px-4 py-2.5 text-sm " +
                      (m.role === "user"
                        ? "bg-card border border-border rounded-tl-sm"
                        : "bg-primary text-primary-foreground rounded-tr-sm")
                    }
                  >
                    {m.text}
                    <div
                      className={
                        "mt-1 text-[10px] " +
                        (m.role === "user" ? "text-muted-foreground" : "text-primary-foreground/70")
                      }
                    >
                      {m.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border p-4">
              <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-2">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Input placeholder="Type a reply, or press ⌘K for AI…" className="border-0 shadow-none focus-visible:ring-0" />
                <Button variant="ghost" size="icon" className="h-8 w-8 text-primary">
                  <Sparkles className="h-4 w-4" />
                </Button>
                <Button size="icon" className="h-8 w-8 rounded-lg">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
