import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Topbar } from "@/components/topbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect, useRef } from "react";
import { getDocuments, KnowledgeDocument } from "@/services/knowledgeApi";
import { getBusinessRules, BusinessRuleRow } from "@/lib/business-rules";
import { getAIConfiguration, AIConfigurationRow } from "@/lib/ai-configuration";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Send,
  Sparkles,
  Database,
  Sliders,
  Scale,
  Activity,
  Cpu,
  RefreshCw,
  Copy,
  Check,
  AlertCircle,
  Clock,
  BookOpen,
  MessageSquare,
} from "lucide-react";

export const Route = createFileRoute("/_app/ai-playground")({
  component: AIPlayground,
  head: () => ({ meta: [{ title: "AI Playground — SupportAI" }] }),
});

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: any[];
  metrics?: any;
  tokens?: any;
  confidence?: string;
  responseTime?: string;
  error?: boolean;
}

function AIPlayground() {
  const { user, company, session, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Chat states
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I am your AI Support Assistant. Ask me any question related to your uploaded knowledge base documents to test my responses and debug the matching context.",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isResponding, setIsResponding] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  // Debug Panel / Supabase Data states
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [businessRules, setBusinessRules] = useState<BusinessRuleRow | null>(null);
  const [aiConfig, setAiConfig] = useState<AIConfigurationRow | null>(null);
  const [isLoadingDebug, setIsLoadingDebug] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isResponding]);

  // Authorization check
  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/login" });
    }
  }, [user, authLoading, navigate]);

  // Load backend and Supabase data
  const loadDebugData = async () => {
    if (!company?.id) return;
    setIsLoadingDebug(true);
    try {
      const [docsData, rulesData, configData] = await Promise.all([
        getDocuments(company.id).catch((err) => {
          console.error("Error loading documents:", err);
          return [] as KnowledgeDocument[];
        }),
        getBusinessRules(company.id).catch((err) => {
          console.error("Error loading rules:", err);
          return null;
        }),
        getAIConfiguration(company.id).catch((err) => {
          console.error("Error loading AI configuration:", err);
          return null;
        }),
      ]);

      setDocuments(docsData);
      setBusinessRules(rulesData);
      setAiConfig(configData);
    } catch (err: any) {
      console.error("Error fetching playground details:", err);
      toast.error("Failed to load company playground config.");
    } finally {
      setIsLoadingDebug(false);
    }
  };

  useEffect(() => {
    if (company?.id) {
      loadDebugData();
    }
  }, [company?.id]);

  // Calculate total chunks from docs
  const totalChunks = documents.reduce((sum, doc) => sum + (doc.chunks || 0), 0);
  const indexingStatus = documents.some((d) => d.status !== "Indexed") ? "Indexing" : "Ready";

  // Handle typing height auto-adjust
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  };

  // Keyboard shortcut
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Send message API Call
  const handleSend = async () => {
    if (!inputValue.trim() || isResponding || !company?.id) return;

    const userMessage = inputValue.trim();
    setInputValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    // Add user message to state
    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: userMessage },
    ];
    setMessages(newMessages);
    setIsResponding(true);

    try {
      const token = session?.access_token;
      if (!token) {
        throw new Error("You are not authenticated. Please log in again.");
      }

      // API Call
      const res = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          companyId: company.id,
          message: userMessage,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: "API call failed" }));
        throw new Error(errorData.detail || `Server responded with ${res.status}`);
      }

      const responseData = await res.json();
      
      const assistantMessage: Message = {
        role: "assistant",
        content: responseData.answer,
        sources: responseData.sources || [],
        metrics: responseData.metrics || {
          retrievalTime: "N/A",
          llmTime: "N/A",
          totalTime: responseData.responseTime || "N/A",
        },
        tokens: responseData.tokens || { prompt: 0, completion: 0, total: 0 },
        confidence: responseData.confidence || "0.0%",
        responseTime: responseData.responseTime || "N/A",
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setSelectedMessage(assistantMessage);
    } catch (err: any) {
      console.error(err);
      const isKBError = err.message.toLowerCase().includes("knowledge") || err.message.toLowerCase().includes("chromadb");
      const isLLMError = err.message.toLowerCase().includes("gemini") || err.message.toLowerCase().includes("llm");
      
      let errMsg = "AI assistant is temporarily unavailable. Please verify connection configurations.";
      if (isKBError) errMsg = "Knowledge Base is currently unavailable. Please verify ChromaDB configuration.";
      if (isLLMError) errMsg = "Generative model failed to respond. Please review Gemini API key limits.";

      const assistantErrorMessage: Message = {
        role: "assistant",
        content: errMsg,
        error: true,
      };
      setMessages((prev) => [...prev, assistantErrorMessage]);
      toast.error(err.message || "Failed to generate answer.");
    } finally {
      setIsResponding(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Response copied to clipboard!");
  };

  // Score color helper
  const getScoreColorClass = (scoreStr?: string) => {
    if (!scoreStr) return "bg-destructive/10 text-destructive border-destructive/20";
    const score = parseFloat(scoreStr.replace("%", ""));
    if (score >= 90) return "bg-success-soft text-success border-success/20";
    if (score >= 75) return "bg-warning-soft text-warning border-warning/20";
    return "bg-destructive-soft text-destructive border-destructive/20";
  };

  const getSourceScoreColorClass = (score: number) => {
    const percent = score * 100;
    if (percent >= 90) return "text-success bg-success-soft border-success/20";
    if (percent >= 75) return "text-warning bg-warning-soft border-warning/20";
    return "text-destructive bg-destructive-soft border-destructive/20";
  };

  // Custom Markdown parsing helper
  const renderMarkdown = (content: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);
    return parts.map((part, index) => {
      if (part.startsWith("```")) {
        const code = part.replace(/```/g, "").trim();
        return (
          <pre key={index} className="bg-muted/80 p-3 rounded-lg overflow-x-auto text-xs font-mono my-2 border border-border leading-relaxed text-foreground">
            <code>{code}</code>
          </pre>
        );
      }

      const lines = part.split("\n");
      return lines.map((line, lIdx) => {
        if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
          return (
            <li key={`${index}-${lIdx}`} className="ml-4 list-disc text-sm my-1 text-foreground/90">
              {formatBold(line.trim().substring(2))}
            </li>
          );
        }
        if (line.trim().startsWith("1. ") || /^\d+\.\s/.test(line.trim())) {
          const text = line.trim().replace(/^\d+\.\s/, "");
          return (
            <li key={`${index}-${lIdx}`} className="ml-4 list-decimal text-sm my-1 text-foreground/90">
              {formatBold(text)}
            </li>
          );
        }
        if (!line.trim()) return <div key={`${index}-${lIdx}`} className="h-2" />;
        return (
          <p key={`${index}-${lIdx}`} className="text-sm my-1.5 leading-relaxed text-foreground/90">
            {formatBold(line)}
          </p>
        );
      });
    });
  };

  const formatBold = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={idx} className="font-semibold text-foreground">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <>
      <Topbar
        title="AI Playground"
        subtitle="Internal sandbox to test and debug your customer support agent"
        actions={
          <Button
            size="sm"
            variant="outline"
            className="rounded-lg gap-1.5 border-border bg-card hover:bg-muted"
            onClick={loadDebugData}
            disabled={isLoadingDebug}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isLoadingDebug && "animate-spin")} />
            Sync Config
          </Button>
        }
      />
      <div className="p-6 lg:p-8 grid gap-6 lg:grid-cols-[1fr_400px] h-[calc(100vh-64px)] overflow-hidden">
        {/* Main Conversation Area */}
        <div className="flex flex-col h-full bg-card border border-border rounded-2xl shadow-card overflow-hidden">
          {/* Chat Headers */}
          <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-card">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary-soft text-primary grid place-items-center">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-semibold">Test Session</div>
                <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Active Model: {aiConfig?.model || "GPT-5"}
                </div>
              </div>
            </div>
          </div>

          {/* Conversation History */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0 bg-muted/10">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={cn(
                  "flex gap-4 max-w-[85%] rounded-2xl p-4 transition-all border",
                  msg.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground border-primary/20 rounded-tr-sm"
                    : msg.error
                    ? "bg-destructive-soft/10 text-destructive border-destructive/20 rounded-tl-sm"
                    : "bg-card text-foreground border-border rounded-tl-sm shadow-sm"
                )}
              >
                {msg.role === "assistant" && (
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary font-semibold text-xs border border-primary/10">
                    AI
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="space-y-1">
                    {msg.role === "assistant" && !msg.error ? (
                      renderMarkdown(msg.content)
                    ) : (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>

                  {/* Assistant response action bar */}
                  {msg.role === "assistant" && !msg.error && (
                    <div className="mt-3 flex items-center gap-3 pt-2.5 border-t border-border/60">
                      <button
                        onClick={() => copyToClipboard(msg.content)}
                        className="text-[11px] font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Copy className="h-3 w-3" /> Copy response
                      </button>
                      {msg.sources && msg.sources.length > 0 && (
                        <button
                          onClick={() => setSelectedMessage(msg)}
                          className={cn(
                            "text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors",
                            selectedMessage === msg ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <Database className="h-3 w-3" /> View chunks ({msg.sources.length})
                        </button>
                      )}
                      {msg.responseTime && (
                        <span className="text-[10px] text-muted-foreground font-mono ml-auto">
                          Latency: {msg.responseTime}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isResponding && (
              <div className="flex gap-4 max-w-[85%] rounded-2xl p-4 bg-card border border-border rounded-tl-sm shadow-sm">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary border border-primary/10 animate-pulse">
                  AI
                </div>
                <div className="flex items-center gap-1.5 py-2">
                  <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 rounded-full bg-primary animate-bounce" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Multiline Message Input */}
          <div className="p-4 border-t border-border bg-card">
            <div className="relative rounded-xl border border-border bg-muted/30 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all flex items-end p-1.5">
              <Textarea
                ref={textareaRef}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Type your message to test AI agent..."
                rows={1}
                className="w-full border-0 focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[40px] max-h-[160px] resize-none py-2 px-3 text-sm bg-transparent placeholder:text-muted-foreground/70"
                disabled={isResponding}
              />
              <Button
                size="icon"
                className="rounded-lg h-9 w-9 shrink-0 mb-0.5 mr-0.5 bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer"
                disabled={isResponding || !inputValue.trim()}
                onClick={handleSend}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-2 text-center text-[10px] text-muted-foreground">
              Press <kbd className="bg-muted px-1 rounded border border-border">Enter</kbd> to send, <kbd className="bg-muted px-1 rounded border border-border">Shift + Enter</kbd> for a new line.
            </div>
          </div>
        </div>

        {/* Debug Panel on the Right */}
        <div className="flex flex-col h-full bg-card border border-border rounded-2xl shadow-card overflow-hidden">
          <Tabs defaultValue="context" className="flex flex-col h-full">
            <div className="border-b border-border bg-card">
              <TabsList className="w-full flex h-12 p-0 bg-transparent rounded-none">
                <TabsTrigger
                  value="context"
                  className="flex-1 h-full text-xs font-semibold rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  <Database className="h-3.5 w-3.5 mr-1.5" /> Retrieved Chunks
                </TabsTrigger>
                <TabsTrigger
                  value="config"
                  className="flex-1 h-full text-xs font-semibold rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  <Sliders className="h-3.5 w-3.5 mr-1.5" /> AI Config & Debug
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 bg-card p-5">
              {/* Context Chunks Tab */}
              <TabsContent value="context" className="space-y-4 mt-0 outline-none h-full flex flex-col">
                {selectedMessage && selectedMessage.sources && selectedMessage.sources.length > 0 ? (
                  <div className="flex-1 space-y-4">
                    <div className="flex justify-between items-center text-xs border-b border-border pb-2.5">
                      <span className="font-semibold text-muted-foreground uppercase tracking-wider">
                        Matched Chunks
                      </span>
                      <Badge className={getScoreColorClass(selectedMessage.confidence)}>
                        Confidence: {selectedMessage.confidence}
                      </Badge>
                    </div>

                    <div className="space-y-3.5">
                      {selectedMessage.sources.map((src: any, i: number) => {
                        const filename = src.metadata?.source || "Uploaded Document";
                        const pageNum = src.metadata?.page_number || src.metadata?.page;
                        const scorePercent = src.score ? `${Math.round(src.score * 100)}%` : "N/A";
                        return (
                          <div key={i} className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-2">
                            <div className="flex items-start justify-between gap-3 border-b border-border/50 pb-2">
                              <div className="min-w-0">
                                <div className="font-semibold text-xs truncate flex items-center gap-1.5">
                                  <BookOpen className="h-3 w-3 text-primary shrink-0" />
                                  {filename}
                                </div>
                                <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                                  Chunk #{i + 1} {pageNum ? `· Page ${pageNum}` : ""}
                                </div>
                              </div>
                              <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded border font-mono shrink-0", getSourceScoreColorClass(src.score || 0))}>
                                {scorePercent}
                              </span>
                            </div>
                            <p className="text-xs leading-relaxed text-muted-foreground font-normal whitespace-pre-wrap max-h-32 overflow-y-auto bg-muted/30 p-2.5 rounded-lg border border-border/40 font-sans">
                              {src.text || "Chunk text payload not available."}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-muted/10 border border-dashed border-border rounded-xl h-[340px]">
                    <Database className="h-10 w-10 text-muted-foreground/60 mb-3" />
                    <h3 className="text-sm font-semibold">No chunks retrieved yet</h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-[220px]">
                      Send a message to see the document matches and similarity scores.
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* Configurations & Debug tab */}
              <TabsContent value="config" className="space-y-6 mt-0 outline-none">
                {/* Performance Metrics */}
                {selectedMessage && selectedMessage.metrics ? (
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-muted-foreground tracking-wider uppercase border-b border-border pb-1.5 flex items-center gap-1.5">
                      <Activity className="h-3.5 w-3.5 text-primary" /> Performance Metrics
                    </h3>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-muted/40 p-2.5 rounded-xl border border-border/40">
                        <div className="text-muted-foreground">Retrieval Time</div>
                        <div className="font-semibold mt-1 font-mono text-foreground">
                          {selectedMessage.metrics.retrievalTime || "0.0000s"}
                        </div>
                      </div>
                      <div className="bg-muted/40 p-2.5 rounded-xl border border-border/40">
                        <div className="text-muted-foreground">LLM Generation</div>
                        <div className="font-semibold mt-1 font-mono text-foreground">
                          {selectedMessage.metrics.llmTime || "0.0000s"}
                        </div>
                      </div>
                      <div className="bg-muted/40 p-2.5 rounded-xl border border-border/40 col-span-2">
                        <div className="text-muted-foreground">Total Response Time</div>
                        <div className="font-semibold mt-1 font-mono text-primary">
                          {selectedMessage.metrics.totalTime || selectedMessage.responseTime || "0.0000s"}
                        </div>
                      </div>
                    </div>

                    {/* Token statistics */}
                    {selectedMessage.tokens && (
                      <div className="bg-muted/40 p-3 rounded-xl border border-border/40 space-y-2 mt-2">
                        <div className="text-[11px] font-semibold text-muted-foreground flex justify-between">
                          <span>TOKEN COUNTS</span>
                          <span className="font-mono text-foreground font-semibold">Total: {selectedMessage.tokens.total}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-muted-foreground pt-1 border-t border-border/50">
                          <div>Prompt: <span className="text-foreground">{selectedMessage.tokens.prompt}</span></div>
                          <div>Completion: <span className="text-foreground">{selectedMessage.tokens.completion}</span></div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}

                {/* Business Rules Debug */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-muted-foreground tracking-wider uppercase border-b border-border pb-1.5 flex items-center gap-1.5">
                    <Scale className="h-3.5 w-3.5 text-primary" /> Active Business Rules
                  </h3>
                  <div className="space-y-2 text-xs">
                    {[
                      { label: "Refund Rules", enabled: businessRules?.refund_enabled },
                      { label: "Warranty Rules", enabled: businessRules?.warranty_enabled },
                      { label: "Replacement Rules", enabled: businessRules?.replacement_enabled },
                      { label: "Escalation Rules", enabled: businessRules?.escalation_enabled },
                      { label: "Working Hours", enabled: !!(businessRules?.working_start && businessRules?.working_end) },
                      { label: "Custom AI Prompt", enabled: !!businessRules?.custom_prompt },
                    ].map((rule, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-card shadow-sm">
                        <span className="font-medium text-xs">{rule.label}</span>
                        {rule.enabled ? (
                          <span className="text-success bg-success-soft px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1">
                            <Check className="h-2.5 w-2.5" /> Active
                          </span>
                        ) : (
                          <span className="text-muted-foreground bg-muted px-2 py-0.5 rounded-full text-[10px] font-semibold">
                            Inactive
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Configuration Debug */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-muted-foreground tracking-wider uppercase border-b border-border pb-1.5 flex items-center gap-1.5">
                    <Sliders className="h-3.5 w-3.5 text-primary" /> Loaded AI Configuration
                  </h3>
                  <div className="rounded-xl border border-border p-4 bg-card shadow-sm space-y-3.5 text-xs">
                    {[
                      { label: "Model Engine", val: aiConfig?.model || "gpt-5" },
                      { label: "Response Style", val: aiConfig?.response_style || "Professional" },
                      { label: "Response Length", val: aiConfig?.response_length || "Medium" },
                      { label: "Temperature", val: aiConfig?.temperature?.toFixed(2) ?? "0.20", mono: true },
                      { label: "Max Tokens", val: aiConfig?.max_tokens ?? "1500", mono: true },
                      { label: "Language", val: aiConfig?.language || "English" },
                      { label: "Confidence Threshold", val: `${Math.round((aiConfig?.confidence_threshold ?? 0.5) * 100)}%`, mono: true },
                      { label: "Streaming Delivery", val: aiConfig?.enable_streaming ? "Enabled" : "Disabled" },
                    ].map((conf, idx) => (
                      <div key={idx} className="flex justify-between items-center pb-2 border-b border-border/50 last:border-0 last:pb-0">
                        <span className="text-muted-foreground">{conf.label}</span>
                        <span className={cn("font-semibold text-foreground", conf.mono && "font-mono")}>
                          {conf.val}
                        </span>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-border flex flex-col gap-1">
                      <span className="text-[10px] font-semibold text-muted-foreground">FALLBACK RESPONSE</span>
                      <p className="text-[11px] leading-relaxed text-muted-foreground bg-muted/40 p-2 rounded border border-border/40 font-normal italic">
                        "{aiConfig?.fallback_response || "I'm sorry, I couldn't find a reliable answer to that question in our knowledge base. Let me transfer you to a member of our team."}"
                      </p>
                    </div>
                  </div>
                </div>

                {/* Knowledge Base Summary */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-muted-foreground tracking-wider uppercase border-b border-border pb-1.5 flex items-center gap-1.5">
                    <Database className="h-3.5 w-3.5 text-primary" /> Knowledge Base Summary
                  </h3>
                  <div className="rounded-xl border border-border p-4 bg-card shadow-sm space-y-3.5 text-xs">
                    {[
                      { label: "Uploaded Documents", val: `${documents.length} files` },
                      { label: "Total Chunks", val: `${totalChunks} vectors` },
                      { label: "Embedding Model", val: "all-MiniLM-L6-v2", mono: true },
                      { label: "Vector Database", val: "ChromaDB" },
                      { label: "Indexing Status", val: indexingStatus },
                    ].map((stat, idx) => (
                      <div key={idx} className="flex justify-between items-center pb-2 border-b border-border/50 last:border-0 last:pb-0">
                        <span className="text-muted-foreground">{stat.label}</span>
                        <span className={cn("font-semibold text-foreground", stat.mono && "font-mono")}>
                          {stat.val}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </>
  );
}
