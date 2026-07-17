import { createFileRoute } from "@tanstack/react-router";
import { Topbar } from "@/components/topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Save, Scale, RefreshCcw, ShieldCheck, AlertTriangle, Clock, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { getBusinessRules, createBusinessRules, upsertBusinessRules } from "@/lib/business-rules";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/business-rules")({
  component: BusinessRules,
  head: () => ({ meta: [{ title: "Business Rules — SupportAI" }] }),
});

function BusinessRules() {
  const { company } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Rule states
  const [refundEnabled, setRefundEnabled] = useState(false);
  const [refundAmountLimit, setRefundAmountLimit] = useState(50);
  const [refundDays, setRefundDays] = useState(30);

  const [replacementEnabled, setReplacementEnabled] = useState(false);
  const [replacementCondition, setReplacementCondition] = useState("damaged items");

  const [warrantyEnabled, setWarrantyEnabled] = useState(false);
  const [warrantyMonths, setWarrantyMonths] = useState(24);

  const [escalationEnabled, setEscalationEnabled] = useState(false);
  const [escalationOrderAmount, setEscalationOrderAmount] = useState(500);

  const [timezone, setTimezone] = useState("America/New_York");
  const [workingStart, setWorkingStart] = useState("09:00");
  const [workingEnd, setWorkingEnd] = useState("18:00");
  const [workingDays, setWorkingDays] = useState<string[]>(["Mon", "Tue", "Wed", "Thu", "Fri"]);
  const [customPrompt, setCustomPrompt] = useState("");

  const [editingRule, setEditingRule] = useState<string | null>(null);

  const loadRules = async () => {
    if (!company?.id) return;
    setIsLoading(true);
    try {
      let rulesData = await getBusinessRules(company.id);
      if (!rulesData) {
        // Automatically create default Business Rules
        rulesData = await createBusinessRules(company.id);
      }

      // Populate every UI field
      setRefundEnabled(rulesData.refund_enabled);
      setRefundAmountLimit(Number(rulesData.refund_amount_limit));
      setRefundDays(Number(rulesData.refund_days));

      setReplacementEnabled(rulesData.replacement_enabled);
      setReplacementCondition(rulesData.replacement_condition || "damaged items");

      setWarrantyEnabled(rulesData.warranty_enabled);
      setWarrantyMonths(Number(rulesData.warranty_months));

      setEscalationEnabled(rulesData.escalation_enabled);
      setEscalationOrderAmount(Number(rulesData.escalation_order_amount));

      setTimezone(rulesData.timezone || "America/New_York");
      setWorkingStart(rulesData.working_start ? rulesData.working_start.slice(0, 5) : "09:00");
      setWorkingEnd(rulesData.working_end ? rulesData.working_end.slice(0, 5) : "18:00");
      setWorkingDays(rulesData.working_days || ["Mon", "Tue", "Wed", "Thu", "Fri"]);
      setCustomPrompt(rulesData.custom_prompt || "");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load business rules.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (company?.id) {
      loadRules();
    }
  }, [company?.id]);

  const handleSave = async () => {
    if (!company?.id) {
      toast.error("No company profile found.");
      return;
    }
    setIsSaving(true);
    try {
      // Validate inputs
      if (refundEnabled) {
        if (isNaN(refundAmountLimit) || refundAmountLimit <= 0) {
          throw new Error("Refund amount limit must be a positive number.");
        }
        if (isNaN(refundDays) || refundDays <= 0) {
          throw new Error("Refund period must be a positive number of days.");
        }
      }
      if (replacementEnabled && !replacementCondition.trim()) {
        throw new Error("Replacement condition is required when replacements are enabled.");
      }
      if (warrantyEnabled) {
        if (isNaN(warrantyMonths) || warrantyMonths <= 0) {
          throw new Error("Warranty period must be a positive number of months.");
        }
      }
      if (escalationEnabled) {
        if (isNaN(escalationOrderAmount) || escalationOrderAmount <= 0) {
          throw new Error("Escalation order amount must be a positive number.");
        }
      }
      if (!timezone.trim()) {
        throw new Error("Timezone is required.");
      }
      if (!workingStart || !workingEnd) {
        throw new Error("Working hours (Start and End) are required.");
      }

      await upsertBusinessRules(company.id, {
        refund_enabled: refundEnabled,
        refund_amount_limit: refundAmountLimit,
        refund_days: refundDays,
        replacement_enabled: replacementEnabled,
        replacement_condition: replacementCondition,
        warranty_enabled: warrantyEnabled,
        warranty_months: warrantyMonths,
        escalation_enabled: escalationEnabled,
        escalation_order_amount: escalationOrderAmount,
        timezone,
        working_start: workingStart + ":00",
        working_end: workingEnd + ":00",
        working_days: workingDays,
        custom_prompt: customPrompt,
      });

      toast.success("Business rules saved successfully.");
      await loadRules();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save business rules.");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleWorkingDay = (day: string) => {
    setWorkingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const rulesList = [
    {
      icon: RefreshCcw,
      title: "Refund Rules",
      desc: `Auto-approve refunds under $${refundAmountLimit} within ${refundDays} days of purchase.`,
      enabled: refundEnabled,
      setEnabled: setRefundEnabled,
    },
    {
      icon: Scale,
      title: "Replacement Rules",
      desc: `Offer replacement for ${replacementCondition || "damaged items"} before refunds.`,
      enabled: replacementEnabled,
      setEnabled: setReplacementEnabled,
    },
    {
      icon: ShieldCheck,
      title: "Warranty Rules",
      desc: `Extend warranty checks up to ${warrantyMonths} months from delivery.`,
      enabled: warrantyEnabled,
      setEnabled: setWarrantyEnabled,
    },
    {
      icon: AlertTriangle,
      title: "Escalation Rules",
      desc: `Escalate to human agent when order value exceeds $${escalationOrderAmount}.`,
      enabled: escalationEnabled,
      setEnabled: setEscalationEnabled,
    },
  ];

  if (isLoading) {
    return (
      <>
        <Topbar
          title="Business Rules"
          subtitle="Configure how AI applies your company policies"
          actions={
            <Button size="sm" className="rounded-lg" disabled>
              <Save className="h-4 w-4 mr-1.5 animate-spin" /> Loading
            </Button>
          }
        />
        <div className="p-6 lg:p-8 space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-5 shadow-card animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 shrink-0 rounded-xl bg-muted" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-4 w-24 bg-muted rounded" />
                    <div className="h-3 w-full bg-muted rounded" />
                    <div className="h-3 w-16 bg-muted rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card animate-pulse space-y-4">
            <div className="h-6 w-32 bg-muted rounded" />
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="h-10 bg-muted rounded" />
              <div className="h-10 bg-muted rounded" />
              <div className="h-10 bg-muted rounded" />
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card animate-pulse space-y-4">
            <div className="h-6 w-32 bg-muted rounded" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar
        title="Business Rules"
        subtitle="Configure how AI applies your company policies"
        actions={
          <Button size="sm" className="rounded-lg cursor-pointer" onClick={handleSave} disabled={isSaving}>
            <Save className={cn("h-4 w-4 mr-1.5", isSaving && "animate-spin")} /> {isSaving ? "Saving..." : "Save"}
          </Button>
        }
      />
      <div className="p-6 lg:p-8 space-y-6">
        {/* Rule toggles */}
        <div className="grid gap-4 md:grid-cols-2">
          {rulesList.map((r) => (
            <div key={r.title} className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-start gap-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                  <r.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold text-sm">{r.title}</div>
                    <Switch checked={r.enabled} onCheckedChange={r.setEnabled} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{r.desc}</p>
                  <Button
                    variant="link"
                    size="sm"
                    className="px-0 mt-2 h-auto text-xs cursor-pointer"
                    onClick={() => setEditingRule(r.title)}
                  >
                    Edit conditions →
                  </Button>
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
              <div className="text-xs text-muted-foreground">
                Set when human agents are available
              </div>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="workingStart">Start</Label>
              <Input
                id="workingStart"
                type="time"
                value={workingStart}
                onChange={(e) => setWorkingStart(e.target.value)}
                className="rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="workingEnd">End</Label>
              <Input
                id="workingEnd"
                type="time"
                value={workingEnd}
                onChange={(e) => setWorkingEnd(e.target.value)}
                className="rounded-lg"
              />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => toggleWorkingDay(d)}
                className={cn(
                  "h-9 px-3 rounded-lg text-xs font-medium border transition-colors cursor-pointer",
                  workingDays.includes(d)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border text-muted-foreground"
                )}
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
              <div className="text-xs text-muted-foreground">
                Shape tone, personality, and policy adherence
              </div>
            </div>
          </div>
          <Textarea
            className="rounded-lg min-h-[160px] font-mono text-sm"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
          />
          <div className="mt-3 flex justify-end">
            <Button className="rounded-lg cursor-pointer" size="sm" onClick={handleSave} disabled={isSaving}>
              <Save className={cn("h-4 w-4 mr-1.5", isSaving && "animate-spin")} /> {isSaving ? "Saving prompt..." : "Save prompt"}
            </Button>
          </div>
        </div>
      </div>

      {/* Edit conditions dialog */}
      <Dialog open={editingRule !== null} onOpenChange={(open) => !open && setEditingRule(null)}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit {editingRule} Conditions</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {editingRule === "Refund Rules" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="refundAmount">Refund Limit Amount ($)</Label>
                  <Input
                    id="refundAmount"
                    type="number"
                    value={refundAmountLimit}
                    onChange={(e) => setRefundAmountLimit(Number(e.target.value))}
                    min={0}
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="refundDays">Refund Period (Days)</Label>
                  <Input
                    id="refundDays"
                    type="number"
                    value={refundDays}
                    onChange={(e) => setRefundDays(Number(e.target.value))}
                    min={0}
                    className="rounded-lg"
                  />
                </div>
              </>
            )}

            {editingRule === "Replacement Rules" && (
              <div className="space-y-2">
                <Label htmlFor="replacementCondition">Replacement Condition</Label>
                <Textarea
                  id="replacementCondition"
                  value={replacementCondition}
                  onChange={(e) => setReplacementCondition(e.target.value)}
                  placeholder="e.g. damaged items"
                  className="rounded-lg min-h-[100px]"
                />
              </div>
            )}

            {editingRule === "Warranty Rules" && (
              <div className="space-y-2">
                <Label htmlFor="warrantyMonths">Warranty Period (Months)</Label>
                <Input
                  id="warrantyMonths"
                  type="number"
                  value={warrantyMonths}
                  onChange={(e) => setWarrantyMonths(Number(e.target.value))}
                  min={0}
                  className="rounded-lg"
                />
              </div>
            )}

            {editingRule === "Escalation Rules" && (
              <div className="space-y-2">
                <Label htmlFor="escalationAmount">Escalation Threshold Amount ($)</Label>
                <Input
                  id="escalationAmount"
                  type="number"
                  value={escalationOrderAmount}
                  onChange={(e) => setEscalationOrderAmount(Number(e.target.value))}
                  min={0}
                  className="rounded-lg"
                />
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setEditingRule(null)} className="rounded-lg cursor-pointer">
              Cancel
            </Button>
            <Button onClick={() => setEditingRule(null)} className="rounded-lg cursor-pointer">
              Apply
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
