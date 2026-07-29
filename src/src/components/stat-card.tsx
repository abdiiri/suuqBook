import type { LucideIcon } from "lucide-react";

type Tone = "green" | "blue" | "amber" | "purple" | "rose";

const toneStyles: Record<Tone, { bg: string; fg: string }> = {
  green: { bg: "bg-emerald-100", fg: "text-emerald-600" },
  blue: { bg: "bg-sky-100", fg: "text-sky-600" },
  amber: { bg: "bg-amber-100", fg: "text-amber-600" },
  purple: { bg: "bg-violet-100", fg: "text-violet-600" },
  rose: { bg: "bg-rose-100", fg: "text-rose-600" },
};

export function StatCard({
  label,
  value,
  hint,
  tone = "green",
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: Tone;
  icon: LucideIcon;
}) {
  const s = toneStyles[tone];
  return (
    <div className="card-elevated p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-medium text-muted-foreground">{label}</div>
          <div className="mt-1.5 text-2xl font-bold tracking-tight text-foreground">{value}</div>
          {hint ? <div className="mt-1 text-xs text-muted-foreground">{hint}</div> : null}
        </div>
        <div className={`grid size-11 shrink-0 place-items-center rounded-full ${s.bg} ${s.fg}`}>
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  );
}
