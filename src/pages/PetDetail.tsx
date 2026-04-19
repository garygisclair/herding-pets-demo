import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ClipboardCheck, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore, type Activity } from "@/store";
import ActivityRow from "@/components/ActivityRow";
import AddActivityModal from "@/components/AddActivityModal";
import AddPetModal from "@/components/AddPetModal";
import PetDetailCard from "@/components/PetDetailCard";

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

      <PetDetailCard pet={pet} onEditInfo={() => setEditOpen(true)} />

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
      <AddPetModal
        open={editOpen}
        onOpenChange={setEditOpen}
        pet={pet}
        onDeleted={() => nav("/")}
      />
    </>
  );
}
