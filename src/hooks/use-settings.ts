import { useLiveQuery } from "dexie-react-hooks";
import { db, DEFAULT_SETTINGS, type Settings } from "@/lib/db";

export function useSettings(): Settings {
  const s = useLiveQuery(() => db.settings.get("app"), []);
  return { ...DEFAULT_SETTINGS, ...(s ?? {}) };
}
