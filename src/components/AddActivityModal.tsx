import { useEffect, useMemo, useState } from "react";
import { Check, Mic, Plus, X } from "lucide-react";
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

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultPetId?: string;
  defaultCategory?: Category;
  activity?: Activity;
};

const CATS: { value: Category; label: string; dot: string }[] = [
  { value: "feeding", label: "Feeding", dot: "bg-feeding" },
  { value: "bathroom", label: "Bathroom", dot: "bg-bathroom" },
  { value: "health", label: "Health", dot: "bg-health" },
  { value: "other", label: "Habit", dot: "bg-habits" },
];

const FOOD_TYPES = ["Kibble", "Wet food", "Treats", "Tuna", "Water"];
const BATHROOM_TYPES = ["Pee", "Poop", "Both"];
const HEALTH_TYPES = ["Vitamin", "Medication", "Vet visit", "Grooming"];
const HABIT_TYPES = ["Walk", "Play", "Training", "Sleep"];

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
}: Props) {
  const { pets, customTypes, addActivity, updateActivity, addCustomType } = useStore();
  const isEdit = Boolean(activity);

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

  useEffect(() => {
    if (!open) return;
    if (activity) {
      const { date: d, time: t } = splitWhen(activity.when);
      setPetId(activity.petId);
      setCategory(activity.category);
      setSubtype(activity.subtype);
      setDate(d);
      setTime(t);
      setServing(activity.dosage ?? "");
      setUnit(activity.unit ?? "");
      setNotes(
        activity.notes || activity.poopNotes || activity.peeNotes || "",
      );
    } else {
      if (defaultPetId) setPetId(defaultPetId);
      if (defaultCategory) setCategory(defaultCategory);
      setSubtype("");
      setServing("");
      setUnit("");
      setNotes("");
    }
  }, [open, activity, defaultPetId, defaultCategory]);

  // Reset subtype when user changes category (but not on initial load)
  useEffect(() => {
    if (!open || activity) return;
    setSubtype("");
    setAddingNew(false);
    setNewType("");
    setNewTypeError(null);
  }, [category, open, activity]);

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
    const when = new Date(`${date}T${time}`).toISOString();
    const payload: Omit<Activity, "id"> = { petId, category, subtype, when };
    if (category === "feeding") {
      payload.dosage = serving;
      payload.unit = unit;
      payload.notes = notes;
    } else if (category === "health" || category === "other") {
      payload.notes = notes;
    }
    if (isEdit && activity) {
      updateActivity(activity.id, payload);
    } else {
      addActivity(payload);
    }
    onOpenChange(false);
  };

  const showNotes = category !== "bathroom";
  const showServing = category === "feeding";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[600px] bg-[#424242] text-foreground">
        <DialogHeader>
          <DialogTitle className="text-[22px] font-semibold">
            {isEdit ? "Edit Activity" : "Add Activity"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {isEdit ? "Update this activity" : "Log a new activity for your pet"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-[18px] pt-2">
          <Select value={petId} onValueChange={setPetId}>
            <SelectTrigger className="w-full">
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

          <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
            <SelectTrigger className="w-full">
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

          <DatePicker value={date} onChange={setDate} />
          <TimePicker value={time} onChange={setTime} />

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
                  className={newTypeError ? "border-destructive" : ""}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  onClick={commitNewType}
                  aria-label="Add"
                >
                  <Check />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
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
              <SelectTrigger className="w-full">
                <SelectValue placeholder={typeFieldLabel(category)} />
              </SelectTrigger>
              <SelectContent>
                {allTypes.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
                <SelectItem value="__add_new__" className="text-pets">
                  <span className="flex items-center gap-2">
                    <Plus className="size-4" />
                    Add new…
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          )}

          {showServing && (
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Serving"
                value={serving}
                onChange={(e) => setServing(e.target.value)}
              />
              <Input
                placeholder="Unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              />
            </div>
          )}

          {showNotes && (
            <div className="relative">
              <Textarea
                placeholder="Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[100px] pr-10"
              />
              <Mic className="absolute right-3 top-3 size-4 text-muted-foreground" />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit}>{isEdit ? "Save" : "Add"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
