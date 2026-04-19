import { useMemo, useState } from "react";
import {
  BriefcaseMedical,
  Download,
  Sparkles,
  Target,
  Toilet,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStore, type Activity, type Category } from "@/store";
import { cn } from "@/lib/utils";
import { findOutlierIds } from "@/lib/outliers";
import CategoryTimelineModal from "@/components/CategoryTimelineModal";

type CatFilter = "all" | Category;

const CAT_OPTIONS: { value: CatFilter; label: string }[] = [
  { value: "all", label: "All categories" },
  { value: "feeding", label: "Feeding" },
  { value: "bathroom", label: "Bathroom" },
  { value: "health", label: "Health" },
  { value: "other", label: "Habits" },
];

const RANGE_LABELS: Record<string, string> = {
  "7": "last 7 days",
  "30": "last 30 days",
  "90": "last 90 days",
  all: "all time",
};

const CAT_META: Record<
  Category,
  { label: string; text: string; bg: string; dark: boolean; icon: LucideIcon }
> = {
  feeding:  { label: "Feeding",  text: "text-feeding",  bg: "bg-feeding",  dark: true, icon: Utensils },
  bathroom: { label: "Bathroom", text: "text-bathroom", bg: "bg-bathroom", dark: true, icon: Toilet },
  health:   { label: "Health",   text: "text-health",   bg: "bg-health",   dark: true, icon: BriefcaseMedical },
  other:    { label: "Habits",   text: "text-habits",   bg: "bg-habits",   dark: true, icon: Target },
};
const CATS: Category[] = ["feeding", "bathroom", "health", "other"];

function relDay(iso: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const then = new Date(iso);
  then.setHours(0, 0, 0, 0);
  const days = Math.round((today.getTime() - then.getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? "" : "s"} ago`;
}

function hourLabel(h: number) {
  const ap = h >= 12 ? "PM" : "AM";
  const hh = h % 12 || 12;
  return `${hh} ${ap}`;
}

type StatCardProps = {
  label: string;
  value: string | number;
  sub?: string;
  valueClassName?: string;
};

function StatCard({ label, value, sub, valueClassName }: StatCardProps) {
  return (
    <Card className="gap-2 px-5 py-4">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className={cn("text-[28px] font-medium leading-tight", valueClassName)}>
        {value}
      </div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </Card>
  );
}

export default function Reports() {
  const { pets, activities } = useStore();
  const [petId, setPetId] = useState("all");
  const [cat, setCat] = useState<CatFilter>("all");
  const [range, setRange] = useState("30");
  const [modalCat, setModalCat] = useState<Category | null>(null);

  const rangeDays = range === "all" ? null : Number(range);
  const rangeLabel = RANGE_LABELS[range] ?? "this period";

  const filtered = useMemo(() => {
    const cutoff = rangeDays === null ? 0 : Date.now() - rangeDays * 86_400_000;
    return activities.filter((a) => {
      if (petId !== "all" && a.petId !== petId) return false;
      if (cat !== "all" && a.category !== cat) return false;
      if (new Date(a.when).getTime() < cutoff) return false;
      return true;
    });
  }, [activities, petId, cat, rangeDays]);

  const insights = useMemo(() => {
    // past/prev 7d windows use the pet+category filters (not the range) so
    // week-over-week comparisons stay meaningful across range choices.
    const basePetCat = activities.filter((a) => {
      if (petId !== "all" && a.petId !== petId) return false;
      if (cat !== "all" && a.category !== cat) return false;
      return true;
    });
    const now = Date.now();
    const past7 = basePetCat.filter(
      (a) => now - new Date(a.when).getTime() < 7 * 86_400_000,
    );
    const prev7 = basePetCat.filter((a) => {
      const d = now - new Date(a.when).getTime();
      return d >= 7 * 86_400_000 && d < 14 * 86_400_000;
    });

    const totals = CATS.reduce<Record<Category, number>>(
      (acc, k) => {
        acc[k] = filtered.filter((x) => x.category === k).length;
        return acc;
      },
      { feeding: 0, bathroom: 0, health: 0, other: 0 },
    );

    const topCatEntry = CATS.map((k) => [k, totals[k]] as const)
      .sort((a, b) => b[1] - a[1])
      .find(([, n]) => n > 0);

    // Consecutive-day logging streak ending today (scoped to filters)
    const days = new Set(
      filtered.map((a) => {
        const d = new Date(a.when);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      }),
    );
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      if (days.has(d.getTime())) streak++;
      else break;
    }

    let divisor: number;
    if (rangeDays !== null) {
      divisor = rangeDays;
    } else if (filtered.length === 0) {
      divisor = 1;
    } else {
      const oldest = new Date(filtered[filtered.length - 1].when).getTime();
      divisor = Math.max(1, Math.round((now - oldest) / 86_400_000));
    }
    const avg = (filtered.length / divisor).toFixed(1);
    const wow = prev7.length
      ? Math.round(((past7.length - prev7.length) / prev7.length) * 100)
      : null;

    const hours = Array<number>(24).fill(0);
    filtered.forEach((a) => {
      hours[new Date(a.when).getHours()]++;
    });
    const peakHour =
      filtered.length > 0 ? hours.indexOf(Math.max(...hours)) : null;

    // Last bathroom is intentionally independent of the category filter so
    // the storyline line stays meaningful even when viewing another category.
    const lastBathroomByPet = new Map<string, Activity | undefined>(
      pets.map((p) => {
        const b = activities
          .filter((a) => a.petId === p.id && a.category === "bathroom")
          .sort(
            (a, b) =>
              new Date(b.when).getTime() - new Date(a.when).getTime(),
          )[0];
        return [p.id, b];
      }),
    );

    return {
      past7,
      totals,
      topCatEntry,
      streak,
      avg,
      wow,
      peakHour,
      lastBathroomByPet,
    };
  }, [filtered, activities, pets, petId, cat, rangeDays]);

  const grandTotal = filtered.length;
  const visiblePets = petId === "all" ? pets : pets.filter((p) => p.id === petId);

  // Per-category outlier counts (honors the same filters as the tiles).
  const outlierCounts = useMemo(() => {
    const counts: Record<Category, number> = { feeding: 0, bathroom: 0, health: 0, other: 0 };
    CATS.forEach((k) => {
      const catActs = filtered.filter((a) => a.category === k);
      counts[k] = findOutlierIds(catActs).size;
    });
    return counts;
  }, [filtered]);

  // Drill-in dataset: pet + range filtered, but always scoped to the clicked
  // category (ignores the global category filter so any tile is meaningful).
  const modalActivities = useMemo(() => {
    if (!modalCat) return [];
    const cutoff =
      rangeDays === null ? 0 : Date.now() - rangeDays * 86_400_000;
    return activities.filter((a) => {
      if (petId !== "all" && a.petId !== petId) return false;
      if (a.category !== modalCat) return false;
      if (new Date(a.when).getTime() < cutoff) return false;
      return true;
    });
  }, [modalCat, activities, petId, rangeDays]);

  const clear = () => {
    setPetId("all");
    setCat("all");
    setRange("30");
  };

  // Per-pet breakdown (sorted by activity count desc)
  const perPet = [...visiblePets]
    .map((p) => {
      const petActs = filtered.filter((a) => a.petId === p.id);
      const petTotals = CATS.reduce<Record<Category, number>>(
        (acc, k) => {
          acc[k] = petActs.filter((a) => a.category === k).length;
          return acc;
        },
        { feeding: 0, bathroom: 0, health: 0, other: 0 },
      );
      const topCat = CATS.map((k) => [k, petTotals[k]] as const)
        .sort((a, b) => b[1] - a[1])
        .find(([, n]) => n > 0);
      return { pet: p, count: petActs.length, petTotals, topCat };
    })
    .sort((a, b) => b.count - a.count);

  return (
    <>
      <h1 className="mb-6 font-display text-4xl font-medium text-pets">Reports</h1>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          A snapshot of the {rangeLabel} — what&apos;s going well and what to watch.
        </p>
        <Button
          variant="outline"
          className="border-pets text-pets hover:bg-pets/10 hover:text-pets"
        >
          <Download />
          Download Report
        </Button>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Select value={petId} onValueChange={setPetId}>
          <SelectTrigger className="w-[220px] bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All pets</SelectItem>
            {pets.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={cat} onValueChange={(v) => setCat(v as CatFilter)}>
          <SelectTrigger className="w-[180px] bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CAT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="w-[140px] bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 Days</SelectItem>
            <SelectItem value="30">Last 30 Days</SelectItem>
            <SelectItem value="90">Last 90 Days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="ghost" onClick={clear}>
          Clear Filters
        </Button>
      </div>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div
        className="mb-4 grid grid-cols-[auto_1fr] items-start gap-5 rounded-2xl border border-pets/25 p-8"
        style={{
          background:
            "linear-gradient(135deg, rgba(139,213,202,0.12), rgba(198,160,246,0.1))",
        }}
      >
        <div className="flex size-[60px] items-center justify-center rounded-full bg-pets/20 text-pets">
          <Sparkles className="size-7" />
        </div>
        <div>
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-pets">
            {insights.streak > 0
              ? `${insights.streak}-day logging streak`
              : "Time to start a streak"}
          </div>
          <div className="mb-3 font-sans text-[22px] font-medium leading-snug text-foreground">
            {grandTotal === 0 ? (
              "No activities match the selected filters."
            ) : (
              <>
                You&apos;ve logged{" "}
                <span className="text-pets">{grandTotal}</span>{" "}
                activities across{" "}
                <span className="text-pets">{visiblePets.length}</span>{" "}
                pet{visiblePets.length === 1 ? "" : "s"} in the {rangeLabel}.
              </>
            )}
          </div>
          {grandTotal > 0 && (
            <div className="text-[13px] leading-snug text-muted-foreground">
              That&apos;s an average of{" "}
              <strong className="font-semibold text-foreground/90">
                {insights.avg}
              </strong>{" "}
              per day
              {insights.wow !== null && (
                <>
                  {" · "}
                  <span
                    className={
                      insights.wow >= 0 ? "text-feeding" : "text-health"
                    }
                  >
                    {insights.wow >= 0 ? "↑" : "↓"} {Math.abs(insights.wow)}%
                  </span>{" "}
                  vs. previous week
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Stat row ─────────────────────────────────────────────────── */}
      <div className="mb-4 grid grid-cols-4 gap-3">
        <StatCard
          label="Most logged"
          value={insights.topCatEntry ? CAT_META[insights.topCatEntry[0]].label : "—"}
          sub={
            insights.topCatEntry
              ? `${insights.topCatEntry[1]} entries`
              : undefined
          }
          valueClassName={
            insights.topCatEntry ? CAT_META[insights.topCatEntry[0]].text : undefined
          }
        />
        <StatCard
          label="Busiest hour"
          value={insights.peakHour !== null ? hourLabel(insights.peakHour) : "—"}
          sub="most activity logged"
          valueClassName="text-feeding"
        />
        <StatCard
          label="This week"
          value={insights.past7.length}
          sub="activities"
          valueClassName="text-pets"
        />
        <StatCard
          label="Pets tracked"
          value={visiblePets.length}
          sub={petId === "all" ? "in your household" : "currently filtered"}
          valueClassName="text-health"
        />
      </div>

      {/* ── What you're tracking ─────────────────────────────────────── */}
      <Card className="mb-4 gap-5 px-6 py-6">
        <div className="text-base font-semibold">What you&apos;re tracking</div>
        {/* 100% stacked bar */}
        <div className="flex h-10 gap-[2px] overflow-hidden rounded-lg">
          {grandTotal === 0 ? (
            <div className="flex w-full items-center justify-center bg-white/5 text-xs text-muted-foreground">
              No activities match the selected filters
            </div>
          ) : (
            CATS.map((k) => {
              const w = (insights.totals[k] / grandTotal) * 100;
              if (w === 0) return null;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setModalCat(k)}
                  aria-label={`Show ${CAT_META[k].label} timeline`}
                  className={cn(
                    "flex items-center justify-center text-[11px] font-semibold text-[#1a1a1a] transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pets",
                    CAT_META[k].bg,
                  )}
                  style={{ width: `${w}%` }}
                >
                  {w > 10 ? `${Math.round(w)}%` : ""}
                </button>
              );
            })
          )}
        </div>
        {/* 2×2 tiles */}
        <div className="grid grid-cols-2 gap-3">
          {CATS.map((k) => {
            const Icon = CAT_META[k].icon;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setModalCat(k)}
                aria-label={`Show ${CAT_META[k].label} timeline`}
                className="flex items-center gap-3 rounded-lg bg-white/[0.03] px-4 py-2.5 text-left transition-colors hover:bg-white/[0.06] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pets"
              >
                <Icon className={cn("size-[18px]", CAT_META[k].text)} />
                <div className="flex-1">
                  <div className="text-sm text-foreground">{CAT_META[k].label}</div>
                  <div className="text-xs text-muted-foreground">
                    {insights.totals[k]} in the {rangeLabel}
                    {outlierCounts[k] > 0 && (
                      <>
                        {" · "}
                        <span className="text-destructive">
                          {outlierCounts[k]} off-schedule
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className={cn("font-medium text-[22px] leading-none", CAT_META[k].text)}>
                  {insights.totals[k]}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* ── How each pet is doing ────────────────────────────────────── */}
      <Card className="gap-4 px-6 py-6">
        <div className="text-base font-semibold">How each pet is doing</div>
        <div className="flex flex-col gap-4">
          {perPet.map(({ pet, count, petTotals, topCat }) => {
            const lastB = insights.lastBathroomByPet.get(pet.id);
            const nickname = pet.nickname ?? pet.name;
            return (
              <div
                key={pet.id}
                className="grid grid-cols-[60px_1fr_auto] items-center gap-4"
              >
                <Avatar className="size-[60px] shrink-0 ring-2 ring-pets">
                  {pet.photo && <AvatarImage src={pet.photo} alt={pet.name} />}
                  <AvatarFallback className="bg-gradient-to-br from-pets to-[#5ab0a5] font-display text-xl font-medium text-primary-foreground">
                    {pet.initials}
                  </AvatarFallback>
                </Avatar>

                <div>
                  <div className="font-display text-xl font-medium text-foreground">
                    {nickname}
                  </div>
                  <div className="mt-1 text-[13px] text-muted-foreground">
                    {count === 0 ? (
                      `No activity in the ${rangeLabel}`
                    ) : (
                      <>
                        {count} {count === 1 ? "activity" : "activities"} in the {rangeLabel}
                        {topCat && (
                          <>
                            {" · mostly "}
                            <span className={CAT_META[topCat[0]].text}>
                              {CAT_META[topCat[0]].label.toLowerCase()}
                            </span>
                          </>
                        )}
                        {lastB && (
                          <> · last bathroom {relDay(lastB.when)}</>
                        )}
                      </>
                    )}
                  </div>
                  {/* Per-pet category share bar */}
                  <div className="mt-2 flex h-1.5 gap-1 overflow-hidden rounded-full">
                    {count === 0 ? (
                      <div className="h-full w-full rounded-full bg-white/5" />
                    ) : (
                      CATS.map((k) => {
                        const w = (petTotals[k] / count) * 100;
                        if (w === 0) return null;
                        return (
                          <div
                            key={k}
                            className={cn("h-full rounded-full", CAT_META[k].bg)}
                            style={{ width: `${w}%` }}
                          />
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="text-4xl font-medium leading-none text-pets">
                  {count}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <CategoryTimelineModal
        category={modalCat}
        activities={modalActivities}
        rangeDays={rangeDays}
        rangeLabel={rangeLabel}
        onOpenChange={(o) => !o && setModalCat(null)}
      />
    </>
  );
}
