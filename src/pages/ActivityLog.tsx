import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ClipboardCheck, Download, LayoutList, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStore, type Activity, type Category } from "@/store";
import ActivityRow from "@/components/ActivityRow";
import ActivityTable from "@/components/ActivityTable";
import AddActivityModal from "@/components/AddActivityModal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ViewMode = "cards" | "table";
const VIEW_STORAGE_KEY = "herding-pets-activity-view";

type CatFilter = "all" | Category;

const CAT_OPTIONS: { value: CatFilter; label: string }[] = [
  { value: "all", label: "All categories" },
  { value: "feeding", label: "Feeding" },
  { value: "bathroom", label: "Bathroom" },
  { value: "health", label: "Health" },
  { value: "other", label: "Habits" },
];

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
  const { pets, activities, deleteActivity } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [petId, setPetId] = useState(searchParams.get("pet") ?? "all");
  const [cat, setCat] = useState<CatFilter>("all");
  const [range, setRange] = useState("30");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [addOpen, setAddOpen] = useState(false);
  const [activityEdit, setActivityEdit] = useState<Activity | undefined>();
  const [activityDuplicate, setActivityDuplicate] = useState<Activity | undefined>();
  const [activityDelete, setActivityDelete] = useState<Activity | undefined>();
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window === "undefined") return "cards";
    return localStorage.getItem(VIEW_STORAGE_KEY) === "table" ? "table" : "cards";
  });

  useEffect(() => {
    localStorage.setItem(VIEW_STORAGE_KEY, viewMode);
  }, [viewMode]);

  useEffect(() => {
    const qp = searchParams.get("pet");
    if (qp && qp !== petId) setPetId(qp);
  }, [searchParams, petId]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setPage(1);
  }, [petId, cat, range, pageSize]);

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
      if (cat !== "all" && a.category !== cat) return false;
      if (new Date(a.when).getTime() < cutoff) return false;
      return true;
    });
  }, [activities, petId, cat, range]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  const clear = () => {
    updatePetId("all");
    setCat("all");
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

      <div className="mb-3 text-sm text-muted-foreground">
        {filtered.length === 0
          ? "No results"
          : `Showing ${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, filtered.length)} of ${filtered.length} ${filtered.length === 1 ? "activity" : "activities"}`}
      </div>

      {pageItems.length === 0 ? (
        <div className="py-10 text-center text-muted-foreground/70">No activities match.</div>
      ) : viewMode === "table" ? (
        <ActivityTable
          activities={pageItems}
          pets={pets}
          onEdit={(act) => setActivityEdit(act)}
          onCopy={(act) => setActivityDuplicate(act)}
          onDelete={(act) => setActivityDelete(act)}
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {pageItems.map((a) => (
            <ActivityRow key={a.id} a={a} onClick={(act) => setActivityEdit(act)} />
          ))}
        </div>
      )}

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
      <AddActivityModal
        open={Boolean(activityDuplicate)}
        onOpenChange={(o) => !o && setActivityDuplicate(undefined)}
        duplicateFrom={activityDuplicate}
      />

      <Dialog
        open={Boolean(activityDelete)}
        onOpenChange={(o) => !o && setActivityDelete(undefined)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this activity?</DialogTitle>
            <DialogDescription>
              {activityDelete && (
                <>
                  This will remove the{" "}
                  <span className="font-medium text-foreground capitalize">
                    {activityDelete.subtype}
                  </span>{" "}
                  entry. This action cannot be undone.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActivityDelete(undefined)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (activityDelete) deleteActivity(activityDelete.id);
                setActivityDelete(undefined);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <button
        type="button"
        onClick={() => setViewMode((m) => (m === "cards" ? "table" : "cards"))}
        className="fixed bottom-6 right-6 z-30 flex size-14 items-center justify-center rounded-full bg-pets text-[#1a1a1a] shadow-lg shadow-black/30 transition-[transform,background-color] hover:bg-pets/90 active:scale-95"
        aria-label={viewMode === "cards" ? "Switch to table view" : "Switch to card view"}
        title={viewMode === "cards" ? "Switch to table view" : "Switch to card view"}
      >
        {viewMode === "cards" ? (
          <Table2 className="size-5" />
        ) : (
          <LayoutList className="size-5" />
        )}
      </button>
    </>
  );
}
