import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ClipboardCheck, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useStore, type Activity } from "@/store";
import ActivityRow from "@/components/ActivityRow";
import AddActivityModal from "@/components/AddActivityModal";
import AddPetModal from "@/components/AddPetModal";

export default function PetDetail() {
  const { id = "" } = useParams();
  const { pets, activities } = useStore();
  const nav = useNavigate();
  const pet = pets.find((p) => p.id === id);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [activityEdit, setActivityEdit] = useState<Activity | undefined>();

  if (!pet) {
    return (
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => nav("/")}>
          <ArrowLeft />
        </Button>
        <h1 className="font-display text-4xl text-pets">Not found</h1>
      </div>
    );
  }

  const recent = activities.filter((a) => a.petId === pet.id).slice(0, 6);

  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="size-9 rounded-full bg-white/5 hover:bg-white/10"
          onClick={() => nav("/")}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="font-display text-4xl font-medium text-pets">{pet.name}</h1>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Button variant="secondary" onClick={() => setAddOpen(true)}>
          <ClipboardCheck />
          Log an Activity
        </Button>
        <Button
          variant="outline"
          onClick={() => nav("/activity")}
          className="border-pets text-pets hover:bg-pets/10 hover:text-pets"
        >
          <FileText />
          View Logs
        </Button>
      </div>

      <Card className="rounded-2xl px-7 py-6">
        <div className="grid grid-cols-[200px_1fr_1fr] items-start gap-8">
          <div className="flex flex-col items-center gap-3">
            <Avatar className="size-[140px]">
              {pet.photo && <AvatarImage src={pet.photo} alt={pet.name} />}
              <AvatarFallback className="bg-gradient-to-br from-pets to-[#5ab0a5] font-display text-5xl text-primary-foreground">
                {pet.initials}
              </AvatarFallback>
            </Avatar>
            <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
              Edit Info
            </Button>
          </div>

          <div className="space-y-2 text-sm">
            <h3 className="mb-2 text-base font-semibold text-foreground">Basic Information</h3>
            <p className="text-muted-foreground">
              Name: <span className="font-medium text-foreground">{pet.name}</span>
            </p>
            {pet.nickname && (
              <p className="text-muted-foreground">
                Nickname: <span className="font-medium text-foreground">{pet.nickname}</span>
              </p>
            )}
            {pet.sex && (
              <p className="text-muted-foreground">
                Sex: <span className="font-medium text-foreground">{pet.sex}</span>
              </p>
            )}
            {pet.breed && (
              <p className="text-muted-foreground">
                Breed: <span className="font-medium text-foreground">{pet.breed}</span>
              </p>
            )}
            {pet.colors && (
              <p className="text-muted-foreground">
                Colors: <span className="font-medium text-foreground">{pet.colors}</span>
              </p>
            )}
          </div>

          <div className="space-y-2 text-sm">
            <h3 className="mb-2 text-base font-semibold text-foreground">Veterinary Information</h3>
            <p className="text-muted-foreground">
              Vet Name: <span className="font-medium text-foreground">{pet.vetName || "—"}</span>
            </p>
            <p className="text-muted-foreground">
              Vet Phone: <span className="font-medium text-foreground">{pet.vetPhone || "—"}</span>
            </p>
            <h3 className="mb-2 mt-4 text-base font-semibold text-foreground">Comments</h3>
            <p className="text-muted-foreground">{pet.notes || "—"}</p>
          </div>
        </div>
      </Card>

      <h2 className="my-6 text-center font-display text-[22px] text-[#e7a9a9]">Recent Activity</h2>

      <div className="flex flex-col gap-2.5">
        {recent.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground/70">No activity yet.</div>
        ) : (
          recent.map((a) => (
            <ActivityRow key={a.id} a={a} onClick={(act) => setActivityEdit(act)} />
          ))
        )}
      </div>

      <AddActivityModal open={addOpen} onOpenChange={setAddOpen} defaultPetId={pet.id} />
      <AddActivityModal
        open={Boolean(activityEdit)}
        onOpenChange={(o) => !o && setActivityEdit(undefined)}
        activity={activityEdit}
      />
      <AddPetModal open={editOpen} onOpenChange={setEditOpen} pet={pet} />
    </>
  );
}
