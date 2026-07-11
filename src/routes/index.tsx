import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bot,
  BarChart3,
  Zap,
  ShieldCheck,
  Workflow,
  Database,
  MessageSquare,
  Check,
  Star,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/lib/theme";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "SupportAI — AI Customer Support Built for Modern Businesses" },
      {
        name: "description",
        content:
          "Enterprise-grade AI support platform with RAG, multi-agent workflows, embeddable widget, and beautiful analytics.",
      },
    ],
  }),
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
          <Logo />
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#workflow" className="hover:text-foreground transition-colors">
              Workflow
            </a>
            <a href="#pricing" className="hover:text-foreground transition-colors">
              Pricing
            </a>
            <a href="#testimonials" className="hover:text-foreground transition-colors">
              Customers
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" asChild size="sm" className="hidden sm:inline-flex">
              <Link to="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm" className="rounded-lg">
              <Link to="/register">
                Start free <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial pointer-events-none" />
        <div className="absolute inset-0 bg-grid opacity-40 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)] pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8 pt-20 pb-24 lg:pt-32 lg:pb-32 text-center">
          <Badge
            variant="secondary"
            className="mb-6 rounded-full px-3 py-1 border border-border/60 bg-background/60 backdrop-blur"
          >
            <Sparkles className="mr-1.5 h-3 w-3 text-primary" /> Now with multi-agent RAG
          </Badge>
          <h1 className="mx-auto max-w-4xl text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.05]">
            AI Customer Support
            <br />
            Built for <span className="text-gradient-primary">Modern Businesses</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            Resolve tickets in seconds, not hours. SupportAI reads your docs, learns your business
            rules, and answers customers on your website — with human-quality writing.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="rounded-lg h-11 px-6">
              <Link to="/register">
                Start free trial <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-lg h-11 px-6">
              <a href="#workflow">See it work</a>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            No credit card required · 14-day trial · SOC 2 Type II
          </p>

          {/* Hero card */}
          <div className="mt-16 mx-auto max-w-5xl">
            <div className="rounded-2xl border border-border/70 bg-card shadow-elegant overflow-hidden">
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border/70 bg-muted/30">
                <div className="h-2.5 w-2.5 rounded-full bg-destructive/50" />
                <div className="h-2.5 w-2.5 rounded-full bg-warning/60" />
                <div className="h-2.5 w-2.5 rounded-full bg-success/60" />
                <div className="ml-4 text-xs text-muted-foreground font-mono">
                  app.supportai.io/dashboard
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 p-6">
                {[
                  { label: "Conversations", value: "12,847", trend: "+18%" },
                  { label: "Resolved by AI", value: "94.2%", trend: "+3.1%" },
                  { label: "Avg. Response", value: "1.4s", trend: "-32%" },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl border border-border/70 p-4 text-left">
                    <div className="text-xs text-muted-foreground">{s.label}</div>
                    <div className="mt-1 text-2xl font-semibold tracking-tight">{s.value}</div>
                    <div className="mt-1 text-xs text-success">{s.trend}</div>
                  </div>
                ))}
              </div>
              <div className="px-6 pb-6">
                <div className="h-40 rounded-xl bg-gradient-to-br from-primary-soft to-transparent border border-border/70 flex items-end p-4 gap-1">
                  {[38, 55, 42, 68, 58, 82, 72, 90, 78, 95, 88, 100].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t bg-gradient-primary opacity-90"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Logos */}
      <section className="border-y border-border/60 bg-muted/20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-10">
          <p className="text-center text-xs uppercase tracking-widest text-muted-foreground mb-6">
            Trusted by teams at
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4 opacity-70">
            {["Linear", "Ramp", "Vercel", "Notion", "Framer", "Retool"].map((n) => (
              <div key={n} className="text-lg font-semibold tracking-tight text-muted-foreground">
                {n}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-6 lg:px-8 py-24">
        <div className="max-w-2xl">
          <div className="text-xs font-medium uppercase tracking-widest text-primary">Platform</div>
          <h2 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight">
            Everything your support team needs
          </h2>
          <p className="mt-3 text-muted-foreground">
            One platform. Connect your data, configure your agents, ship the widget, and watch
            resolution rates climb.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: Database,
              title: "Knowledge Base with RAG",
              desc: "Upload PDFs, FAQs, catalogs, and warranties. We chunk, embed, and index them for instant retrieval.",
            },
            {
              icon: Workflow,
              title: "Multi-agent workflows",
              desc: "Analysis, retrieval, decision, response, and follow-up agents — visual, editable, and observable.",
            },
            {
              icon: MessageSquare,
              title: "Embeddable widget",
              desc: "Match your brand in seconds. Copy one line of code. Works on any website or app.",
            },
            {
              icon: BarChart3,
              title: "Enterprise analytics",
              desc: "CSAT, resolution rate, response time, and complaint categories — all in one dashboard.",
            },
            {
              icon: ShieldCheck,
              title: "Secure by default",
              desc: "SOC 2 Type II, encryption in transit and at rest, and full workspace isolation per tenant.",
            },
            {
              icon: Zap,
              title: "APIs & webhooks",
              desc: "Trigger events, sync with your CRM, and integrate SupportAI into your existing stack.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="group relative rounded-2xl border border-border/70 bg-card p-6 shadow-card hover:shadow-elegant transition-shadow"
            >
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold tracking-tight">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Workflow */}
      <section id="workflow" className="border-y border-border/60 bg-muted/20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-24">
          <div className="text-center max-w-2xl mx-auto">
            <div className="text-xs font-medium uppercase tracking-widest text-primary">
              How it works
            </div>
            <h2 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight">
              A pipeline of specialized agents
            </h2>
            <p className="mt-3 text-muted-foreground">
              Every message flows through purpose-built agents. Fully transparent and editable.
            </p>
          </div>

          <div className="mt-14 grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            {[
              { name: "Analyze", desc: "Detect intent" },
              { name: "Context", desc: "Fetch history" },
              { name: "Retrieve", desc: "RAG search" },
              { name: "Decide", desc: "Apply rules" },
              { name: "Respond", desc: "Generate reply" },
              { name: "Follow-up", desc: "Verify CSAT" },
            ].map((n, i) => (
              <div
                key={n.name}
                className="relative rounded-2xl border border-border/70 bg-card p-5 shadow-card"
              >
                <div className="text-[11px] font-mono text-muted-foreground">0{i + 1}</div>
                <div className="mt-2 font-semibold tracking-tight">{n.name}</div>
                <div className="text-xs text-muted-foreground">{n.desc}</div>
                <div className="mt-4 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-gradient-primary"
                    style={{ width: `${(i + 1) * 16}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="mx-auto max-w-7xl px-6 lg:px-8 py-24">
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-center max-w-2xl mx-auto">
          Loved by support teams everywhere
        </h2>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {[
            {
              quote:
                "SupportAI resolves 92% of our tier-1 tickets. We reallocated three FTEs to strategic work in a quarter.",
              name: "Alex Morgan",
              role: "Head of Support · Ramp",
            },
            {
              quote:
                "The multi-agent workflow gives us the transparency an enterprise buyer expects. Nothing else came close.",
              name: "Priya Patel",
              role: "VP of CX · Loom",
            },
            {
              quote:
                "We shipped it in a day. Our CSAT jumped 11 points in the first month. It just works.",
              name: "Daniel Chen",
              role: "COO · Formal",
            },
          ].map((t) => (
            <div
              key={t.name}
              className="rounded-2xl border border-border/70 bg-card p-6 shadow-card"
            >
              <div className="flex gap-0.5 text-warning">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-warning" />
                ))}
              </div>
              <p className="mt-4 text-sm leading-relaxed">"{t.quote}"</p>
              <div className="mt-5 pt-5 border-t border-border/70">
                <div className="text-sm font-medium">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-border/60 bg-muted/20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-24">
          <div className="text-center max-w-2xl mx-auto">
            <div className="text-xs font-medium uppercase tracking-widest text-primary">
              Pricing
            </div>
            <h2 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight">
              Simple, usage-based pricing
            </h2>
            <p className="mt-3 text-muted-foreground">
              Start free. Upgrade when your volume grows.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              {
                name: "Starter",
                price: "$0",
                per: "forever",
                desc: "For pilots & small teams",
                features: [
                  "500 AI resolutions/mo",
                  "1 workspace",
                  "Widget & API",
                  "Community support",
                ],
                cta: "Start free",
                highlight: false,
              },
              {
                name: "Growth",
                price: "$249",
                per: "/month",
                desc: "For growing companies",
                features: [
                  "10,000 AI resolutions/mo",
                  "Unlimited agents",
                  "Advanced analytics",
                  "CRM integrations",
                  "Priority support",
                ],
                cta: "Start free trial",
                highlight: true,
              },
              {
                name: "Enterprise",
                price: "Custom",
                per: "",
                desc: "For large organizations",
                features: [
                  "Unlimited resolutions",
                  "SSO / SAML",
                  "SOC 2 & DPA",
                  "Dedicated CSM",
                  "Custom SLA",
                ],
                cta: "Contact sales",
                highlight: false,
              },
            ].map((p) => (
              <div
                key={p.name}
                className={
                  p.highlight
                    ? "relative rounded-2xl border-2 border-primary bg-card p-6 shadow-elegant"
                    : "relative rounded-2xl border border-border/70 bg-card p-6 shadow-card"
                }
              >
                {p.highlight && (
                  <Badge className="absolute -top-3 left-6 rounded-full">Most popular</Badge>
                )}
                <div className="text-sm font-medium">{p.name}</div>
                <div className="mt-4 flex items-baseline gap-1">
                  <div className="text-4xl font-semibold tracking-tight">{p.price}</div>
                  <div className="text-sm text-muted-foreground">{p.per}</div>
                </div>
                <div className="mt-1 text-sm text-muted-foreground">{p.desc}</div>
                <ul className="mt-6 space-y-2.5 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="h-4 w-4 shrink-0 text-success mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  className="mt-8 w-full rounded-lg"
                  variant={p.highlight ? "default" : "outline"}
                >
                  <Link to="/register">{p.cta}</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 lg:px-8 py-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-primary p-10 lg:p-16 text-center text-white shadow-glow">
          <Bot className="mx-auto h-10 w-10 opacity-90" />
          <h2 className="mt-4 text-3xl sm:text-4xl font-semibold tracking-tight">
            Ship AI support this week
          </h2>
          <p className="mt-3 text-white/85 max-w-xl mx-auto">
            Join hundreds of companies replacing ticket queues with instant, accurate answers.
          </p>
          <Button asChild size="lg" variant="secondary" className="mt-8 rounded-lg h-11 px-6">
            <Link to="/register">
              Create your workspace <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-12 flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo />
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} SupportAI, Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <a href="#" className="hover:text-foreground">
              Privacy
            </a>
            <a href="#" className="hover:text-foreground">
              Terms
            </a>
            <a href="#" className="hover:text-foreground">
              Security
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
