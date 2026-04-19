import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Activity, Category } from "@/store";
import { cn } from "@/lib/utils";
import { findOutlierIds } from "@/lib/outliers";

const CAT_LABEL: Record<Category, string> = {
  feeding: "Feeding",
  bathroom: "Bathroom",
  health: "Health",
  other: "Habits",
};

const CAT_TEXT_CLS: Record<Category, string> = {
  feeding: "text-feeding",
  bathroom: "text-bathroom",
  health: "text-health",
  other: "text-habits",
};

type Props = {
  category: Category | null;
  activities: Activity[];
  rangeDays: number | null;
  rangeLabel: string;
  onOpenChange: (open: boolean) => void;
};

function formatHour(h: number) {
  const norm = ((h % 24) + 24) % 24;
  const ap = norm >= 12 ? "PM" : "AM";
  const hh = norm % 12 || 12;
  return `${hh} ${ap}`;
}

function MiniStat({
  label,
  value,
  cls,
}: {
  label: string;
  value: string | number;
  cls: string;
}) {
  return (
    <div className="rounded-lg bg-white/[0.03] px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className={cn("mt-1 text-2xl font-medium", cls)}>{value}</div>
    </div>
  );
}

export default function CategoryTimelineModal({
  category,
  activities,
  rangeDays,
  rangeLabel,
  onOpenChange,
}: Props) {
  const [subtype, setSubtype] = useState<string>("all");

  // Reset the subtype selector whenever a different category opens
  useEffect(() => {
    setSubtype("all");
  }, [category]);

  // Unique subtypes in this category's dataset, sorted by frequency desc
  const subtypeOptions = useMemo(() => {
    const counts = new Map<string, number>();
    activities.forEach((a) => {
      counts.set(a.subtype, (counts.get(a.subtype) ?? 0) + 1);
    });
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [activities]);

  const plotted = useMemo(
    () =>
      subtype === "all"
        ? activities
        : activities.filter((a) => a.subtype === subtype),
    [activities, subtype],
  );

  const outlierIds = useMemo(() => findOutlierIds(plotted), [plotted]);

  // Determine the x-axis window
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);

  if (rangeDays !== null) {
    startDate.setDate(startDate.getDate() - rangeDays + 1);
  } else if (activities.length > 0) {
    const oldest = activities.reduce(
      (min, a) => Math.min(min, new Date(a.when).getTime()),
      Date.now(),
    );
    startDate.setTime(oldest);
    startDate.setHours(0, 0, 0, 0);
  } else {
    startDate.setDate(startDate.getDate() - 29);
  }

  const totalMs = Math.max(1, endDate.getTime() - startDate.getTime());
  const totalDays = Math.max(1, Math.ceil(totalMs / 86_400_000));

  const total = plotted.length;
  const avg = (total / totalDays).toFixed(1);
  const hourCounts = Array<number>(24).fill(0);
  plotted.forEach((a) => {
    hourCounts[new Date(a.when).getHours()]++;
  });
  const peakIdx = hourCounts.indexOf(Math.max(...hourCounts));
  const peakHourLabel = total === 0 ? "—" : formatHour(peakIdx);

  // SVG plot
  const VB_W = 820;
  const VB_H = 400;
  const PAD_L = 52;
  const PAD_R = 16;
  const PAD_T = 12;
  const PAD_B = 32;
  const plotW = VB_W - PAD_L - PAD_R;
  const plotH = VB_H - PAD_T - PAD_B;

  const xAt = (iso: string) => {
    const t = new Date(iso).getTime();
    const frac = (t - startDate.getTime()) / totalMs;
    return PAD_L + Math.max(0, Math.min(1, frac)) * plotW;
  };
  const yAtHour = (h: number) => PAD_T + (h / 24) * plotH;
  const yAt = (iso: string) => {
    const d = new Date(iso);
    return yAtHour(d.getHours() + d.getMinutes() / 60);
  };

  const yTicks = [0, 6, 12, 18, 24];
  const tickCount = Math.min(6, Math.max(2, Math.ceil(totalDays / 6)));
  const xTicks: Date[] = [];
  for (let i = 0; i < tickCount; i++) {
    const frac = tickCount === 1 ? 0 : i / (tickCount - 1);
    xTicks.push(new Date(startDate.getTime() + frac * totalMs));
  }

  const cls = category ? CAT_TEXT_CLS[category] : "";
  const label = category ? CAT_LABEL[category] : "";

  return (
    <Dialog open={Boolean(category)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            <span className={cls}>{label}</span>{" "}
            <span className="text-muted-foreground font-normal">
              · {rangeLabel}
            </span>
          </DialogTitle>
          <DialogDescription>
            Each dot is a single logged activity, positioned by date on the
            horizontal axis and time of day on the vertical axis. Clusters
            reveal routines; outliers mark off-schedule events.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            Showing {total} of {activities.length}
            {activities.length === 1 ? " activity" : " activities"}
          </div>
          <Select value={subtype} onValueChange={setSubtype}>
            <SelectTrigger className="w-[200px] bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All {label.toLowerCase()}</SelectItem>
              {subtypeOptions.map((o) => (
                <SelectItem key={o.name} value={o.name}>
                  {o.name}{" "}
                  <span className="text-muted-foreground">({o.count})</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <MiniStat label="Total" value={total} cls={cls} />
          <MiniStat label="Avg / day" value={avg} cls={cls} />
          <MiniStat label="Peak hour" value={peakHourLabel} cls={cls} />
        </div>

        <div className={cn("mt-2 rounded-lg bg-white/[0.03] p-3", cls)}>
          <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="w-full">
            {yTicks.map((h) => (
              <g key={h}>
                <line
                  x1={PAD_L}
                  y1={yAtHour(h)}
                  x2={VB_W - PAD_R}
                  y2={yAtHour(h)}
                  className="stroke-muted-foreground/10"
                  strokeWidth={1}
                />
                <text
                  x={PAD_L - 8}
                  y={yAtHour(h) + 4}
                  textAnchor="end"
                  className="fill-muted-foreground text-[11px]"
                >
                  {formatHour(h === 24 ? 0 : h)}
                </text>
              </g>
            ))}

            {xTicks.map((d, i) => {
              const frac = xTicks.length === 1 ? 0 : i / (xTicks.length - 1);
              const x = PAD_L + frac * plotW;
              return (
                <text
                  key={i}
                  x={x}
                  y={VB_H - 10}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[11px]"
                >
                  {`${d.getMonth() + 1}/${d.getDate()}`}
                </text>
              );
            })}

            <line
              x1={PAD_L}
              y1={PAD_T}
              x2={PAD_L}
              y2={VB_H - PAD_B}
              className="stroke-muted-foreground/30"
              strokeWidth={1}
            />
            <line
              x1={PAD_L}
              y1={VB_H - PAD_B}
              x2={VB_W - PAD_R}
              y2={VB_H - PAD_B}
              className="stroke-muted-foreground/30"
              strokeWidth={1}
            />

            {plotted.map((a) => {
              const isOutlier = outlierIds.has(a.id);
              return (
                <circle
                  key={a.id}
                  cx={xAt(a.when)}
                  cy={yAt(a.when)}
                  r={isOutlier ? 7 : 6}
                  className={isOutlier ? "fill-destructive" : "fill-current"}
                  opacity={isOutlier ? 1 : 0.7}
                >
                  <title>
                    {new Date(a.when).toLocaleString()} — {a.subtype}
                    {isOutlier ? " (off-schedule)" : ""}
                  </title>
                </circle>
              );
            })}

            {plotted.length === 0 && (
              <text
                x={PAD_L + plotW / 2}
                y={PAD_T + plotH / 2}
                textAnchor="middle"
                className="fill-muted-foreground text-sm"
              >
                No activities in this range
              </text>
            )}
          </svg>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="outline"
            className="border-pets text-pets hover:bg-pets/10 hover:text-pets"
          >
            <Download />
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
