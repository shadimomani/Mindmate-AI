import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatHour } from "./constants";

export function StatTile({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: "primary" | "accent" | "work" | "leisure";
}) {
  const colorMap: Record<string, string> = {
    primary: "var(--primary)",
    accent: "var(--accent)",
    work: "var(--section-work)",
    leisure: "var(--section-leisure)",
  };
  const v = colorMap[color];
  return (
    <div
      className="rounded-2xl p-4 border"
      style={{
        background: `hsl(${v} / 0.08)`,
        borderColor: `hsl(${v} / 0.2)`,
      }}
    >
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
        {label}
      </p>
      <p className="text-2xl font-bold" style={{ color: `hsl(${v})` }}>
        {value}
      </p>
    </div>
  );
}

export function HoursTile({
  title,
  hours,
  tone,
  lang,
}: {
  title: string;
  hours: number[];
  tone: "green" | "red";
  lang: "en" | "ar";
}) {
  const toneClass =
    tone === "green"
      ? "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400"
      : "bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400";
  return (
    <div className={cn("rounded-2xl p-4 border", toneClass)}>
      <div className="flex items-center gap-2 mb-2">
        <Clock className="w-4 h-4" />
        <p className="text-xs font-semibold uppercase tracking-wider">{title}</p>
      </div>
      {hours.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {hours.map((h) => (
            <span
              key={h}
              className="text-xs font-medium px-2 py-0.5 rounded-md bg-background/60"
            >
              {formatHour(h, lang)}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs opacity-70">
          {lang === "ar" ? "لا توجد بيانات كافية" : "Not enough data yet"}
        </p>
      )}
    </div>
  );
}

export function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-muted text-foreground border border-border">
      {children}
    </span>
  );
}
