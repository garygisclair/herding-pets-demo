import { useEffect, useMemo, useState } from "react";
import { Check, Mic, Plus, Trash2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStore, type Activity, type Category } from "@/store";
import { DatePicker } from "@/components/DatePicker";
import { TimePicker } from "@/components/TimePicker";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultPetId?: string;
  defaultCategory?: Category;
  activity?: Activity;
  duplicateFrom?: Activity;
};

const CATS: { value: Category; label: string; dot: string }[] = [
  { value: "feeding", label: "Feeding", dot: "bg-feeding" },
  { value: "bathroom", label: "Bathroom", dot: "bg-bathroom" },
  { value: "health", label: "Health", dot: "bg-health" },
  { value: "other", label: "Habit", dot: "bg-habits" },
];

const FOOD_TYPES = ["Kibble", "Wet food", "Treats", "Tuna", "Water"];
const BATHROOM_TYPES = ["Pee", "Poop", "Both"];
const HEALTH_TYPES = ["Vitamin", "Medication", "Weight", "Pain", "Vet visit", "Grooming"];
const WEIGHT_UNITS = ["lbs", "kg"];

const PAIN_SCORES = [
  { value: 1, label: "No pain" },
  { value: 2, label: "" },
  { value: 3, label: "" },
  { value: 4, label: "" },
  { value: 5, label: "" },
  { value: 6, label: "" },
  { value: 7, label: "" },
  { value: 8, label: "" },
  { value: 9, label: "" },
  { value: 10, label: "Extremely bad" },
];
const HABIT_TYPES = ["Walk", "Play", "Training", "Sleep"];

const POOP_SCORES = [
  { value: 1, label: "Very dry logs or pellets" },
  { value: 2, label: "Logs, Firm but not hard" },
  { value: 3, label: "Log shaped with moist surface" },
  { value: 4, label: "Very moist and soggy log" },
  { value: 5, label: "Very moist distinct pile(s)" },
  { value: 6, label: "Has texture, no defined shape" },
  { value: 7, label: "Watery, some texture" },
];

function typeFieldLabel(c: Category) {
  if (c === "feeding") return "Food Type";
  if (c === "bathroom") return "Type";
  if (c === "health") return "Health Type";
  return "Habit Type";
}

function typeOptions(c: Category) {
  if (c === "feeding") return FOOD_TYPES;
  if (c === "bathroom") return BATHROOM_TYPES;
  if (c === "health") return HEALTH_TYPES;
  return HABIT_TYPES;
}

function splitWhen(iso: string) {
  const d = new Date(iso);
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return { date, time };
}

export default function AddActivityModal({
  open,
  onOpenChange,
  defaultPetId,
  defaultCategory,
  activity,
  duplicateFrom,
}: Props) {
  const { pets, customTypes, addActivity, updateActivity, deleteActivity, addCustomType } = useStore();
  const isEdit = Boolean(activity);
  const isDuplicate = Boolean(duplicateFrom);

  const [petId, setPetId] = useState(defaultPetId ?? pets[0]?.id ?? "");
  const [category, setCategory] = useState<Category>(defaultCategory ?? "feeding");
  const [subtype, setSubtype] = useState("");
  const [addingNew, setAddingNew] = useState(false);
  const [newType, setNewType] = useState("");
  const [newTypeError, setNewTypeError] = useState<string | null>(null);
  const today = new Date();
  const [date, setDate] = useState(today.toISOString().slice(0, 10));
  const [time, setTime] = useState(
    `${today.getHours().toString().padStart(2, "0")}:${today.getMinutes().toString().padStart(2, "0")}`,
  );
  const [serving, setServing] = useState("");
  const [unit, setUnit] = useState("");
  const [notes, setNotes] = useState("");
  const [poopScore, setPoopScore] = useState<string>("");
  const [painScore, setPainScore] = useState<string>("");
  const [submitted, setSubmitted] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [recording, setRecording] = useState(false);

  useEffect(() => {
    if (!open) return;
    const source = activity ?? duplicateFrom;
    if (source) {
      // For duplicate: prefill from source but reset the date/time to now
      const now = new Date();
      const { date: d, time: t } = duplicateFrom
        ? {
            date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`,
            time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
          }
        : splitWhen(source.when);
      setPetId(source.petId);
      setCategory(source.category);
      setSubtype(source.subtype);
      setDate(d);
      setTime(t);
      setServing(source.dosage ?? "");
      setUnit(source.unit ?? "");
      setNotes(source.notes || source.poopNotes || source.peeNotes || "");
      setPoopScore(source.poopScore ? String(source.poopScore) : "");
      setPainScore(source.painScore ? String(source.painScore) : "");
    } else {
      if (defaultPetId) setPetId(defaultPetId);
      if (defaultCategory) setCategory(defaultCategory);
      setSubtype("");
      setServing("");
      setUnit("");
      setNotes("");
      setPoopScore("");
      setPainScore("");
    }
    setSubmitted(false);
    setRecording(false);
  }, [open, activity, duplicateFrom, defaultPetId, defaultCategory]);

  // Reset subtype when user changes category (but not on initial load)
  useEffect(() => {
    if (!open || activity || duplicateFrom) return;
    setSubtype("");
    setAddingNew(false);
    setNewType("");
    setNewTypeError(null);
  }, [category, open, activity, duplicateFrom]);

  const allTypes = useMemo(
    () => [...typeOptions(category), ...customTypes[category]],
    [category, customTypes],
  );

  const commitNewType = () => {
    const v = newType.trim();
    if (!v) {
      setAddingNew(false);
      setNewType("");
      setNewTypeError(null);
      return;
    }
    const exists = allTypes.some((t) => t.toLowerCase() === v.toLowerCase());
    if (exists) {
      setNewTypeError("Already exists");
      return;
    }
    addCustomType(category, v);
    setSubtype(v);
    setAddingNew(false);
    setNewType("");
    setNewTypeError(null);
  };

  const cancelNewType = () => {
    setAddingNew(false);
    setNewType("");
    setNewTypeError(null);
  };

  const submit = () => {
    if (!petId) return;
    setSubmitted(true);
    if (!subtype) return;
    if (
      category === "bathroom" &&
      (subtype === "Poop" || subtype === "Both") &&
      !poopScore
    )
      return;
    if (category === "health" && subtype === "Pain" && !painScore) return;
    const when = new Date(`${date}T${time}`).toISOString();
    const payload: Omit<Activity, "id"> = { petId, category, subtype, when };
    if (category === "feeding") {
      payload.dosage = serving;
      payload.unit = unit;
      payload.notes = notes;
    } else if (category === "health" || category === "other") {
      payload.notes = notes;
      if (
        category === "health" &&
        (subtype === "Vitamin" || subtype === "Medication" || subtype === "Weight")
      ) {
        payload.dosage = serving;
        payload.unit = unit;
      }
      if (category === "health" && subtype === "Pain" && painScore) {
        payload.painScore = Number(painScore);
      }
    } else if (category === "bathroom") {
      if (subtype === "Pee") payload.peeNotes = notes;
      if (subtype === "Poop" || subtype === "Both") {
        payload.poopNotes = notes;
        if (poopScore) payload.poopScore = Number(poopScore);
      }
    }
    if (isEdit && activity) {
      updateActivity(activity.id, payload);
    } else {
      addActivity(payload);
    }
    onOpenChange(false);
  };

  const showNotes =
    category !== "bathroom" ||
    subtype === "Pee" ||
    subtype === "Poop" ||
    subtype === "Both";
  const isWeight = category === "health" && subtype === "Weight";
  const showServing =
    category === "feeding" ||
    (category === "health" &&
      (subtype === "Vitamin" || subtype === "Medication" || subtype === "Weight"));
  const servingLabel = isWeight
    ? "Weight"
    : category === "feeding"
      ? "Serving"
      : "Dosage";
  const showPoopScale =
    category === "bathroom" && (subtype === "Poop" || subtype === "Both");
  const showPainScale = category === "health" && subtype === "Pain";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[600px] bg-[#424242] text-foreground">
        <DialogHeader>
          <DialogTitle className="text-[22px] font-semibold">
            {isEdit ? "Edit Activity" : isDuplicate ? "Duplicate Activity" : "Add Activity"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {isEdit
              ? "Update this activity"
              : isDuplicate
                ? "Review and save a copy of this activity"
                : "Log a new activity for your pet"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-[18px] pt-2">
          <Select value={petId} onValueChange={setPetId}>
            <SelectTrigger className="w-full data-[size=default]:h-10 bg-input/80 dark:bg-input/80 dark:hover:bg-input/80">
              <SelectValue placeholder="Pet" />
            </SelectTrigger>
            <SelectContent>
              {pets.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DatePicker value={date} onChange={setDate} />
          <TimePicker value={time} onChange={setTime} />

          <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
            <SelectTrigger className="w-full data-[size=default]:h-10 bg-input/80 dark:bg-input/80 dark:hover:bg-input/80">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATS.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  <span className="flex items-center gap-2">
                    <span className={`inline-block size-2.5 rounded-full ${c.dot}`} />
                    {c.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {addingNew ? (
            <div>
              <div className="flex gap-2">
                <Input
                  autoFocus
                  value={newType}
                  onChange={(e) => {
                    setNewType(e.target.value);
                    if (newTypeError) setNewTypeError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      commitNewType();
                    } else if (e.key === "Escape") {
                      e.preventDefault();
                      cancelNewType();
                    }
                  }}
                  placeholder={`New ${typeFieldLabel(category).toLowerCase()}`}
                  className={`h-10 bg-input/80 dark:bg-input/80 ${newTypeError ? "border-destructive" : ""}`}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="size-10"
                  onClick={commitNewType}
                  aria-label="Add"
                >
                  <Check />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="size-10"
                  onClick={cancelNewType}
                  aria-label="Cancel"
                >
                  <X />
                </Button>
              </div>
              {newTypeError && (
                <p className="mt-1.5 text-xs text-destructive">{newTypeError}</p>
              )}
            </div>
          ) : (
            <div>
              <Select
                value={subtype}
                onValueChange={(v) => {
                  if (v === "__add_new__") {
                    setAddingNew(true);
                    return;
                  }
                  setSubtype(v);
                }}
              >
                <SelectTrigger
                  aria-invalid={submitted && !subtype}
                  className="w-full data-[size=default]:h-10 bg-input/80 dark:bg-input/80 dark:hover:bg-input/80"
                >
                  <SelectValue placeholder={typeFieldLabel(category)} />
                </SelectTrigger>
                <SelectContent>
                  {allTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                  {category !== "bathroom" && (
                    <SelectItem value="__add_new__" className="text-pets">
                      <span className="flex items-center gap-2">
                        <Plus className="size-4" />
                        Add new…
                      </span>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {submitted && !subtype && (
                <p className="mt-1.5 text-xs text-destructive">
                  {typeFieldLabel(category)} is required
                </p>
              )}
            </div>
          )}

          {showServing && (
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder={servingLabel}
                value={serving}
                onChange={(e) => setServing(e.target.value)}
                inputMode={isWeight ? "decimal" : undefined}
                className="h-10 bg-input/80 dark:bg-input/80"
              />
              {isWeight ? (
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger className="w-full data-[size=default]:h-10 bg-input/80 dark:bg-input/80 dark:hover:bg-input/80">
                    <SelectValue placeholder="Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {WEIGHT_UNITS.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  placeholder="Unit"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="h-10 bg-input/80 dark:bg-input/80"
                />
              )}
            </div>
          )}

          {showPoopScale && (
            <div>
              <Select value={poopScore} onValueChange={setPoopScore}>
                <SelectTrigger
                  aria-invalid={submitted && !poopScore}
                  className="w-full data-[size=default]:h-10 bg-input/80 dark:bg-input/80 dark:hover:bg-input/80"
                >
                  <SelectValue placeholder="Poop Score" />
                </SelectTrigger>
                <SelectContent>
                  {POOP_SCORES.map((s) => (
                    <SelectItem key={s.value} value={String(s.value)}>
                      {s.value} - {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {submitted && !poopScore && (
                <p className="mt-1.5 text-xs text-destructive">
                  Poop Score is required
                </p>
              )}
            </div>
          )}

          {showPainScale && (
            <div>
              <Select value={painScore} onValueChange={setPainScore}>
                <SelectTrigger
                  aria-invalid={submitted && !painScore}
                  className="w-full data-[size=default]:h-10 bg-input/80 dark:bg-input/80 dark:hover:bg-input/80"
                >
                  <SelectValue placeholder="Pain Score" />
                </SelectTrigger>
                <SelectContent>
                  {PAIN_SCORES.map((s) => (
                    <SelectItem key={s.value} value={String(s.value)}>
                      {s.label ? `${s.value} - ${s.label}` : String(s.value)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {submitted && !painScore && (
                <p className="mt-1.5 text-xs text-destructive">
                  Pain Score is required
                </p>
              )}
            </div>
          )}

          {showNotes && (
            <div className="relative">
              <Textarea
                placeholder="Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[100px] pr-14 bg-input/80 dark:bg-input/80"
              />
              <button
                type="button"
                onClick={() => setRecording((r) => !r)}
                aria-label={recording ? "Stop voice input" : "Start voice input"}
                aria-pressed={recording}
                className={cn(
                  "absolute right-2 top-2 flex size-9 items-center justify-center rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-pets focus-visible:ring-offset-2 focus-visible:ring-offset-[#424242]",
                  recording
                    ? "bg-pets text-primary-foreground"
                    : "bg-muted-foreground/20 text-muted-foreground hover:bg-muted-foreground/30",
                )}
              >
                <Mic className="size-5" />
              </button>
            </div>
          )}
        </div>

        <DialogFooter>
          {isEdit && activity && (
            <Button
              variant="destructive"
              className="mr-auto text-primary-foreground"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 />
              Remove
            </Button>
          )}
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit}>{isEdit ? "Save" : "Add"}</Button>
        </DialogFooter>
      </DialogContent>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove this activity?</DialogTitle>
            <DialogDescription>
              {activity && (
                <>
                  Are you sure you want to remove this{" "}
                  <span className="font-medium text-foreground capitalize">
                    {activity.subtype}
                  </span>{" "}
                  entry? This action cannot be undone.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (activity) deleteActivity(activity.id);
                setConfirmDelete(false);
                onOpenChange(false);
              }}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
