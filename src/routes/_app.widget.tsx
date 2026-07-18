import { createFileRoute } from "@tanstack/react-router";
import { Topbar } from "@/components/topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Copy, MessageCircle, X, Send } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/widget")({
  component: Widget,
  head: () => ({ meta: [{ title: "Widget — SupportAI" }] }),
});

const swatches = ["#10B981", "#334155", "#F59E0B", "#3B82F6", "#EF4444", "#475569"];

function Widget() {
  const { company, session } = useAuth();
  const [color, setColor] = useState(swatches[0]);
  const [greeting, setGreeting] = useState("Hi there! 👋 How can I help you today?");
  const [logoUrl, setLogoUrl] = useState("");
  const [position, setPosition] = useState("br");
  const [theme, setTheme] = useState("light");
  const [title, setTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Fetch widget configuration from backend
  useEffect(() => {
    async function loadWidgetSettings() {
      const token = session?.access_token;
      if (!token) return;
      try {
        const res = await fetch("http://localhost:8000/api/companies/me/widget", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.widget_color) setColor(data.widget_color);
          if (data.widget_greeting) setGreeting(data.widget_greeting);
          if (data.widget_position) setPosition(data.widget_position);
          if (data.widget_theme) setTheme(data.widget_theme);
          if (data.widget_title) setTitle(data.widget_title);
          if (data.logo_url) setLogoUrl(data.logo_url);
          else if (company?.logo_url) setLogoUrl(company.logo_url);
        }
      } catch (err) {
        console.error("Error loading widget settings:", err);
      }
    }

    if (session?.access_token) {
      loadWidgetSettings();
    }
  }, [session, company]);

  const companyName = title || company?.name || "Acme";

  // Use the actual company ID as workspace identifier so it resolves reliably
  const workspaceIdentifier = company?.id || "acme-inc";

  const embedCode = `<script src="http://localhost:8000/api/widget/w.js"
  data-workspace="${workspaceIdentifier}"
  defer></script>`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(embedCode);
    toast.success("Embed code copied to clipboard!");
  };

  const handleSaveChanges = async () => {
    const token = session?.access_token;
    if (!token) {
      toast.error("You are not authenticated.");
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch("http://localhost:8000/api/companies/me/widget", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          widget_color: color,
          widget_greeting: greeting,
          widget_position: position,
          widget_theme: theme,
          widget_title: title || `${company?.name || "Acme"} Support`,
          logo_url: logoUrl,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save changes");
      }
      toast.success("Widget settings saved successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save widget settings.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Topbar title="Widget" subtitle="Customize your embeddable support widget" />
      <div className="p-6 lg:p-8 grid gap-6 lg:grid-cols-[420px_1fr]">
        {/* Settings */}
        <div className="rounded-2xl border border-border bg-card shadow-card p-6 space-y-6">
          <div>
            <Label>Widget color</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {swatches.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`h-9 w-9 rounded-lg border-2 transition-all ${
                    color === c ? "border-foreground scale-110" : "border-transparent"
                  }`}
                  style={{ background: c }}
                  aria-label={c}
                />
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="title">Widget Title</Label>
            <Input
              id="title"
              placeholder="Widget Title (defaults to brand name)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-lg"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="greeting">Greeting message</Label>
            <Textarea
              id="greeting"
              value={greeting}
              onChange={(e) => setGreeting(e.target.value)}
              className="rounded-lg min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Position</Label>
              <Select value={position} onValueChange={setPosition}>
                <SelectTrigger className="rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="br">Bottom right</SelectItem>
                  <SelectItem value="bl">Bottom left</SelectItem>
                  <SelectItem value="tr">Top right</SelectItem>
                  <SelectItem value="tl">Top left</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Theme</Label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger className="rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="auto">Auto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="logo">Brand logo URL</Label>
            <Input
              id="logo"
              placeholder="https://…"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              className="rounded-lg"
            />
          </div>

          <div className="pt-2">
            <Label>Embed code</Label>
            <div className="mt-2 rounded-xl bg-muted border border-border p-3 font-mono text-[11px] leading-relaxed relative">
              <Button
                size="icon"
                variant="ghost"
                onClick={copyToClipboard}
                className="absolute top-1.5 right-1.5 h-7 w-7 cursor-pointer"
                title="Copy embed code"
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <pre className="whitespace-pre-wrap pr-8">{embedCode}</pre>
            </div>
          </div>

          <Button 
            onClick={handleSaveChanges} 
            disabled={isSaving} 
            className="w-full rounded-lg bg-primary"
          >
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
        </div>

        {/* Preview */}
        <div className="rounded-2xl border border-border bg-muted/30 bg-grid p-6 lg:p-10 flex items-end justify-end min-h-[560px] relative">
          <Badge className="absolute top-4 left-4 rounded-full" variant="secondary">
            Live preview
          </Badge>

          <div className="w-full max-w-sm rounded-2xl bg-card border border-border shadow-elegant overflow-hidden">
            <div
              className="p-4 flex items-center gap-3"
              style={{ background: color, color: "white" }}
            >
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/20 overflow-hidden">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" />
                ) : (
                  <MessageCircle className="h-4 w-4" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm truncate">{companyName} Support</div>
                <div className="text-[11px] opacity-90 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" /> AI online · replies
                  instantly
                </div>
              </div>
              <button className="opacity-80 hover:opacity-100 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 space-y-3 min-h-[240px] bg-background">
              <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-muted px-3 py-2 text-sm">
                {greeting}
              </div>
              <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-muted px-3 py-2 text-sm">
                You can ask about orders, refunds, products, or anything else.
              </div>
            </div>
            <div className="p-3 border-t border-border flex items-center gap-2">
              <Input
                placeholder="Type your message…"
                className="border-0 shadow-none focus-visible:ring-0 h-9"
              />
              <Button size="icon" className="h-9 w-9 rounded-lg" style={{ background: color }}>
                <Send className="h-4 w-4 text-white" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

