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
  addActivity: (a: Omit<Activity, "id">) => Activity;
  updateActivity: (id: string, patch: Omit<Activity, "id">) => void;
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
    photo: "/avatars/theo.png",
  },
  {
    id: "p2",
    name: "Walter Roy",
    nickname: "Wally",
    sex: "Male",
    colors: "Grey",
    initials: "WR",
    photo: "/avatars/wally.png",
  },
];

const seedActivities: Activity[] = [
  {
    id: "a1",
    petId: "p1",
    category: "bathroom",
    subtype: "Pee",
    when: daysAgo(0, 21, 30),
  },
  {
    id: "a2",
    petId: "p1",
    category: "bathroom",
    subtype: "Pee",
    when: daysAgo(0, 19, 30),
    peeNotes: "Some description of the pee details here",
  },
  {
    id: "a3",
    petId: "p1",
    category: "bathroom",
    subtype: "Both",
    poopScore: 3,
    when: daysAgo(1, 21, 30),
    poopNotes: "Some description of the poop details here",
    peeNotes: "Some description of the pee details here",
  },
  {
    id: "a4",
    petId: "p1",
    category: "bathroom",
    subtype: "Pee",
    when: daysAgo(1, 21, 0),
  },
  {
    id: "a5",
    petId: "p1",
    category: "health",
    subtype: "vitamin",
    dosage: "1.00 tablet",
    when: daysAgo(2, 19, 45),
  },
  {
    id: "a6",
    petId: "p2",
    category: "feeding",
    subtype: "Tuna",
    when: daysAgo(0, 9, 15),
    notes: "Half can",
    dosage: "0.5",
    unit: "Can",
  },
];

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
