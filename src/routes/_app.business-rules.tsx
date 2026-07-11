import { createFileRoute } from "@tanstack/react-router";
import { Topbar } from "@/components/topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Save, Scale, RefreshCcw, ShieldCheck, AlertTriangle, Clock, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_app/business-rules")({
  component: BusinessRules,
  head: () => ({ meta: [{ title: "Business Rules — SupportAI" }] }),
});

const rules = [
  {
    icon: RefreshCcw,
    title: "Refund Rules",
    desc: "Auto-approve refunds under $50 within 30 days of purchase.",
    enabled: true,
  },
  {
    icon: Scale,
    title: "Replacement Rules",
    desc: "Offer replacement for damaged items before refunds.",
    enabled: true,
  },
  {
    icon: ShieldCheck,
    title: "Warranty Rules",
    desc: "Extend warranty checks up to 24 months from delivery.",
    enabled: true,
  },
  {
    icon: AlertTriangle,
    title: "Escalation Rules",
    desc: "Escalate to human agent when order value exceeds $500.",
    enabled: false,
  },
];

function BusinessRules() {
  return (
    <>
      <Topbar
        title="Business Rules"
        subtitle="Configure how AI applies your company policies"
        actions={
          <Button size="sm" className="rounded-lg">
            <Save className="h-4 w-4 mr-1.5" /> Save
          </Button>
        }
      />
      <div className="p-6 lg:p-8 space-y-6">
        {/* Rule toggles */}
        <div className="grid gap-4 md:grid-cols-2">
          {rules.map((r) => (
            <div key={r.title} className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-start gap-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                  <r.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold text-sm">{r.title}</div>
                    <Switch defaultChecked={r.enabled} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{r.desc}</p>
                  <Button variant="link" size="sm" className="px-0 mt-2 h-auto text-xs">Edit conditions →</Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Working hours */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center gap-3 mb-5">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <div className="font-semibold text-sm">Working hours</div>
              <div className="text-xs text-muted-foreground">Set when human agents are available</div>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Timezone</Label>
              <Input defaultValue="America/New_York" className="rounded-lg" />
            </div>
            <div className="space-y-1.5">
              <Label>Start</Label>
              <Input type="time" defaultValue="09:00" className="rounded-lg" />
            </div>
            <div className="space-y-1.5">
              <Label>End</Label>
              <Input type="time" defaultValue="18:00" className="rounded-lg" />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d, i) => (
              <button
                key={d}
                className={
                  "h-9 px-3 rounded-lg text-xs font-medium border transition-colors " +
                  (i < 5 ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground")
                }
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Custom prompt */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center gap-3 mb-5">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="font-semibold text-sm">Custom AI prompt</div>
              <div className="text-xs text-muted-foreground">Shape tone, personality, and policy adherence</div>
            </div>
          </div>
          <Textarea
            className="rounded-lg min-h-[160px] font-mono text-sm"
            defaultValue={`You are Acme's customer support assistant. Be warm, concise, and empathetic.
Never promise anything outside the policies above.
Always confirm order numbers before making changes.
When unsure, escalate to a human agent.`}
          />
          <div className="mt-3 flex justify-end">
            <Button className="rounded-lg" size="sm">
              <Save className="h-4 w-4 mr-1.5" /> Save prompt
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
