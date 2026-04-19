import { BriefcaseMedical, Copy, Pencil, Target, Toilet, Trash2, Utensils } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Activity, Pet } from "@/store";
import { cn } from "@/lib/utils";

const CAT_META: Record<
  Activity["category"],
  { label: string; badgeCls: string; tileCls: string; iconCls: string }
> = {
  bathroom: {
    label: "Bathroom",
    badgeCls: "bg-bathroom text-[#1a1a1a] hover:bg-bathroom",
    tileCls: "bg-bathroom/15",
    iconCls: "text-bathroom",
  },
  feeding: {
    label: "Feeding",
    badgeCls: "bg-feeding text-[#1a1a1a] hover:bg-feeding",
    tileCls: "bg-feeding/15",
    iconCls: "text-feeding",
  },
  health: {
    label: "Health",
    badgeCls: "bg-health text-[#3a2a00] hover:bg-health",
    tileCls: "bg-health/15",
    iconCls: "text-health",
  },
  other: {
    label: "Habits",
    badgeCls: "bg-habits text-[#1a1a1a] hover:bg-habits",
    tileCls: "bg-habits/15",
    iconCls: "text-habits",
  },
};

function CatIcon({
  category,
  className,
}: {
  category: Activity["category"];
  className?: string;
}) {
  const I =
    category === "bathroom"
      ? Toilet
      : category === "health"
        ? BriefcaseMedical
        : category === "feeding"
          ? Utensils
          : Target;
  return <I className={className} />;
}

function formatDateParts(iso: string) {
  const d = new Date(iso);
  const date = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
  const hr = d.getHours();
  const hr12 = ((hr + 11) % 12) + 1;
  const ampm = hr >= 12 ? "PM" : "AM";
  const min = d.getMinutes().toString().padStart(2, "0");
  const time = `${hr12}:${min} ${ampm}`;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayStart = new Date(d);
  dayStart.setHours(0, 0, 0, 0);
  const diffDays = Math.round(
    (today.getTime() - dayStart.getTime()) / 86400000,
  );
  const rel =
    diffDays === 0
      ? "Today"
      : diffDays === 1
        ? "Yesterday"
        : diffDays > 0
          ? `${diffDays} days ago`
          : `in ${-diffDays} days`;

  return { date, time, rel };
}

function renderDetail(a: Activity) {
  if (a.notes)
    return <span className="block truncate text-sm">{a.notes}</span>;
  if (a.poopNotes)
    return <span className="block truncate text-sm">{a.poopNotes}</span>;
  if (a.peeNotes)
    return <span className="block truncate text-sm">{a.peeNotes}</span>;
  if (a.dosage)
    return (
      <span className="text-sm">
        {a.dosage}
        {a.unit ? ` ${a.unit}` : ""}
      </span>
    );
  return <span className="text-muted-foreground/50">—</span>;
}

const GRID_COLS =
  "grid-cols-[minmax(200px,1.2fr)_130px_90px_130px_minmax(160px,1.3fr)_120px]";

export default function ActivityTable({
  activities,
  pets,
  onEdit,
  onCopy,
  onDelete,
}: {
  activities: Activity[];
  pets: Pet[];
  onEdit?: (a: Activity) => void;
  onCopy?: (a: Activity) => void;
  onDelete?: (a: Activity) => void;
}) {
  const petById = new Map(pets.map((p) => [p.id, p]));

  return (
    <div className="overflow-hidden rounded-xl border bg-card/50">
      <div
        className={cn(
          "grid items-center border-b border-border/50 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
          GRID_COLS,
        )}
      >
        <div className="px-5 py-3">Activity</div>
        <div className="px-4 py-3">Date</div>
        <div className="px-4 py-3">Time</div>
        <div className="px-4 py-3">Category</div>
        <div className="px-4 py-3">Detail</div>
        <div className="px-4 py-3" />
      </div>

      <div>
        {activities.map((a) => {
          const c = CAT_META[a.category];
          const pet = petById.get(a.petId);
          const { date, time, rel } = formatDateParts(a.when);
          return (
            <div
              key={a.id}
              className={cn(
                "grid items-center border-t border-border/30 transition-colors first:border-t-0 hover:bg-card",
                GRID_COLS,
              )}
            >
              <div className="flex items-center gap-3 px-5 py-3">
                <div
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full",
                    c.tileCls,
                  )}
                >
                  <CatIcon
                    category={a.category}
                    className={cn("size-4", c.iconCls)}
                  />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium capitalize">
                    {a.subtype}
                  </div>
                  {pet && (
                    <div className="truncate text-xs text-muted-foreground">
                      {pet.nickname || pet.name}
                    </div>
                  )}
                </div>
              </div>
              <div className="px-4 py-3">
                <div className="text-sm">{date}</div>
                <div className="text-xs text-muted-foreground">{rel}</div>
              </div>
              <div className="px-4 py-3 text-sm">{time}</div>
              <div className="px-4 py-3">
                <Badge
                  className={cn(
                    "rounded-full border-0 px-3 py-0.5 text-xs font-medium",
                    c.badgeCls,
                  )}
                >
                  {c.label}
                </Badge>
              </div>
              <div className="min-w-0 px-4 py-3 text-muted-foreground">
                {renderDetail(a)}
              </div>
              <div className="flex items-center justify-end gap-0.5 px-3 py-3">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground hover:text-foreground"
                    onClick={() => onEdit(a)}
                    aria-label="Edit activity"
                  >
                    <Pencil className="size-4" />
                  </Button>
                )}
                {onCopy && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground hover:text-foreground"
                    onClick={() => onCopy(a)}
                    aria-label="Duplicate activity"
                  >
                    <Copy className="size-4" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground hover:text-destructive"
                    onClick={() => onDelete(a)}
                    aria-label="Delete activity"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
