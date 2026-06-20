import { useSyncExternalStore } from "react";
import { mockMode } from "@/lib/api";

export function MockBanner() {
  const active = useSyncExternalStore(mockMode.subscribe, () => mockMode.active);

  if (!active) return null;

  return (
    <div className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-xs font-semibold text-amber-950">
      <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-900/60" />
      Backend not connected — running on demo data
    </div>
  );
}
