import { Sparkles } from "lucide-react";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-primary shadow-glow">
        <Sparkles className="h-4 w-4 text-white" strokeWidth={2.5} />
      </div>
      {!compact && (
        <span className="text-[15px] font-semibold tracking-tight text-foreground">
          Support<span className="text-gradient-primary">AI</span>
        </span>
      )}
    </div>
  );
}
