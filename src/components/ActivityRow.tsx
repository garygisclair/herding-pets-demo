import { BriefcaseMedical, Target, Toilet, Utensils } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatWhen, type Activity } from "@/store";
import { cn } from "@/lib/utils";

const CHIP: Record<Activity["category"], { label: string; badgeCls: string; bar: string; icon: string }> = {
  bathroom: {
    label: "Bathroom",
    badgeCls: "bg-bathroom text-[#1a1a1a] hover:bg-bathroom",
    bar: "before:bg-bathroom",
    icon: "text-bathroom",
  },
  feeding: {
    label: "Feeding",
    badgeCls: "bg-feeding text-[#1a1a1a] hover:bg-feeding",
    bar: "before:bg-feeding",
    icon: "text-feeding",
  },
  health: {
    label: "Health",
    badgeCls: "bg-health text-[#3a2a00] hover:bg-health",
    bar: "before:bg-health",
    icon: "text-health",
  },
  other: {
    label: "Other",
    badgeCls: "bg-habits text-[#1a1a1a] hover:bg-habits",
    bar: "before:bg-habits",
    icon: "text-habits",
  },
};

function Icon({ category, className }: { category: Activity["category"]; className?: string }) {
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

export default function ActivityRow({
  a,
  onClick,
}: {
  a: Activity;
  onClick?: (a: Activity) => void;
}) {
  const c = CHIP[a.category];
  const clickable = Boolean(onClick);
  return (
    <Card
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? () => onClick!(a) : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick!(a);
              }
            }
          : undefined
      }
      className={cn(
        "relative grid grid-cols-[24px_1fr_1fr_1fr_100px] items-center gap-4 overflow-hidden rounded-xl px-5 py-4",
        "before:absolute before:left-0 before:top-0 before:h-full before:w-[3px]",
        c.bar,
        clickable &&
          "cursor-pointer outline outline-[1.5px] outline-transparent transition-colors hover:outline-pets",
      )}
    >
      <Icon category={a.category} className={cn("size-5", c.icon)} />
      <div className="min-w-0">
        <div className="truncate text-sm font-medium capitalize text-foreground">{a.subtype}</div>
        <div className="mt-0.5 truncate text-xs text-muted-foreground">
          {formatWhen(a.when)}
        </div>
      </div>
      <div className="min-w-0">
        {a.poopScore !== undefined ? (
          <>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Poop Score</div>
            <div className="mt-0.5 truncate text-sm text-muted-foreground">{a.poopScore}</div>
          </>
        ) : a.category === "health" && a.dosage ? (
          <>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Dosage</div>
            <div className="mt-0.5 truncate text-sm text-muted-foreground">{a.dosage}</div>
          </>
        ) : null}
      </div>
      <div className="min-w-0">
        {a.poopNotes ? (
          <>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Poop Notes</div>
            <div className="mt-0.5 truncate text-sm text-muted-foreground">{a.poopNotes}</div>
          </>
        ) : a.peeNotes ? (
          <>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Pee Notes</div>
            <div className="mt-0.5 truncate text-sm text-muted-foreground">{a.peeNotes}</div>
          </>
        ) : a.notes ? (
          <>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Notes</div>
            <div className="mt-0.5 truncate text-sm text-muted-foreground">{a.notes}</div>
          </>
        ) : null}
      </div>
      <Badge className={cn("justify-self-end rounded-full border-0 px-3 py-1 font-semibold", c.badgeCls)}>
        {c.label}
      </Badge>
    </Card>
  );
}
