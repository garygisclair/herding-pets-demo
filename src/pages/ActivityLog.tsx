import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ClipboardCheck, FileText } from "lucide-react";
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
import AddActivityModal from "@/components/AddActivityModal";

const CAT_DOT: Record<Category | "all", string> = {
  all: "",
  bathroom: "bg-bathroom",
  feeding: "bg-feeding",
  health: "bg-health",
  other: "bg-habits",
};

export default function ActivityLog() {
  const { pets, activities } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [petId, setPetId] = useState(searchParams.get("pet") ?? "all");
  const [cat, setCat] = useState<Category | "all">("all");
  const [range, setRange] = useState("30");
  const [addOpen, setAddOpen] = useState(false);
  const [activityEdit, setActivityEdit] = useState<Activity | undefined>();

  useEffect(() => {
    const qp = searchParams.get("pet");
    if (qp && qp !== petId) setPetId(qp);
  }, [searchParams, petId]);

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

  const clear = () => {
    updatePetId("all");
    setCat("all");
    setRange("30");
  };

  return (
    <>
      <h1 className="mb-6 font-display text-4xl font-medium text-pets">Activity Log</h1>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Button variant="secondary" onClick={() => setAddOpen(true)}>
          <ClipboardCheck />
          Log an Activity
        </Button>
        <Button variant="outline" className="border-pets text-pets hover:bg-pets/10 hover:text-pets">
          <FileText />
          View Reports
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

        <Select value={cat} onValueChange={(v) => setCat(v as Category | "all")}>
          <SelectTrigger className="w-[180px] bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {(["bathroom", "feeding", "health", "other"] as Category[]).map((c) => (
              <SelectItem key={c} value={c}>
                <span className="flex items-center gap-2 capitalize">
                  <span className={`inline-block size-2.5 rounded-full ${CAT_DOT[c]}`} />
                  {c}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="w-[160px] bg-card">
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
        {filtered.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground/70">No activities match.</div>
        ) : (
          filtered.map((a) => (
            <ActivityRow key={a.id} a={a} onClick={(act) => setActivityEdit(act)} />
          ))
        )}
      </div>

      <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Button variant="ghost" size="sm" disabled>
          Previous
        </Button>
        <Button size="sm" className="bg-pets text-primary-foreground hover:bg-pets/90">
          1
        </Button>
        <Button variant="ghost" size="sm" disabled>
          Next
        </Button>
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
