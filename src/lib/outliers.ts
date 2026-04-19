import type { Activity } from "@/store";

/**
 * Flags "loner" activities: hour-of-day > 2.5 h from the nearest same-subtype
 * neighbor. Per-subtype nearest-neighbor matching handles bimodal schedules
 * (e.g. morning + evening feedings) without the false-positives a global
 * IQR/σ method would produce.
 *
 * Returns the Set of activity ids considered off-schedule.
 */
export function findOutlierIds(activities: Activity[]): Set<string> {
  const ids = new Set<string>();
  const hourOf = (a: Activity) => {
    const d = new Date(a.when);
    return d.getHours() + d.getMinutes() / 60;
  };
  const bySubtype = new Map<string, Activity[]>();
  activities.forEach((a) => {
    const arr = bySubtype.get(a.subtype) ?? [];
    arr.push(a);
    bySubtype.set(a.subtype, arr);
  });
  bySubtype.forEach((arr) => {
    if (arr.length < 4) return;
    arr.forEach((a) => {
      const h = hourOf(a);
      let nearest = Infinity;
      arr.forEach((b) => {
        if (b.id === a.id) return;
        const d = Math.abs(hourOf(b) - h);
        if (d < nearest) nearest = d;
      });
      if (nearest > 2.5) ids.add(a.id);
    });
  });
  return ids;
}
