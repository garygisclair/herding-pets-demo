import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BriefcaseMedical,
  CirclePlus,
  ClipboardCheck,
  FileText,
  LayoutGrid,
  Rows3,
  Target,
  Toilet,
  Utensils,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useStore, type Category, type Pet } from "@/store";
import AddPetModal from "@/components/AddPetModal";
import AddActivityModal from "@/components/AddActivityModal";
import PetDetailCard from "@/components/PetDetailCard";

type PetsViewMode = "default" | "list";
const PETS_VIEW_STORAGE_KEY = "herding-pets-mypets-view";

type LucideIcon = typeof FileText;

const QUICK_LOG: { icon: LucideIcon; category: Category; color: string; label: string }[] = [
  { icon: Utensils, category: "feeding", color: "text-feeding", label: "Log feeding" },
  { icon: Toilet, category: "bathroom", color: "text-bathroom", label: "Log bathroom" },
  { icon: BriefcaseMedical, category: "health", color: "text-health", label: "Log health" },
  { icon: Target, category: "other", color: "text-habits", label: "Log tracking" },
];

type QuickLogButtonProps = {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
};

function IconAction({ label, onClick, children }: QuickLogButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          onClick={onClick}
          className="transition-transform hover:scale-110"
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export default function MyPets() {
  const { pets } = useStore();
  const nav = useNavigate();
  const [addPetOpen, setAddPetOpen] = useState(false);
  const [editPet, setEditPet] = useState<Pet | undefined>();
  const [activity, setActivity] = useState<{
    open: boolean;
    petId?: string;
    category?: Category;
  }>({ open: false });
  const [viewMode, setViewMode] = useState<PetsViewMode>(() => {
    if (typeof window === "undefined") return "default";
    return localStorage.getItem(PETS_VIEW_STORAGE_KEY) === "list"
      ? "list"
      : "default";
  });

  useEffect(() => {
    localStorage.setItem(PETS_VIEW_STORAGE_KEY, viewMode);
  }, [viewMode]);

  return (
    <>
      <h1 className="mb-6 font-display text-4xl font-medium text-pets">My Pets</h1>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Button variant="secondary" onClick={() => setActivity({ open: true })}>
          <ClipboardCheck />
          Log an Activity
        </Button>
        <div className="flex items-center gap-3">
          {viewMode === "list" && (
            <Button variant="secondary" onClick={() => setAddPetOpen(true)}>
              <CirclePlus />
              Add a Pet
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => nav("/activity")}
            className="border-pets text-pets hover:bg-pets/10 hover:text-pets"
          >
            <FileText />
            View Logs
          </Button>
        </div>
      </div>

      {viewMode === "list" ? (
        <div className="flex flex-col gap-4">
          {pets.map((p) => (
            <PetDetailCard
              key={p.id}
              pet={p}
              onEditInfo={() => setEditPet(p)}
              actions={
                <TooltipProvider delayDuration={200}>
                  <div className="flex gap-5">
                    <IconAction
                      label="View activity log"
                      onClick={() => nav(`/activity?pet=${p.id}`)}
                    >
                      <FileText className="size-[22px] text-pets" />
                    </IconAction>
                    {QUICK_LOG.map(({ icon: Icon, category, color, label }, i) => (
                      <IconAction
                        key={i}
                        label={label}
                        onClick={() =>
                          setActivity({ open: true, petId: p.id, category })
                        }
                      >
                        <Icon className={`size-[22px] ${color}`} />
                      </IconAction>
                    ))}
                  </div>
                </TooltipProvider>
              }
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {pets.map((p) => (
            <Card
              key={p.id}
              onClick={() => nav(`/pets/${p.id}`)}
              className="flex min-h-[186px] cursor-pointer flex-col gap-6 rounded-2xl px-7 py-6 outline outline-[1.5px] outline-transparent transition-colors hover:outline-pets"
            >
              <div className="flex min-h-0 flex-1 gap-4">
                <Avatar className="size-20 shrink-0">
                  {p.photo && <AvatarImage src={p.photo} alt={p.name} />}
                  <AvatarFallback className="bg-gradient-to-br from-pets to-[#5ab0a5] font-display text-2xl font-medium text-primary-foreground">
                    {p.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <h2 className="font-display text-[22px] font-medium text-foreground">{p.name}</h2>
                  <div className="mt-1 space-y-0.5 pl-2">
                    {p.nickname && (
                      <div className="text-[15px] text-muted-foreground">{p.nickname}</div>
                    )}
                    {p.breed && (
                      <div className="text-xs tracking-wide text-muted-foreground/70">
                        Breed: {p.breed}
                      </div>
                    )}
                    {p.colors && (
                      <div className="text-xs tracking-wide text-muted-foreground/70">
                        Colors: {p.colors}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <TooltipProvider delayDuration={200}>
                <div className="flex gap-5" onClick={(e) => e.stopPropagation()}>
                  <IconAction
                    label="View activity log"
                    onClick={() => nav(`/activity?pet=${p.id}`)}
                  >
                    <FileText className="size-[22px] text-pets" />
                  </IconAction>
                  {QUICK_LOG.map(({ icon: Icon, category, color, label }, i) => (
                    <IconAction
                      key={i}
                      label={label}
                      onClick={() => setActivity({ open: true, petId: p.id, category })}
                    >
                      <Icon className={`size-[22px] ${color}`} />
                    </IconAction>
                  ))}
                </div>
              </TooltipProvider>
            </Card>
          ))}

          <button
            onClick={() => setAddPetOpen(true)}
            className="flex min-h-[186px] flex-col items-center justify-center gap-3 rounded-2xl border-[1.5px] border-dashed border-muted-foreground/50 px-7 py-6 font-semibold text-muted-foreground/70 transition-colors hover:border-pets hover:text-pets"
          >
            Add a Pet
            <CirclePlus className="size-[30px] opacity-60" />
          </button>
        </div>
      )}

      <AddPetModal open={addPetOpen} onOpenChange={setAddPetOpen} />
      <AddPetModal
        open={Boolean(editPet)}
        onOpenChange={(o) => !o && setEditPet(undefined)}
        pet={editPet}
      />
      <AddActivityModal
        open={activity.open}
        onOpenChange={(open) => setActivity((s) => ({ ...s, open }))}
        defaultPetId={activity.petId}
        defaultCategory={activity.category}
      />

      <button
        type="button"
        onClick={() =>
          setViewMode((m) => (m === "default" ? "list" : "default"))
        }
        className="fixed bottom-6 right-6 z-30 flex size-14 items-center justify-center rounded-full bg-pets text-[#1a1a1a] shadow-lg shadow-black/30 transition-[transform,background-color] hover:bg-pets/90 active:scale-95"
        aria-label={
          viewMode === "default"
            ? "Switch to list view"
            : "Switch to default view"
        }
        title={
          viewMode === "default"
            ? "Switch to list view"
            : "Switch to default view"
        }
      >
        {viewMode === "default" ? (
          <Rows3 className="size-5" />
        ) : (
          <LayoutGrid className="size-5" />
        )}
      </button>
    </>
  );
}
