import type { ReactNode } from "react";
import { Pencil } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Pet } from "@/store";

export default function PetDetailCard({
  pet,
  onEditInfo,
  actions,
}: {
  pet: Pet;
  onEditInfo?: () => void;
  actions?: ReactNode;
}) {
  return (
    <Card className="rounded-2xl px-7 py-6">
      <div className="grid grid-cols-[200px_1fr_1fr] items-start gap-x-8 gap-y-5">
        <div className={`flex justify-center ${actions ? "row-span-2" : ""}`}>
          <div className="relative size-[140px]">
            <Avatar className="size-full">
              {pet.photo && <AvatarImage src={pet.photo} alt={pet.name} />}
              <AvatarFallback className="bg-gradient-to-br from-pets to-[#5ab0a5] font-display text-5xl text-primary-foreground">
                {pet.initials}
              </AvatarFallback>
            </Avatar>
            {onEditInfo && (
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label="Edit"
                      onClick={onEditInfo}
                      className="absolute bottom-1 right-1 flex size-9 items-center justify-center rounded-full bg-health text-[#3a2a00] ring-[3px] ring-card transition-transform hover:scale-105"
                    >
                      <Pencil className="size-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Edit</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <h3 className="mb-2 text-base font-semibold text-foreground">
            Basic Information
          </h3>
          <p className="text-muted-foreground">
            Name: <span className="font-medium text-foreground">{pet.name}</span>
          </p>
          {pet.nickname && (
            <p className="text-muted-foreground">
              Nickname:{" "}
              <span className="font-medium text-foreground">{pet.nickname}</span>
            </p>
          )}
          {pet.sex && (
            <p className="text-muted-foreground">
              Sex:{" "}
              <span className="font-medium text-foreground">{pet.sex}</span>
            </p>
          )}
          {pet.breed && (
            <p className="text-muted-foreground">
              Breed:{" "}
              <span className="font-medium text-foreground">{pet.breed}</span>
            </p>
          )}
          {pet.colors && (
            <p className="text-muted-foreground">
              Colors:{" "}
              <span className="font-medium text-foreground">{pet.colors}</span>
            </p>
          )}
        </div>

        <div className="space-y-2 text-sm">
          <h3 className="mb-2 text-base font-semibold text-foreground">
            Veterinary Information
          </h3>
          <p className="text-muted-foreground">
            Vet Name:{" "}
            <span className="font-medium text-foreground">
              {pet.vetName || "—"}
            </span>
          </p>
          <p className="text-muted-foreground">
            Vet Phone:{" "}
            <span className="font-medium text-foreground">
              {pet.vetPhone || "—"}
            </span>
          </p>
          <h3 className="mb-2 mt-4 text-base font-semibold text-foreground">
            Comments
          </h3>
          <p className="text-muted-foreground">{pet.notes || "—"}</p>
        </div>
        {actions && (
          <div className="col-span-2 col-start-2">{actions}</div>
        )}
      </div>
    </Card>
  );
}
