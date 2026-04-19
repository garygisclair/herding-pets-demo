import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Category = "bathroom" | "feeding" | "health" | "other";

export type Pet = {
  id: string;
  name: string;
  nickname?: string;
  sex?: "Male" | "Female" | "";
  breed?: string;
  colors?: string;
  vetName?: string;
  vetPhone?: string;
  notes?: string;
  initials: string;
  photo?: string;
};

export type Activity = {
  id: string;
  petId: string;
  category: Category;
  subtype: string;
  poopScore?: number;
  poopNotes?: string;
  peeNotes?: string;
  painScore?: number;
  dosage?: string;
  unit?: string;
  when: string;
  notes?: string;
};

type State = {
  pets: Pet[];
  activities: Activity[];
  customTypes: Record<Category, string[]>;
  addPet: (p: Omit<Pet, "id" | "initials">) => Pet;
  updatePet: (id: string, patch: Omit<Pet, "id" | "initials">) => void;
  deletePet: (id: string) => void;
  addActivity: (a: Omit<Activity, "id">) => Activity;
  updateActivity: (id: string, patch: Omit<Activity, "id">) => void;
  deleteActivity: (id: string) => void;
  addCustomType: (category: Category, value: string) => void;
};

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("") || "?";

const nowIso = () => new Date().toISOString();
const daysAgo = (n: number, hour = 21, min = 30) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, min, 0, 0);
  return d.toISOString();
};

/**
 * Generates a realistic 30-day activity history for the seed pets.
 * Patterns ported from herding-cats `seed-theo.sql`:
 *   Theo — twice-daily kibble, wet food every other day, occasional tuna treat,
 *          3× pee + most-day poo + occasional "both", daily probiotic + vitamin
 *          every 3rd day, daily grooming + frequent play + occasional scratching.
 *   Wally — lighter pattern: 2× feeding, 2× pee + every-other-day poo, weekly
 *           vitamin, periodic grooming.
 *
 * Returns activities newest-first to match the reducer's `[act, ...curr]` order.
 */
function generateSeedActivities(): Activity[] {
  const out: Activity[] = [];
  let idCounter = 0;
  const nextId = () => `s${++idCounter}`;

  const push = (a: Omit<Activity, "id">) => out.push({ ...a, id: nextId() });

  // Deterministic pseudo-random jitter so reloads stay consistent but times
  // look organic (no perfect horizontal banding in the timeline plot).
  // Returns a minute offset in [-spread, +spread].
  const jitter = (seed: number, spread: number) => {
    const x = (seed * 9301 + 49297) % 233280;
    return Math.round((x / 233280 - 0.5) * 2 * spread);
  };

  for (let n = 29; n >= 0; n--) {
    let slot = 0;
    const j = (spread: number) => jitter(n * 100 + ++slot, spread);

    // ── Theo (p1) ───────────────────────────────────────────────────
    // Feeding — kibble drifts ±60 min, wet food / treats wider
    push({ petId: "p1", category: "feeding", subtype: "Kibble", dosage: "1/4", unit: "cup", when: daysAgo(n, 7, 30 + j(60)) });
    push({ petId: "p1", category: "feeding", subtype: "Kibble", dosage: "1/4", unit: "cup", when: daysAgo(n, 19, 30 + j(60)) });
    if (n % 2 === 0) {
      push({ petId: "p1", category: "feeding", subtype: "Wet food", dosage: "1", unit: "pouch", when: daysAgo(n, 12, 30 + j(120)) });
    }
    if (n % 5 === 0) {
      push({ petId: "p1", category: "feeding", subtype: "Tuna", dosage: "1", unit: "tbsp", notes: "treat after play", when: daysAgo(n, 15, 0 + j(150)) });
    }

    // Bathroom — pets are unpredictable (±180 min)
    push({ petId: "p1", category: "bathroom", subtype: "Pee", when: daysAgo(n, 6, 45 + j(150)) });
    push({ petId: "p1", category: "bathroom", subtype: "Pee", when: daysAgo(n, 13, 15 + j(180)) });
    push({ petId: "p1", category: "bathroom", subtype: "Pee", when: daysAgo(n, 21, 0 + j(180)) });
    if (n % 3 !== 0) {
      const poopScore = n % 7 === 0 ? 5 : n % 11 === 0 ? 2 : 4;
      push({ petId: "p1", category: "bathroom", subtype: "Poo", poopScore, when: daysAgo(n, 8, 30 + j(180)) });
    }
    if (n % 6 === 0) {
      push({ petId: "p1", category: "bathroom", subtype: "Both", poopScore: 4, poopNotes: "regular", when: daysAgo(n, 17, 45 + j(180)) });
    }

    // Health — probiotic fairly scheduled, vitamin more variable
    push({ petId: "p1", category: "health", subtype: "Probiotic", dosage: "1.00 capsule", when: daysAgo(n, 7, 45 + j(30)) });
    if (n % 3 === 0) {
      push({ petId: "p1", category: "health", subtype: "Vitamin", dosage: "1.00 tablet", when: daysAgo(n, 19, 45 + j(60)) });
    }

    // Habits — wide spread (±150-180 min)
    push({ petId: "p1", category: "other", subtype: "Grooming", when: daysAgo(n, 9, 0 + j(150)) });
    if (n % 2 === 0) {
      push({ petId: "p1", category: "other", subtype: "Playing", notes: "wand toy", when: daysAgo(n, 20, 15 + j(120)) });
    }
    if (n % 3 === 1) {
      push({ petId: "p1", category: "other", subtype: "Playing", notes: "laser pointer", when: daysAgo(n, 16, 0 + j(180)) });
    }
    if (n % 4 === 0) {
      push({ petId: "p1", category: "other", subtype: "Scratching", notes: "scratched post", when: daysAgo(n, 11, 30 + j(180)) });
    }

    // ── Wally (p2) — lighter pattern ────────────────────────────────
    push({ petId: "p2", category: "feeding", subtype: "Kibble", dosage: "1/3", unit: "cup", when: daysAgo(n, 8, 0 + j(60)) });
    push({ petId: "p2", category: "feeding", subtype: "Kibble", dosage: "1/3", unit: "cup", when: daysAgo(n, 20, 0 + j(60)) });
    if (n % 3 === 0) {
      push({ petId: "p2", category: "feeding", subtype: "Tuna", dosage: "1", unit: "tbsp", when: daysAgo(n, 14, 30 + j(120)) });
    }

    push({ petId: "p2", category: "bathroom", subtype: "Pee", when: daysAgo(n, 7, 30 + j(150)) });
    push({ petId: "p2", category: "bathroom", subtype: "Pee", when: daysAgo(n, 22, 0 + j(180)) });
    if (n % 2 === 1) {
      push({ petId: "p2", category: "bathroom", subtype: "Poo", poopScore: 4, when: daysAgo(n, 10, 15 + j(180)) });
    }

    if (n % 7 === 2) {
      push({ petId: "p2", category: "health", subtype: "Vitamin", dosage: "0.5 tablet", when: daysAgo(n, 9, 30 + j(45)) });
    }

    if (n % 4 === 2) {
      push({ petId: "p2", category: "other", subtype: "Grooming", when: daysAgo(n, 11, 0 + j(180)) });
    }
  }

  // Sort newest first
  return out.sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime());
}

const seedPets: Pet[] = [
  {
    id: "p1",
    name: "Theodore Bartholomew",
    nickname: "Theo",
    sex: "Male",
    breed: "Siamese",
    colors: "White Brown",
    vetName: "Dr. Pepper's Medical Wonders",
    vetPhone: "123-456-7890",
    notes: "He got some 'splainin to do",
    initials: "TB",
    photo: `${import.meta.env.BASE_URL}avatars/theo.png`,
  },
  {
    id: "p2",
    name: "Walter Roy",
    nickname: "Wally",
    sex: "Male",
    colors: "Grey",
    initials: "WR",
    photo: `${import.meta.env.BASE_URL}avatars/wally.png`,
  },
];

const seedActivities: Activity[] = generateSeedActivities();

const StoreCtx = createContext<State | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [pets, setPets] = useState<Pet[]>(seedPets);
  const [activities, setActivities] = useState<Activity[]>(seedActivities);
  const [customTypes, setCustomTypes] = useState<Record<Category, string[]>>({
    feeding: [],
    bathroom: [],
    health: [],
    other: [],
  });

  const value = useMemo<State>(
    () => ({
      pets,
      activities,
      customTypes,
      addCustomType: (category, raw) => {
        const v = raw.trim();
        if (!v) return;
        setCustomTypes((curr) => {
          if (curr[category].some((t) => t.toLowerCase() === v.toLowerCase())) {
            return curr;
          }
          return { ...curr, [category]: [...curr[category], v] };
        });
      },
      addPet: (p) => {
        const pet: Pet = {
          ...p,
          id: `p${Date.now()}`,
          initials: initials(p.name),
        };
        setPets((curr) => [...curr, pet]);
        return pet;
      },
      updatePet: (id, patch) => {
        setPets((curr) =>
          curr.map((pet) =>
            pet.id === id ? { ...pet, ...patch, initials: initials(patch.name) } : pet,
          ),
        );
      },
      deletePet: (id) => {
        setPets((curr) => curr.filter((p) => p.id !== id));
        setActivities((curr) => curr.filter((a) => a.petId !== id));
      },
      addActivity: (a) => {
        const act: Activity = { ...a, id: `a${Date.now()}`, when: a.when || nowIso() };
        setActivities((curr) => [act, ...curr]);
        return act;
      },
      updateActivity: (id, patch) => {
        setActivities((curr) =>
          curr.map((a) => (a.id === id ? { ...a, ...patch } : a)),
        );
      },
      deleteActivity: (id) => {
        setActivities((curr) => curr.filter((a) => a.id !== id));
      },
    }),
    [pets, activities, customTypes],
  );

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

export function formatWhen(iso: string) {
  const d = new Date(iso);
  const date = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
  const hr = d.getHours();
  const hr12 = ((hr + 11) % 12) + 1;
  const ampm = hr >= 12 ? "PM" : "AM";
  const min = d.getMinutes().toString().padStart(2, "0");
  return `${date} at ${hr12.toString().padStart(2, "0")}:${min} ${ampm}`;
}
