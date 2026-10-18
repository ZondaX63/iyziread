import { format } from "date-fns";
import type { Session } from "./db";
import { readingStreak } from "./stats";

export interface Achievement {
  id: string;
  title: string;
  desc: string;
  unlocked: boolean;
}

/** Average WPM of the user's first sessions — their personal starting point. */
export function baselineWpm(sessions: Session[], n = 3) {
  const first = [...sessions].sort((a, b) => a.startedAt - b.startedAt).slice(0, n);
  const w = first.reduce((a, s) => a + s.words, 0);
  const ms = first.reduce((a, s) => a + s.durationMs, 0);
  return ms ? Math.round(w / (ms / 60000)) : 0;
}

export function personalBests(sessions: Session[]) {
  const byDay = new Map<string, number>();
  for (const s of sessions) byDay.set(s.date, (byDay.get(s.date) ?? 0) + s.words);
  return {
    bestWpm: sessions.filter((s) => s.durationMs >= 60000).reduce((m, s) => Math.max(m, s.wpm), 0),
    longestMin: sessions.reduce((m, s) => Math.max(m, s.durationMs), 0) / 60000,
    mostWordsDay: Math.max(0, ...byDay.values()),
  };
}

/** Achievements scale with the user's own baseline and daily goal, not absolute speeds. */
export function computeAchievements(sessions: Session[], dailyGoalMin: number): Achievement[] {
  const base = baselineWpm(sessions);
  const later = [...sessions].sort((a, b) => a.startedAt - b.startedAt).slice(3);
  const beat = (pct: number) => base > 0 && later.some((s) => s.durationMs >= 60000 && s.wpm >= base * (1 + pct));
  const minByDay = new Map<string, number>();
  for (const s of sessions) minByDay.set(s.date, (minByDay.get(s.date) ?? 0) + s.durationMs / 60000);
  const goalDays = [...minByDay.values()].filter((m) => m >= dailyGoalMin).length;
  const streak = readingStreak([...minByDay.keys()]);
  const words = sessions.reduce((a, s) => a + s.words, 0);
  const g = dailyGoalMin;
  return [
    { id: "first", title: "First steps", desc: "Finish your first reading session", unlocked: sessions.length > 0 },
    { id: "beat10", title: "Faster than you", desc: base ? `Read 1+ min at ${Math.round(base * 1.1)} WPM (+10% over your start)` : "Beat your starting speed by 10%", unlocked: beat(0.1) },
    { id: "beat25", title: "Level up", desc: base ? `Read 1+ min at ${Math.round(base * 1.25)} WPM (+25% over your start)` : "Beat your starting speed by 25%", unlocked: beat(0.25) },
    { id: "goal1", title: "Goal getter", desc: `Hit your ${g}-min daily goal`, unlocked: goalDays >= 1 },
    { id: "goal5", title: "Goal keeper", desc: `Hit your daily goal on 5 days`, unlocked: goalDays >= 5 },
    { id: "focus", title: "Deep focus", desc: `Read ${g} min in a single session`, unlocked: sessions.some((s) => s.durationMs >= g * 60000) },
    { id: "streak3", title: "Warming up", desc: "3-day streak", unlocked: streak >= 3 },
    { id: "streak7", title: "One week strong", desc: "7-day streak", unlocked: streak >= 7 },
    { id: "words5k", title: "Page turner", desc: "Read 5,000 words", unlocked: words >= 5000 },
    { id: "words25k", title: "Bookworm", desc: "Read 25,000 words", unlocked: words >= 25000 },
  ];
}

export const todayKey = () => format(new Date(), "yyyy-MM-dd");
