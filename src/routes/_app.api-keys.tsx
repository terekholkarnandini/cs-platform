import { createFileRoute } from "@tanstack/react-router";
import { Topbar } from "@/components/topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Copy, RefreshCw, Eye, EyeOff, ExternalLink, Trash, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const BASE_URL = "http://localhost:8000";

export const Route = createFileRoute("/_app/api-keys")({
  component: ApiKeys,
  head: () => ({ meta: [{ title: "API Keys — SupportAI" }] }),
});

function ApiKeys() {
  const { session } = useAuth();
  const [keysList, setKeysList] = useState<any[]>([]);
  const [isLoadingKeys, setIsLoadingKeys] = useState(true);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isSavingWebhook, setIsSavingWebhook] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Dialog naming state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [pendingKeyName, setPendingKeyName] = useState("");

  // Plaintext reveal state for session created keys
  const [plainKeysMemory, setPlainKeysMemory] = useState<Record<string, string>>({});
  const [reveal, setReveal] = useState<Record<string, boolean>>({});

  // Secure modal configuration
  const [newKeyPlaintext, setNewKeyPlaintext] = useState<string | null>(null);

  // Confirmations dialog state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmRegenId, setConfirmRegenId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const loadKeys = async () => {
    const token = session?.access_token;
    if (!token) return;
    try {
      const res = await fetch(`${BASE_URL}/api/keys`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to load API keys.");
      const data = await res.json();
      setKeysList(data);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load API keys.");
    } finally {
      setIsLoadingKeys(false);
    }
  };

  const loadWebhook = async () => {
    const token = session?.access_token;
    if (!token) return;
    try {
      const res = await fetch(`${BASE_URL}/api/company/settings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.webhook_url) {
          setWebhookUrl(data.webhook_url);
        }
      }
    } catch (err) {
      console.error("Failed to load webhook URL:", err);
    }
  };

  useEffect(() => {
    if (session?.access_token) {
      loadKeys();
      loadWebhook();
    }
  }, [session?.access_token]);

  const handleGenerateClick = () => {
    setPendingKeyName("");
    setIsCreateDialogOpen(true);
  };

  const handleCreateKey = async () => {
    const token = session?.access_token;
    if (!token) {
      toast.error("You must be logged in.");
      return;
    }
    if (!pendingKeyName.trim()) {
      toast.error("Please enter a key name.");
      return;
    }
    setIsGenerating(true);
    try {
      const res = await fetch(`${BASE_URL}/api/keys`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: pendingKeyName }),
      });
      if (!res.ok) throw new Error("Failed to generate API key.");
      const data = await res.json();
      
      // Store the plaintext key temporarily in memory
      setPlainKeysMemory((prev) => ({ ...prev, [data.id]: data.plaintext_key }));
      setNewKeyPlaintext(data.plaintext_key);
      
      setIsCreateDialogOpen(false);
      await loadKeys();
      toast.success("API key generated successfully.");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate API key.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateKeyClick = (id: string) => {
    setConfirmRegenId(id);
  };

  const handleRegenerateKey = async () => {
    const token = session?.access_token;
    if (!confirmRegenId || !token) return;
    setIsRegenerating(true);
    try {
      const res = await fetch(`${BASE_URL}/api/keys/${confirmRegenId}/regenerate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to regenerate API key.");
      const data = await res.json();
      
      // Store the new plaintext key temporarily in memory
      setPlainKeysMemory((prev) => ({ ...prev, [data.id]: data.plaintext_key }));
      setNewKeyPlaintext(data.plaintext_key);
      
      setConfirmRegenId(null);
      await loadKeys();
      toast.success("API key regenerated successfully.");
    } catch (err: any) {
      toast.error(err.message || "Failed to regenerate API key.");
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleDeleteKeyClick = (id: string) => {
    setConfirmDeleteId(id);
  };

  const handleDeleteKey = async () => {
    const token = session?.access_token;
    if (!confirmDeleteId || !token) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`${BASE_URL}/api/keys/${confirmDeleteId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to delete API key.");
      
      setConfirmDeleteId(null);
      await loadKeys();
      toast.success("API key deleted successfully.");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete API key.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveWebhook = async () => {
    const token = session?.access_token;
    if (!token) {
      toast.error("You must be logged in.");
      return;
    }
    setIsSavingWebhook(true);
    try {
      const res = await fetch(`${BASE_URL}/api/company/webhook`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ webhookUrl }),
      });
      if (!res.ok) throw new Error("Failed to save webhook URL.");
      toast.success("Webhook URL saved successfully.");
    } catch (err: any) {
      toast.error(err.message || "Failed to save webhook URL.");
    } finally {
      setIsSavingWebhook(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch (e) {
      return dateStr;
    }
  };

  const formatUsed = (dateStr: string | null) => {
    if (!dateStr) return "never";
    try {
      const diffMs = new Date().getTime() - new Date(dateStr).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins} min ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch (e) {
      return "never";
    }
  };

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
            <Button size="sm" className="rounded-lg cursor-pointer" onClick={handleGenerateClick}>
              Generate new key
            </Button>
          </div>
          <ul className="divide-y divide-border">
            {isLoadingKeys ? (
              <li className="p-5 text-center text-xs text-muted-foreground">
                Loading API keys...
              </li>
            ) : keysList.length === 0 ? (
              <li className="p-5 text-center text-xs text-muted-foreground">
                No API keys generated yet.
              </li>
            ) : (
              keysList.map((k) => {
                const isNewKey = !!plainKeysMemory[k.id];
                const keyPlaintext = plainKeysMemory[k.id];
                const displayValue = isNewKey && reveal[k.id] ? keyPlaintext : `${k.key_prefix}••••••••`;
                
                return (
                  <li key={k.id} className="p-5 flex flex-wrap items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium">{k.name}</div>
                        {k.status === "revoked" && (
                          <Badge variant="destructive" className="rounded-full text-[10px] py-0.5">
                            Revoked
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Created {formatDate(k.created_at)} · used {formatUsed(k.last_used_at)}
                      </div>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      <code className="text-xs font-mono px-3 py-1.5 rounded-lg bg-muted border border-border">
                        {displayValue}
                      </code>
                      {isNewKey && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 cursor-pointer"
                          onClick={() => setReveal((r) => ({ ...r, [k.id]: !r[k.id] }))}
                        >
                          {reveal[k.id] ? (
                            <EyeOff className="h-3.5 w-3.5" />
                          ) : (
                            <Eye className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 cursor-pointer"
                        onClick={() => {
                          const copyText = isNewKey ? keyPlaintext : k.key_prefix;
                          navigator.clipboard.writeText(copyText);
                          toast.success(isNewKey ? "Plaintext key copied!" : `Copied key identifier (${k.key_prefix})!`);
                        }}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive-soft cursor-pointer"
                        onClick={() => handleDeleteKeyClick(k.id)}
                      >
                        <Trash className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-lg cursor-pointer"
                        disabled={k.status === "revoked"}
                        onClick={() => handleRegenerateKeyClick(k.id)}
                      >
                        <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Regenerate
                      </Button>
                    </div>
                  </li>
                );
              })
            )}
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
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="h-10 rounded-lg font-mono text-sm"
                placeholder="https://api.yourdomain.com/webhooks"
              />
            </div>
            <div className="flex items-end">
              <Button
                className="rounded-lg h-10 cursor-pointer"
                onClick={handleSaveWebhook}
                disabled={isSavingWebhook}
              >
                {isSavingWebhook ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-1.5" /> Save webhook
                  </>
                )}
              </Button>
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
            <Button variant="outline" className="rounded-lg cursor-pointer" size="sm">
              Open docs <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Name Input Dialog for Key Creation */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Generate New API Key</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Give your new API key a descriptive name to identify it later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="keyName">Key Name</Label>
              <Input
                id="keyName"
                value={pendingKeyName}
                onChange={(e) => setPendingKeyName(e.target.value)}
                placeholder="e.g. Production client"
                className="rounded-lg"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="rounded-lg cursor-pointer">
              Cancel
            </Button>
            <Button onClick={handleCreateKey} disabled={isGenerating} className="rounded-lg cursor-pointer">
              {isGenerating ? "Generating..." : "Generate key"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Secret Key Display Modal */}
      <Dialog open={!!newKeyPlaintext} onOpenChange={(open) => !open && setNewKeyPlaintext(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Secret key generated</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Please copy this key and save it somewhere secure. For security reasons, you cannot retrieve it again later.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 py-4">
            <code className="flex-1 text-xs font-mono px-3 py-2 rounded-lg bg-muted border border-border select-all select-text break-all">
              {newKeyPlaintext}
            </code>
            <Button
              size="icon"
              variant="outline"
              className="cursor-pointer"
              onClick={() => {
                if (newKeyPlaintext) {
                  navigator.clipboard.writeText(newKeyPlaintext);
                  toast.success("API key copied to clipboard!");
                }
              }}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setNewKeyPlaintext(null)} className="rounded-lg cursor-pointer">
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Key Dialog */}
      <Dialog open={confirmDeleteId !== null} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Delete API Key</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Are you sure you want to delete this API Key? This action is permanent and cannot be undone. Web services using this key will immediately stop working.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)} className="rounded-lg cursor-pointer">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteKey} disabled={isDeleting} className="rounded-lg cursor-pointer">
              {isDeleting ? "Deleting..." : "Delete Key"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Regenerate Key Dialog */}
      <Dialog open={confirmRegenId !== null} onOpenChange={(open) => !open && setConfirmRegenId(null)}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Regenerate API Key</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Are you sure you want to regenerate this API Key? The existing key will be immediately revoked, and you will be shown a new secret key.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setConfirmRegenId(null)} className="rounded-lg cursor-pointer">
              Cancel
            </Button>
            <Button onClick={handleRegenerateKey} disabled={isRegenerating} className="rounded-lg cursor-pointer">
              {isRegenerating ? "Regenerating..." : "Regenerate Key"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
