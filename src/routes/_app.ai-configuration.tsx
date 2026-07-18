import { createFileRoute } from "@tanstack/react-router";
import { Topbar } from "@/components/topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  getAIConfiguration,
  createAIConfiguration,
  upsertAIConfiguration,
} from "@/lib/ai-configuration";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Save,
  Cpu,
  Sparkles,
  SlidersHorizontal,
  AlertTriangle,
  Bot,
} from "lucide-react";

export const Route = createFileRoute("/_app/ai-configuration")({
  component: AIConfiguration,
  head: () => ({ meta: [{ title: "AI Configuration — SupportAI" }] }),
});

const languagesList = [
  "English",
  "Spanish",
  "French",
  "German",
  "Italian",
  "Portuguese",
  "Dutch",
  "Russian",
  "Chinese",
  "Japanese",
  "Korean",
  "Arabic",
];

function AIConfiguration() {
  const { company } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Configuration States
  const [model, setModel] = useState<string>("gpt-5");
  const [responseStyle, setResponseStyle] = useState<string>("Professional");
  const [responseLength, setResponseLength] = useState<string>("Medium");
  const [temperature, setTemperature] = useState<number>(0.2);
  const [maxTokens, setMaxTokens] = useState<number>(1500);
  const [language, setLanguage] = useState<string>("English");
  const [fallbackResponse, setFallbackResponse] = useState<string>("");
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0.75);
  const [enableStreaming, setEnableStreaming] = useState<boolean>(true);

  const loadConfiguration = async () => {
    if (!company?.id) return;
    setIsLoading(true);
    try {
      let configData = await getAIConfiguration(company.id);
      if (!configData) {
        // Automatically create default AI configuration
        configData = await createAIConfiguration(company.id);
      }

      // Populate every UI field
      setModel(configData.model || "gpt-5");
      setResponseStyle(configData.response_style || "Professional");
      setResponseLength(configData.response_length || "Medium");
      setTemperature(Number(configData.temperature ?? 0.2));
      setMaxTokens(Number(configData.max_tokens ?? 1500));
      setLanguage(configData.language || "English");
      setFallbackResponse(configData.fallback_response || "");
      setConfidenceThreshold(Number(configData.confidence_threshold ?? 0.75));
      setEnableStreaming(configData.enable_streaming ?? true);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load AI configuration.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (company?.id) {
      loadConfiguration();
    }
  }, [company?.id]);

  const handleSave = async () => {
    if (!company?.id) {
      toast.error("No company profile found.");
      return;
    }

    // Input Validation
    if (isNaN(maxTokens) || maxTokens <= 0) {
      toast.error("Maximum tokens must be a positive integer.");
      return;
    }
    if (maxTokens > 32000) {
      toast.error("Maximum tokens cannot exceed 32,000.");
      return;
    }
    if (temperature < 0.0 || temperature > 1.0) {
      toast.error("Temperature must be between 0.0 and 1.0.");
      return;
    }
    if (confidenceThreshold < 0.0 || confidenceThreshold > 1.0) {
      toast.error("Confidence threshold must be between 0.0 and 1.0.");
      return;
    }

    setIsSaving(true);
    try {
      await upsertAIConfiguration(company.id, {
        model,
        response_style: responseStyle,
        response_length: responseLength,
        temperature,
        max_tokens: Math.floor(maxTokens),
        language,
        fallback_response: fallbackResponse.trim() || null,
        confidence_threshold: confidenceThreshold,
        enable_streaming: enableStreaming,
      });

      toast.success("AI Configuration saved successfully.");
      await loadConfiguration();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save AI configuration.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <Topbar
          title="AI Configuration"
          subtitle="Configure default model parameters and response tone"
          actions={
            <Button size="sm" className="rounded-lg" disabled>
              <Save className="h-4 w-4 mr-1.5 animate-spin" /> Loading
            </Button>
          }
        />
        <div className="p-6 lg:p-8 space-y-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl border border-border bg-card p-6 shadow-card h-48 animate-pulse bg-muted/20" />
              ))}
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card h-96 animate-pulse bg-muted/20" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar
        title="AI Configuration"
        subtitle="Configure default model parameters and response tone"
        actions={
          <Button
            size="sm"
            className="rounded-lg cursor-pointer bg-primary text-primary-foreground hover:bg-primary/95"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save className={cn("h-4 w-4 mr-1.5", isSaving && "animate-spin")} />
            {isSaving ? "Saving..." : "Save"}
          </Button>
        }
      />
      <div className="p-6 lg:p-8 grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Settings Form */}
        <div className="space-y-6">
          {/* AI Model */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="flex items-center gap-3 mb-5">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary">
                <Cpu className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold text-sm">AI Model Selection</h2>
                <p className="text-xs text-muted-foreground">
                  Select the base LLM engine to power customer responses.
                </p>
              </div>
            </div>
            <RadioGroup
              value={model}
              onValueChange={setModel}
              className="grid gap-4 sm:grid-cols-2"
            >
              {[
                {
                  id: "gpt-5",
                  name: "GPT-5",
                  desc: "Next-gen flagship model. Unmatched reasoning and logic.",
                  badge: "Advanced",
                },
                {
                  id: "gpt-4.1",
                  name: "GPT-4.1",
                  desc: "Highly stable and versatile intelligence. Industry standard.",
                },
                {
                  id: "claude",
                  name: "Claude",
                  desc: "Nuanced, creative flow and empathetic conversational tone.",
                },
                {
                  id: "gemini",
                  name: "Gemini",
                  desc: "Lightning fast processing times with multimodal capacity.",
                },
              ].map((m) => (
                <Label
                  key={m.id}
                  htmlFor={m.id}
                  className={cn(
                    "flex flex-col justify-between p-4 rounded-xl border border-border bg-card hover:bg-muted/40 cursor-pointer transition-all relative overflow-hidden",
                    model === m.id && "border-primary ring-2 ring-primary/10 bg-primary/5"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm flex items-center gap-2">
                      <RadioGroupItem value={m.id} id={m.id} className="cursor-pointer" />
                      {m.name}
                    </span>
                    {m.badge && (
                      <span className="text-[10px] font-semibold bg-primary-soft text-primary px-2 py-0.5 rounded-full">
                        {m.badge}
                      </span>
                    )}
                  </div>
                  <span className="mt-2 text-xs text-muted-foreground font-normal leading-relaxed">
                    {m.desc}
                  </span>
                </Label>
              ))}
            </RadioGroup>
          </div>

          {/* Tone & Style */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="flex items-center gap-3 mb-5">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold text-sm">Response Style & Length</h2>
                <p className="text-xs text-muted-foreground">
                  Control the personality type and word limits of AI replies.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <Label className="text-xs font-semibold text-muted-foreground">
                  RESPONSE STYLE
                </Label>
                <RadioGroup
                  value={responseStyle}
                  onValueChange={setResponseStyle}
                  className="grid gap-3 sm:grid-cols-3 mt-2"
                >
                  {[
                    { id: "Professional", label: "Professional", desc: "Corporate and clear" },
                    { id: "Friendly", label: "Friendly", desc: "Warm and inviting" },
                    { id: "Formal", label: "Formal", desc: "Polite and structured" },
                  ].map((s) => (
                    <Label
                      key={s.id}
                      htmlFor={`style-${s.id}`}
                      className={cn(
                        "flex flex-col items-center justify-center p-3 text-center rounded-xl border border-border bg-card hover:bg-muted/40 cursor-pointer transition-all",
                        responseStyle === s.id && "border-primary bg-primary/5 ring-1 ring-primary"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value={s.id} id={`style-${s.id}`} className="cursor-pointer" />
                        <span className="font-medium text-xs">{s.label}</span>
                      </div>
                      <span className="mt-1 text-[10px] text-muted-foreground font-normal">
                        {s.desc}
                      </span>
                    </Label>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <Label className="text-xs font-semibold text-muted-foreground">
                  RESPONSE LENGTH
                </Label>
                <RadioGroup
                  value={responseLength}
                  onValueChange={setResponseLength}
                  className="grid gap-3 sm:grid-cols-3 mt-2"
                >
                  {[
                    { id: "Short", label: "Short", desc: "~1-2 sentences" },
                    { id: "Medium", label: "Medium", desc: "~2-4 sentences" },
                    { id: "Detailed", label: "Detailed", desc: "Comprehensive help" },
                  ].map((l) => (
                    <Label
                      key={l.id}
                      htmlFor={`len-${l.id}`}
                      className={cn(
                        "flex flex-col items-center justify-center p-3 text-center rounded-xl border border-border bg-card hover:bg-muted/40 cursor-pointer transition-all",
                        responseLength === l.id && "border-primary bg-primary/5 ring-1 ring-primary"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value={l.id} id={`len-${l.id}`} className="cursor-pointer" />
                        <span className="font-medium text-xs">{l.label}</span>
                      </div>
                      <span className="mt-1 text-[10px] text-muted-foreground font-normal">
                        {l.desc}
                      </span>
                    </Label>
                  ))}
                </RadioGroup>
              </div>
            </div>
          </div>

          {/* Parameters & Thresholds */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="flex items-center gap-3 mb-5">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary">
                <SlidersHorizontal className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold text-sm">Model Hyperparameters</h2>
                <p className="text-xs text-muted-foreground">
                  Fine-tune predictability, context length, and fallback actions.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Temperature Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="temperature">Temperature</Label>
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">
                      {temperature.toFixed(2)}
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground font-medium">
                    {temperature <= 0.3 ? "Precise & Deterministic" : temperature >= 0.7 ? "Creative & Varied" : "Balanced"}
                  </span>
                </div>
                <Slider
                  id="temperature"
                  min={0.0}
                  max={1.0}
                  step={0.05}
                  value={[temperature]}
                  onValueChange={(val) => setTemperature(val[0])}
                  className="py-2"
                />
                <p className="text-[10px] text-muted-foreground">
                  Lower values make responses more factual. Higher values allow more creative freedom.
                </p>
              </div>

              {/* Confidence Threshold Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="confidence">Confidence Threshold</Label>
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">
                      {Math.round(confidenceThreshold * 100)}%
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground font-medium">
                    {confidenceThreshold >= 0.85 ? "Strict Matching" : confidenceThreshold <= 0.5 ? "Lenient Matching" : "Recommended"}
                  </span>
                </div>
                <Slider
                  id="confidence"
                  min={0.0}
                  max={1.0}
                  step={0.05}
                  value={[confidenceThreshold]}
                  onValueChange={(val) => setConfidenceThreshold(val[0])}
                  className="py-2"
                />
                <p className="text-[10px] text-muted-foreground">
                  Minimum confidence required from the Knowledge Base before the AI attempts an answer.
                </p>
              </div>

              {/* Max Tokens & Language */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="max-tokens">Maximum Response Tokens</Label>
                  <Input
                    id="max-tokens"
                    type="number"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(Number(e.target.value))}
                    min={1}
                    max={32000}
                    className="rounded-lg font-mono text-sm"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Upper token limit per response (1 token ≈ 0.75 words).
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="language">Target Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger id="language" className="rounded-lg">
                      <SelectValue placeholder="Select Language" />
                    </SelectTrigger>
                    <SelectContent>
                      {languagesList.map((lang) => (
                        <SelectItem key={lang} value={lang}>
                          {lang}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground">
                    Default translation or response language for system prompts.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Behavior Controls */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="flex items-center gap-3 mb-5">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold text-sm">System Fallbacks & Live Delivery</h2>
                <p className="text-xs text-muted-foreground">
                  Define what happens when confidence is low, and enable direct streaming.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Fallback Response */}
              <div className="space-y-1.5">
                <Label htmlFor="fallback">Fallback Response</Label>
                <Textarea
                  id="fallback"
                  placeholder="I'm sorry, I couldn't find a reliable answer to that question in our knowledge base. Let me transfer you to a member of our team."
                  value={fallbackResponse}
                  onChange={(e) => setFallbackResponse(e.target.value)}
                  className="rounded-lg min-h-[100px] text-sm leading-relaxed"
                />
                <p className="text-[10px] text-muted-foreground">
                  Returned automatically when confidence falls below the threshold.
                </p>
              </div>

              {/* Streaming Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20">
                <div className="space-y-0.5 pr-4">
                  <Label htmlFor="streaming" className="text-sm font-medium cursor-pointer">
                    Enable Token Streaming
                  </Label>
                  <p className="text-xs text-muted-foreground leading-normal">
                    Deliver responses token-by-token in real-time. Creates a faster perceived speed.
                  </p>
                </div>
                <Switch
                  id="streaming"
                  checked={enableStreaming}
                  onCheckedChange={setEnableStreaming}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Live Preview Panel */}
        <div className="space-y-6">
          <div className="sticky top-20 space-y-6">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-card space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                  Behavior Preview
                </span>
                <span className="text-[10px] font-mono bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                  Live Sim
                </span>
              </div>

              {/* Preview Stats */}
              <div className="grid grid-cols-2 gap-2 text-center text-[11px] border-b border-border pb-3">
                <div className="bg-muted/40 p-2 rounded-lg">
                  <div className="text-muted-foreground">Creativity</div>
                  <div className="font-semibold mt-0.5 text-foreground font-mono">
                    {temperature < 0.25 ? "Minimal" : temperature > 0.75 ? "High" : "Medium"}
                  </div>
                </div>
                <div className="bg-muted/40 p-2 rounded-lg">
                  <div className="text-muted-foreground">LLM Engine</div>
                  <div className="font-semibold mt-0.5 text-foreground font-mono uppercase">
                    {model}
                  </div>
                </div>
              </div>

              {/* Chat Simulation */}
              <div className="space-y-3 pt-1">
                <div className="space-y-1">
                  <div className="text-[10px] font-medium text-muted-foreground">CUSTOMER QUESTION</div>
                  <div className="rounded-lg bg-muted p-2 text-xs leading-relaxed text-foreground">
                    "Do you offer international shipping, and how long does it take?"
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] font-medium text-muted-foreground flex justify-between">
                    <span>AI RESPONSE PREVIEW</span>
                    <span className="font-mono text-primary">{responseStyle} · {responseLength}</span>
                  </div>
                  <div className="rounded-lg bg-primary-soft/50 border border-primary/10 p-3 text-xs leading-relaxed text-foreground space-y-2">
                    {responseLength === "Short" ? (
                      <p>
                        {responseStyle === "Friendly"
                          ? "Yes, we do! We ship worldwide, and international orders generally arrive within 7-14 business days. 😊"
                          : responseStyle === "Formal"
                            ? "Please be advised that we offer international shipping. Standard transit time ranges from 7 to 14 business days."
                            : "Yes, we ship globally. International deliveries typically take 7-14 business days."}
                      </p>
                    ) : responseLength === "Medium" ? (
                      <p>
                        {responseStyle === "Friendly"
                          ? "Yes, we absolutely ship worldwide! 🌍 Most international orders take about 7-14 business days to arrive depending on your location. You'll receive a tracking link as soon as it leaves our warehouse!"
                          : responseStyle === "Formal"
                            ? "We confirm that international shipping services are available. Standard shipments are processed promptly and delivered within 7 to 14 business days. A tracking number will be provided upon dispatch."
                            : "Yes, we offer worldwide shipping. International delivery times average between 7-14 business days. Once your order ships, we will email you a tracking number to monitor progress."}
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        <p>
                          {responseStyle === "Friendly"
                            ? "Good news! We ship to almost every country around the globe! ✈️ Here are the key details you'll want to know:"
                            : responseStyle === "Formal"
                              ? "Please be informed that our shipping network supports international destinations. The shipping details are as follows:"
                              : "Yes, we support international shipping. Please refer to the dispatch terms below:"}
                        </p>
                        <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-muted-foreground">
                          <li>Delivery timeline: 7 to 14 business days.</li>
                          <li>Carrier tracking is sent automatically post-shipment.</li>
                          <li>Customs fees or import duties may apply locally.</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1 border-t border-border pt-3">
                  <div className="text-[10px] font-medium text-muted-foreground flex justify-between">
                    <span>UNRELIABLE KNOWLEDGE MATCH (&lt;{Math.round(confidenceThreshold * 100)}%)</span>
                    <span className="font-mono text-destructive">Fallback Triggered</span>
                  </div>
                  <div className="rounded-lg bg-destructive-soft/10 border border-destructive/10 p-2 text-xs leading-relaxed text-muted-foreground italic">
                    "{fallbackResponse || "I'm sorry, I couldn't find a reliable answer to that question in our knowledge base. Let me transfer you to a member of our team."}"
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
