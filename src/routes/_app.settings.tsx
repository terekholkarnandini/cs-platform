import { createFileRoute } from "@tanstack/react-router";
import { Topbar } from "@/components/topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Save, Upload, CreditCard, Bell, ShieldCheck, Building2, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/settings")({
  component: Settings,
  head: () => ({ meta: [{ title: "Settings — SupportAI" }] }),
});

function Settings() {
  const { user, company, fetchCompany } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (company) {
      setName(company.name || "");
      setWebsite(company.website || "");
      setIndustry(company.industry || "");
      setSupportEmail(company.support_email || "");
      setLogoPreview(company.logo_url || null);
    }
  }, [company]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Logo file size must be less than 2MB.");
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      let finalLogoUrl = logoPreview;

      // Upload logo file if new file selected
      if (logoFile) {
        try {
          const fileExt = logoFile.name.split(".").pop();
          const filePath = `${user.id}/logo-${Date.now()}.${fileExt}`;
          const { data, error: uploadError } = await supabase.storage
            .from("logos")
            .upload(filePath, logoFile, { upsert: true });

          if (!uploadError && data) {
            const {
              data: { publicUrl },
            } = supabase.storage.from("logos").getPublicUrl(filePath);
            finalLogoUrl = publicUrl;
          } else {
            console.warn("Storage upload failed, keeping base64 logo", uploadError);
          }
        } catch (uploadException) {
          console.error("Storage upload threw, keeping base64 logo", uploadException);
        }
      }

      const { error } = await supabase.from("companies").upsert(
        {
          owner_id: user.id,
          name: name.trim(),
          industry,
          website: website.trim() || null,
          support_email: supportEmail.trim() || null,
          logo_url: finalLogoUrl || null,
        },
        { onConflict: "owner_id" },
      );

      if (error) throw error;
      toast.success("Settings saved successfully.");
      setLogoFile(null);
      await fetchCompany();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const initials = name ? name.substring(0, 1).toUpperCase() : "W";

  return (
    <>
      <Topbar
        title="Settings"
        subtitle="Company profile, billing, and security"
        actions={
          <Button size="sm" className="rounded-lg bg-primary" onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <span className="flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving...
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Save className="h-4 w-4" /> Save changes
              </span>
            )}
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
              <div className="text-xs text-muted-foreground">
                Basic information about your workspace
              </div>
              <div className="mt-6 flex items-center gap-4">
                {logoPreview ? (
                  <div className="relative group">
                    <img
                      src={logoPreview}
                      alt="Company Logo"
                      className="h-16 w-16 rounded-2xl object-contain border border-border bg-white"
                    />
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground hover:bg-destructive/95 rounded-full p-1 shadow transition-all scale-75 cursor-pointer"
                      title="Remove logo"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-primary text-white text-lg font-bold shadow-glow">
                    {initials}
                  </div>
                )}
                <div className="relative">
                  <input
                    type="file"
                    id="logo-upload"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Button variant="outline" className="rounded-lg" size="sm" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-1.5" /> Upload logo
                    </span>
                  </Button>
                </div>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="settings-company-name">Company name</Label>
                  <Input
                    id="settings-company-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="settings-website">Website</Label>
                  <Input
                    id="settings-website"
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="settings-industry">Industry</Label>
                  <Input
                    id="settings-industry"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="settings-support-email">Support email</Label>
                  <Input
                    id="settings-support-email"
                    type="email"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    className="rounded-lg"
                  />
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
                  <div className="text-xs text-muted-foreground mt-1">
                    $249/month · renews Nov 8, 2025
                  </div>
                </div>
                <Button variant="outline" className="rounded-lg" size="sm">
                  Change plan
                </Button>
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
              <div className="text-xs text-muted-foreground">
                Choose what you want to hear about
              </div>
              <div className="mt-6 space-y-4">
                {[
                  {
                    l: "Escalations to human agents",
                    d: "When AI transfers a conversation",
                    on: true,
                  },
                  { l: "Weekly summary", d: "Every Monday at 9am", on: true },
                  { l: "New CSAT below 3", d: "So you can follow up quickly", on: true },
                  { l: "Product updates", d: "New features and improvements", on: false },
                ].map((n) => (
                  <div
                    key={n.l}
                    className="flex items-center justify-between gap-4 pb-4 border-b border-border last:border-0 last:pb-0"
                  >
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
                  <div
                    key={n.l}
                    className="flex items-center justify-between gap-4 pb-4 border-b border-border last:border-0 last:pb-0"
                  >
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
