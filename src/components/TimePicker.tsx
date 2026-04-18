import { useState } from "react";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type Props = {
  value: string; // HH:mm (24h)
  onChange: (v: string) => void;
  className?: string;
};

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

function parse(v: string): { hour: number; minute: number; period: "AM" | "PM" } {
  if (!v) return { hour: 12, minute: 0, period: "PM" };
  const [h, m] = v.split(":").map(Number);
  const period: "AM" | "PM" = h >= 12 ? "PM" : "AM";
  const hour = ((h + 11) % 12) + 1;
  return { hour, minute: m, period };
}

function formatDisplay(v: string) {
  if (!v) return "Pick a time";
  const { hour, minute, period } = parse(v);
  return `${hour}:${String(minute).padStart(2, "0")} ${period}`;
}

function to24h(hour: number, minute: number, period: "AM" | "PM") {
  let h = hour % 12;
  if (period === "PM") h += 12;
  return `${String(h).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function TimePicker({ value, onChange, className }: Props) {
  const [open, setOpen] = useState(false);
  const current = parse(value);

  const commit = (next: Partial<typeof current>) => {
    const merged = { ...current, ...next };
    onChange(to24h(merged.hour, merged.minute, merged.period));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-10 w-full justify-start bg-input/80 font-normal text-foreground hover:bg-input/80",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <Clock className="size-4 opacity-50" />
          {formatDisplay(value)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex h-[220px]">
          <ScrollArea className="w-16 border-r">
            <div className="flex flex-col p-2">
              {HOURS.map((h) => (
                <Button
                  key={h}
                  size="sm"
                  variant={current.hour === h ? "default" : "ghost"}
                  className="mb-1 w-full"
                  onClick={() => commit({ hour: h })}
                >
                  {h}
                </Button>
              ))}
            </div>
          </ScrollArea>
          <ScrollArea className="w-16 border-r">
            <div className="flex flex-col p-2">
              {MINUTES.map((m) => (
                <Button
                  key={m}
                  size="sm"
                  variant={current.minute === m ? "default" : "ghost"}
                  className="mb-1 w-full"
                  onClick={() => commit({ minute: m })}
                >
                  {String(m).padStart(2, "0")}
                </Button>
              ))}
            </div>
          </ScrollArea>
          <div className="flex flex-col gap-1 p-2">
            {(["AM", "PM"] as const).map((p) => (
              <Button
                key={p}
                size="sm"
                variant={current.period === p ? "default" : "ghost"}
                className="w-14"
                onClick={() => commit({ period: p })}
              >
                {p}
              </Button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
