import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronDown, ClipboardCheck, Download, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStore, type Activity, type Category } from "@/store";
import ActivityRow from "@/components/ActivityRow";
import AddActivityModal from "@/components/AddActivityModal";
import { cn } from "@/lib/utils";

const ALL_CATS: Category[] = ["bathroom", "feeding", "health", "other"];

const CAT_META: Record<
  Category,
  { label: string; badgeCls: string; dotCls: string }
> = {
  bathroom: {
    label: "Bathroom",
    badgeCls: "bg-bathroom text-[#1a1a1a] hover:bg-bathroom",
    dotCls: "bg-bathroom",
  },
  feeding: {
    label: "Feeding",
    badgeCls: "bg-feeding text-[#1a1a1a] hover:bg-feeding",
    dotCls: "bg-feeding",
  },
  health: {
    label: "Health",
    badgeCls: "bg-health text-[#3a2a00] hover:bg-health",
    dotCls: "bg-health",
  },
  other: {
    label: "Other",
    badgeCls: "bg-habits text-[#1a1a1a] hover:bg-habits",
    dotCls: "bg-habits",
  },
};

function CategoryMultiSelect({
  value,
  onChange,
}: {
  value: Category[];
  onChange: (v: Category[]) => void;
}) {
  const toggle = (c: Category) =>
    value.includes(c)
      ? onChange(value.filter((x) => x !== c))
      : onChange([...value, c]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex min-h-10 w-[380px] items-center gap-2 rounded-md border bg-card px-3 py-1.5 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          {value.length === 0 ? (
            <span className="text-muted-foreground">All categories</span>
          ) : (
            <div className="flex flex-1 flex-wrap gap-1">
              {value.map((c) => (
                <Badge
                  key={c}
                  className={cn(
                    "gap-0.5 rounded-full border-0 pl-2 pr-1.5 py-0 pt-px text-[11px] font-medium",
                    CAT_META[c].badgeCls,
                  )}
                >
                  {CAT_META[c].label}
                  <span
                    role="button"
                    tabIndex={-1}
                    aria-label={`Remove ${CAT_META[c].label}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggle(c);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        toggle(c);
                      }
                    }}
                    className="flex cursor-pointer items-center rounded-full outline-none hover:opacity-70"
                  >
                    <X className="size-2.5" />
                  </span>
                </Badge>
              ))}
            </div>
          )}
          <ChevronDown className="ml-auto size-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[260px] p-1.5">
        {ALL_CATS.map((c) => {
          const checked = value.includes(c);
          return (
            <label
              key={c}
              className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-accent"
            >
              <Checkbox
                checked={checked}
                onCheckedChange={() => toggle(c)}
              />
              <span
                className={cn(
                  "inline-block size-2.5 rounded-full",
                  CAT_META[c].dotCls,
                )}
              />
              <span className="text-sm">{CAT_META[c].label}</span>
            </label>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [1];
  if (current > 3) pages.push("...");
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
}

export default function ActivityLog() {
  const { pets, activities } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [petId, setPetId] = useState(searchParams.get("pet") ?? "all");
  const [cats, setCats] = useState<Category[]>([]);
  const [range, setRange] = useState("30");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [addOpen, setAddOpen] = useState(false);
  const [activityEdit, setActivityEdit] = useState<Activity | undefined>();

  useEffect(() => {
    const qp = searchParams.get("pet");
    if (qp && qp !== petId) setPetId(qp);
  }, [searchParams, petId]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setPage(1);
  }, [petId, cats, range, pageSize]);

  const updatePetId = (v: string) => {
    setPetId(v);
    if (v === "all") {
      searchParams.delete("pet");
    } else {
      searchParams.set("pet", v);
    }
    setSearchParams(searchParams, { replace: true });
  };

  const filtered = useMemo(() => {
    const cutoff = range === "all" ? 0 : Date.now() - Number(range) * 24 * 60 * 60 * 1000;
    return activities.filter((a) => {
      if (petId !== "all" && a.petId !== petId) return false;
      if (cats.length > 0 && !cats.includes(a.category)) return false;
      if (new Date(a.when).getTime() < cutoff) return false;
      return true;
    });
  }, [activities, petId, cats, range]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  const clear = () => {
    updatePetId("all");
    setCats([]);
    setRange("30");
  };

  const pageNumbers = getPageNumbers(safePage, totalPages);

  return (
    <>
      <h1 className="mb-6 font-display text-4xl font-medium text-pets">Activity Log</h1>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Button variant="secondary" onClick={() => setAddOpen(true)}>
          <ClipboardCheck />
          Log an Activity
        </Button>
        <Button variant="outline" className="border-pets text-pets hover:bg-pets/10 hover:text-pets">
          <Download />
          Download Log
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Select value={petId} onValueChange={updatePetId}>
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

        <CategoryMultiSelect value={cats} onChange={setCats} />

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

      <div className="flex flex-col gap-2.5">
        {pageItems.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground/70">No activities match.</div>
        ) : (
          pageItems.map((a) => (
            <ActivityRow key={a.id} a={a} onClick={(act) => setActivityEdit(act)} />
          ))
        )}
      </div>

      <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm text-muted-foreground">
        <div />
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={safePage === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          {pageNumbers.map((p, i) =>
            p === "..." ? (
              <span key={`e${i}`} className="px-2 text-muted-foreground">
                …
              </span>
            ) : (
              <Button
                key={p}
                size="sm"
                variant={p === safePage ? "default" : "ghost"}
                className={
                  p === safePage
                    ? "bg-pets text-primary-foreground hover:bg-pets/90"
                    : ""
                }
                onClick={() => setPage(p)}
              >
                {p}
              </Button>
            ),
          )}
          <Button
            variant="ghost"
            size="sm"
            disabled={safePage === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
        <div className="justify-self-end">
          <Select
            value={String(pageSize)}
            onValueChange={(v) => setPageSize(Number(v))}
          >
            <SelectTrigger className="w-[120px] bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 Items</SelectItem>
              <SelectItem value="25">25 Items</SelectItem>
              <SelectItem value="50">50 Items</SelectItem>
              <SelectItem value="100">100 Items</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <AddActivityModal open={addOpen} onOpenChange={setAddOpen} />
      <AddActivityModal
        open={Boolean(activityEdit)}
        onOpenChange={(o) => !o && setActivityEdit(undefined)}
        activity={activityEdit}
      />
    </>
  );
}
