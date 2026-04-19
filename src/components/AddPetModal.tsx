import { useEffect, useState } from "react";
import { PawPrint, Trash2, Upload } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useStore, type Pet } from "@/store";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: (p: Pet) => void;
  onDeleted?: () => void;
  pet?: Pet;
};

const EMPTY_FORM = {
  name: "",
  nickname: "",
  sex: "" as Pet["sex"] | "",
  breed: "",
  colors: "",
  vetName: "",
  vetPhone: "",
  notes: "",
};

export default function AddPetModal({ open, onOpenChange, onSaved, onDeleted, pet }: Props) {
  const { addPet, updatePet, deletePet } = useStore();
  const isEdit = Boolean(pet);
  const [form, setForm] = useState(EMPTY_FORM);
  const [defaultPet, setDefaultPet] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((s) => ({ ...s, [k]: v }));

  useEffect(() => {
    if (!open) return;
    if (pet) {
      setForm({
        name: pet.name,
        nickname: pet.nickname ?? "",
        sex: pet.sex ?? "",
        breed: pet.breed ?? "",
        colors: pet.colors ?? "",
        vetName: pet.vetName ?? "",
        vetPhone: pet.vetPhone ?? "",
        notes: pet.notes ?? "",
      });
    } else {
      setForm(EMPTY_FORM);
      setDefaultPet(false);
    }
  }, [open, pet]);

  const submit = () => {
    if (!form.name.trim()) return;
    const { sex, ...rest } = form;
    const payload = { ...rest, sex: (sex || undefined) as Pet["sex"], photo: pet?.photo };
    if (isEdit && pet) {
      updatePet(pet.id, payload);
      onSaved?.({ ...pet, ...payload });
    } else {
      const created = addPet(payload);
      onSaved?.(created);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[600px] bg-[#424242] text-foreground"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-[22px] font-semibold">
            {isEdit ? "Edit Pet" : "Add Pet"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {isEdit ? "Update your pet's details" : "Add a new pet to your profile"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center py-2">
          <div className="relative size-[130px]">
            <div className="flex size-full items-center justify-center overflow-hidden rounded-full bg-pets text-primary-foreground">
              {pet?.photo ? (
                <img src={pet.photo} alt={pet.name} className="size-full object-cover" />
              ) : (
                <PawPrint className="size-14" />
              )}
            </div>
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label="Upload photo"
                    className="absolute bottom-0 right-0 flex size-9 items-center justify-center rounded-full bg-health text-[#3a2a00] ring-[3px] ring-[#424242] transition-transform hover:scale-105"
                  >
                    <Upload className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Upload photo</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <div className="flex flex-col gap-[18px]">
          <Input placeholder="Name *" value={form.name} onChange={(e) => set("name", e.target.value)} className="bg-input/80 dark:bg-input/80" />
          <Input placeholder="Nickname" value={form.nickname} onChange={(e) => set("nickname", e.target.value)} className="bg-input/80 dark:bg-input/80" />
          <Select value={form.sex ?? ""} onValueChange={(v) => set("sex", v as Pet["sex"])}>
            <SelectTrigger className="w-full bg-input/80 dark:bg-input/80 dark:hover:bg-input/80">
              <SelectValue placeholder="Sex" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder="Breed" value={form.breed} onChange={(e) => set("breed", e.target.value)} className="bg-input/80 dark:bg-input/80" />
          <Input placeholder="Color" value={form.colors} onChange={(e) => set("colors", e.target.value)} className="bg-input/80 dark:bg-input/80" />
          <Input placeholder="Vet name" value={form.vetName} onChange={(e) => set("vetName", e.target.value)} className="bg-input/80 dark:bg-input/80" />
          <Input placeholder="Vet phone" value={form.vetPhone} onChange={(e) => set("vetPhone", e.target.value)} className="bg-input/80 dark:bg-input/80" />
          <Textarea
            placeholder="Notes"
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            className="min-h-[100px] bg-input/80 dark:bg-input/80"
          />
        </div>

        {!isEdit && (
          <div className="flex items-center gap-2">
            <Checkbox
              id="default-pet"
              checked={defaultPet}
              onCheckedChange={(v) => setDefaultPet(Boolean(v))}
            />
            <Label htmlFor="default-pet" className="text-sm text-muted-foreground">
              Default pet
            </Label>
          </div>
        )}

        <DialogFooter>
          {isEdit && pet && (
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
          <Button onClick={submit} disabled={!form.name.trim()}>
            {isEdit ? "Save" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove this pet?</DialogTitle>
            <DialogDescription>
              {pet && (
                <>
                  Are you sure you want to remove{" "}
                  <span className="font-medium text-foreground">{pet.name}</span>?
                  This will also delete all their activity records. This action cannot be undone.
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
                if (pet) deletePet(pet.id);
                setConfirmDelete(false);
                onOpenChange(false);
                onDeleted?.();
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
