import { createFileRoute } from "@tanstack/react-router";
import { Topbar } from "@/components/topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Save, Upload, CreditCard, Bell, ShieldCheck, Building2 } from "lucide-react";

export const Route = createFileRoute("/_app/settings")({
  component: Settings,
  head: () => ({ meta: [{ title: "Settings — SupportAI" }] }),
});

function Settings() {
  return (
    <>
      <Topbar
        title="Settings"
        subtitle="Company profile, billing, and security"
        actions={
          <Button size="sm" className="rounded-lg">
            <Save className="h-4 w-4 mr-1.5" /> Save changes
          </Button>
        }
      />
      <div className="p-6 lg:p-8">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="rounded-xl h-11 p-1">
            <TabsTrigger value="profile" className="rounded-lg gap-1.5">
              <Building2 className="h-3.5 w-3.5" /> Profile
            </TabsTrigger>
            <TabsTrigger value="billing" className="rounded-lg gap-1.5">
              <CreditCard className="h-3.5 w-3.5" /> Billing
            </TabsTrigger>
            <TabsTrigger value="notifications" className="rounded-lg gap-1.5">
              <Bell className="h-3.5 w-3.5" /> Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="rounded-lg gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" /> Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <div className="text-sm font-semibold">Company profile</div>
              <div className="text-xs text-muted-foreground">Basic information about your workspace</div>
              <div className="mt-6 flex items-center gap-4">
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-primary text-white text-lg font-bold shadow-glow">
                  A
                </div>
                <Button variant="outline" className="rounded-lg" size="sm">
                  <Upload className="h-4 w-4 mr-1.5" /> Upload logo
                </Button>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Company name</Label>
                  <Input defaultValue="Acme Inc." className="rounded-lg" />
                </div>
                <div className="space-y-1.5">
                  <Label>Website</Label>
                  <Input defaultValue="https://acme.com" className="rounded-lg" />
                </div>
                <div className="space-y-1.5">
                  <Label>Industry</Label>
                  <Input defaultValue="E-commerce" className="rounded-lg" />
                </div>
                <div className="space-y-1.5">
                  <Label>Support email</Label>
                  <Input defaultValue="support@acme.com" className="rounded-lg" />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold flex items-center gap-2">
                    Growth plan <Badge className="rounded-full">Active</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">$249/month · renews Nov 8, 2025</div>
                </div>
                <Button variant="outline" className="rounded-lg" size="sm">Change plan</Button>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {[
                  { l: "AI resolutions used", v: "6,240 / 10,000" },
                  { l: "Next invoice", v: "$249.00" },
                  { l: "Payment method", v: "•••• 4242" },
                ].map((s) => (
                  <div key={s.l} className="rounded-xl border border-border p-4">
                    <div className="text-xs text-muted-foreground">{s.l}</div>
                    <div className="mt-1 text-lg font-semibold tracking-tight">{s.v}</div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <div className="text-sm font-semibold">Email notifications</div>
              <div className="text-xs text-muted-foreground">Choose what you want to hear about</div>
              <div className="mt-6 space-y-4">
                {[
                  { l: "Escalations to human agents", d: "When AI transfers a conversation", on: true },
                  { l: "Weekly summary", d: "Every Monday at 9am", on: true },
                  { l: "New CSAT below 3", d: "So you can follow up quickly", on: true },
                  { l: "Product updates", d: "New features and improvements", on: false },
                ].map((n) => (
                  <div key={n.l} className="flex items-center justify-between gap-4 pb-4 border-b border-border last:border-0 last:pb-0">
                    <div>
                      <div className="text-sm font-medium">{n.l}</div>
                      <div className="text-xs text-muted-foreground">{n.d}</div>
                    </div>
                    <Switch defaultChecked={n.on} />
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <div className="text-sm font-semibold">Security</div>
              <div className="text-xs text-muted-foreground">Protect your workspace</div>
              <div className="mt-6 space-y-4">
                {[
                  { l: "Two-factor authentication", d: "Required for all admins", on: true },
                  { l: "SSO / SAML", d: "Enterprise plan required", on: false },
                  { l: "IP allowlist", d: "Restrict dashboard access by IP", on: false },
                ].map((n) => (
                  <div key={n.l} className="flex items-center justify-between gap-4 pb-4 border-b border-border last:border-0 last:pb-0">
                    <div>
                      <div className="text-sm font-medium">{n.l}</div>
                      <div className="text-xs text-muted-foreground">{n.d}</div>
                    </div>
                    <Switch defaultChecked={n.on} />
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
