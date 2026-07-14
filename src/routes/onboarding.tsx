import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  Upload,
  Trash2,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  MessageSquareCode,
  Sparkles,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/lib/theme";

export const Route = createFileRoute("/onboarding")({
  component: Onboarding,
  head: () => ({ meta: [{ title: "Onboarding — SupportAI" }] }),
});

function Onboarding() {
  const { user, isLoading, onboardingCompleted, isLoadingCompany, fetchCompany } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [website, setWebsite] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [integrationType, setIntegrationType] = useState<"API" | "Widget" | "Both">("Both");

  // Redirect checks
  useEffect(() => {
    if (!isLoading && !isLoadingCompany) {
      if (!user) {
        navigate({ to: "/login" });
      } else if (onboardingCompleted) {
        navigate({ to: "/dashboard" });
      }
    }
  }, [user, isLoading, isLoadingCompany, onboardingCompleted, navigate]);

  // Pre-fill states from user metadata
  useEffect(() => {
    if (user) {
      const metadata = user.user_metadata || {};
      if (metadata.company_name && !name) setName(metadata.company_name);
      if (metadata.industry && !industry) setIndustry(metadata.industry);
      if (metadata.company_size && !companySize) setCompanySize(metadata.company_size);
      if (user.email && !supportEmail) setSupportEmail(user.email);
    }
  }, [user]);

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

  const nextStep = () => {
    if (step === 1) {
      if (!name.trim()) {
        toast.error("Please enter your company name.");
        return;
      }
      if (!industry) {
        toast.error("Please select your industry.");
        return;
      }
      if (!companySize) {
        toast.error("Please select your company size.");
        return;
      }
    }
    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!user) return;
    setIsSaving(true);

    try {
      let finalLogoUrl = logoPreview || "";

      // 1. Upload logo to Supabase storage if file was provided
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
            console.warn(
              "Storage bucket upload failed, using Base64 data URL fallback.",
              uploadError,
            );
          }
        } catch (uploadException) {
          console.error("Logo upload process threw, storing in database via base64.", uploadException);
        }
      }

      // 2. Upsert into companies table
      const companyPayload = {
        owner_id: user.id,
        name: name.trim(),
        industry,
        company_size: companySize,
        logo_url: finalLogoUrl || null,
        integration_type: integrationType,
        onboarding_completed: true,
        website: website.trim() || null,
        support_email: supportEmail.trim() || null,
      };

      const { error: upsertError } = await supabase
        .from("companies")
        .upsert(companyPayload, { onConflict: "owner_id" });

      if (upsertError) {
        throw upsertError;
      }

      toast.success("Workspace configured successfully! Welcome onboard.");

      // Refresh auth context which triggers the redirect to dashboard
      await fetchCompany();
    } catch (err: any) {
      console.error("Onboarding failed:", err);
      toast.error(err.message || "Failed to complete onboarding. Please try again.");
      setIsSaving(false);
    }
  };

  if (isLoading || isLoadingCompany || onboardingCompleted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading onboarding...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="h-16 px-6 border-b border-border flex items-center justify-between">
        <Logo />
        <ThemeToggle />
      </header>

      {/* Progress Wizard Indicator */}
      <div className="max-w-xl w-full mx-auto px-6 mt-8">
        <div className="flex items-center justify-between relative">
          {/* Progress bar line */}
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-muted z-0" />
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-primary transition-all duration-300 z-0"
            style={{ width: `${((step - 1) / 2) * 100}%` }}
          />

          {[
            { s: 1, label: "Company Details" },
            { s: 2, label: "Branding" },
            { s: 3, label: "Integration" },
          ].map((item) => (
            <div key={item.s} className="relative z-10 flex flex-col items-center gap-1.5">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
                  step === item.s
                    ? "bg-primary text-white ring-4 ring-primary/20 scale-110 shadow-glow"
                    : step > item.s
                      ? "bg-primary text-white"
                      : "bg-card border border-border text-muted-foreground"
                }`}
              >
                {step > item.s ? <Check className="h-4 w-4" /> : item.s}
              </div>
              <span className="text-[11px] font-medium text-muted-foreground hidden sm:inline">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Content Form Card */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-border bg-card shadow-elegant p-6 sm:p-8 space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">Tell us about your company</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  We'll customize your SupportAI experience based on your industry and team.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="company-name">Company name</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="company-name"
                      placeholder="Acme Inc."
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-9 h-11 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="industry-select">Industry</Label>
                    <Select onValueChange={setIndustry} value={industry}>
                      <SelectTrigger id="industry-select" className="h-11 rounded-lg">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ecom">E-commerce</SelectItem>
                        <SelectItem value="saas">SaaS</SelectItem>
                        <SelectItem value="fintech">Fintech</SelectItem>
                        <SelectItem value="health">Healthcare</SelectItem>
                        <SelectItem value="edu">Education</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="size-select">Company size</Label>
                    <Select onValueChange={setCompanySize} value={companySize}>
                      <SelectTrigger id="size-select" className="h-11 rounded-lg">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-10">1-10</SelectItem>
                        <SelectItem value="11-50">11-50</SelectItem>
                        <SelectItem value="51-200">51-200</SelectItem>
                        <SelectItem value="201-500">201-500</SelectItem>
                        <SelectItem value="501+">501+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">Add your branding</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Upload your logo and add your links to customize the support widget.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label>Company Logo</Label>
                  {logoPreview ? (
                    <div className="flex items-center gap-4 p-3 border border-border rounded-xl bg-muted/20">
                      <img
                        src={logoPreview}
                        alt="Logo Preview"
                        className="h-14 w-14 rounded-lg object-contain bg-white border border-border"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">
                          {logoFile ? logoFile.name : "Company Logo"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {logoFile ? `${(logoFile.size / 1024).toFixed(0)} KB` : "Uploaded URL"}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={removeLogo}
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="relative group border-2 border-dashed border-border hover:border-primary/50 transition-colors rounded-xl p-6 text-center cursor-pointer bg-muted/10">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Upload className="mx-auto h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors mb-2" />
                      <p className="text-xs font-semibold">Upload a file</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">PNG, JPG, SVG up to 2MB</p>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="website-url">Website URL (optional)</Label>
                  <Input
                    id="website-url"
                    type="url"
                    placeholder="https://acme.com"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="h-11 rounded-lg"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="support-email">Support Email (optional)</Label>
                  <Input
                    id="support-email"
                    type="email"
                    placeholder="support@acme.com"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    className="h-11 rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">Choose your integration type</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  How do you plan to use SupportAI? You can change this setting at any time.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                {[
                  {
                    id: "API" as const,
                    title: "Developer API",
                    desc: "Integrate customer replies directly into your core application logic.",
                    icon: KeyRound,
                  },
                  {
                    id: "Widget" as const,
                    title: "Support Widget",
                    desc: "Embed our beautiful customer chat bubble directly on your website.",
                    icon: MessageSquareCode,
                  },
                  {
                    id: "Both" as const,
                    title: "API + Support Widget",
                    desc: "Get total versatility with both a ready-to-embed widget and developer APIs.",
                    icon: Sparkles,
                  },
                ].map((option) => {
                  const Icon = option.icon;
                  const selected = integrationType === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setIntegrationType(option.id)}
                      className={`w-full flex items-start gap-4 rounded-xl border text-left p-4 transition-all duration-200 cursor-pointer ${
                        selected
                          ? "border-primary bg-primary-soft ring-2 ring-primary/10 shadow-sm"
                          : "border-border hover:bg-muted/30"
                      }`}
                    >
                      <div
                        className={`grid h-8 w-8 place-items-center rounded-lg ${
                          selected ? "bg-primary text-white shadow-glow" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold flex items-center justify-between">
                          {option.title}
                          {selected && <span className="h-2 w-2 rounded-full bg-primary" />}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                          {option.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            {step > 1 ? (
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={isSaving}
                className="rounded-lg h-10 px-4"
              >
                <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
              </Button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <Button
                type="button"
                onClick={nextStep}
                className="rounded-lg bg-primary hover:bg-primary-hover text-white h-10 px-4 ml-auto"
              >
                Next <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSaving}
                className="rounded-lg bg-primary hover:bg-primary-hover text-white h-10 px-4 ml-auto"
              >
                {isSaving ? (
                  <span className="flex items-center gap-1.5">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Setting up...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    Complete Setup <Check className="h-4 w-4" />
                  </span>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
