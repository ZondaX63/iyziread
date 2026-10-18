import { createFileRoute, Link } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { useMemo } from "react";
import { format, startOfWeek, addDays } from "date-fns";
import { BookOpen, Check, Clock, Flame, Gauge, Play, Type } from "lucide-react";
import { db } from "@/lib/db";
import { readingStreak } from "@/lib/stats";
import { useSettings } from "@/hooks/use-settings";
import { CountUp } from "@/components/CountUp";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Iyzi Reader — Your daily reading streak" },
      { name: "description", content: "Track your reading streak, daily goal, words read and speed. Offline speed reading." },
      { property: "og:title", content: "Iyzi Reader — Your daily reading streak" },
      { property: "og:description", content: "Track your reading streak, daily goal, words read and speed." },
    ],
  }),
  component: HomePage,
});

function messageFor(streak: number, goalDone: boolean) {
  if (goalDone) return "Daily goal crushed. Your brain thanks you.";
  if (streak === 0) return "Start a streak today — just a few minutes counts.";
  if (streak < 3) return "Nice start! Keep the flame alive today.";
  if (streak < 7) return "You're building a real habit. Don't break it!";
  return "Unstoppable. Legendary reading streak!";
}

function HomePage() {
  const s = useSettings();
  const sessions = useLiveQuery(() => db.sessions.toArray(), []) ?? [];
  const lastBook = useLiveQuery(async () => {
    const b = await db.books.orderBy("lastOpenedAt").last();
    return b ?? (await db.books.orderBy("addedAt").first());
  }, []);

  const d = useMemo(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    const todaySessions = sessions.filter((x) => x.date === today);
    const todayMin = todaySessions.reduce((a, x) => a + x.durationMs, 0) / 60000;
    const todayWords = todaySessions.reduce((a, x) => a + x.words, 0);
    const totalWords = sessions.reduce((a, x) => a + x.words, 0);
    const totalMs = sessions.reduce((a, x) => a + x.durationMs, 0);
    const days = new Set(sessions.map((x) => x.date));
    const week = Array.from({ length: 7 }, (_, i) => {
      const day = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), i);
      const key = format(day, "yyyy-MM-dd");
      return { label: format(day, "EEEEE"), done: days.has(key), today: key === today };
    });
    const best = sessions.reduce((m, x) => Math.max(m, x.wpm), 0);
    return {
      todayMin, todayWords, totalWords, totalMin: totalMs / 60000,
      avg: totalMs ? Math.round(totalWords / (totalMs / 60000)) : 0,
      best, week, streak: readingStreak([...days]),
    };
  }, [sessions]);

  const goalPct = Math.min(1, d.todayMin / s.dailyGoalMin);
  const R = 52;
  const C = 2 * Math.PI * R;

  return (
    <div className="space-y-6">
      {/* Streak hero */}
      <section className="animate-fade-up relative overflow-hidden rounded-3xl border bg-card p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:items-center">
          <div className="flex flex-col items-center">
            <Flame className={cn("h-20 w-20 text-primary", d.streak > 0 ? "animate-flicker" : "opacity-40")} strokeWidth={1.6} />
            <p className="font-display text-5xl font-bold text-primary animate-pop">
              <CountUp value={d.streak} duration={800} />
            </p>
            <p className="text-sm uppercase tracking-widest text-muted-foreground">day streak</p>
          </div>
          <div className="w-full flex-1 space-y-4">
            <h1 className="text-center text-2xl font-bold sm:text-left sm:text-3xl">{messageFor(d.streak, goalPct >= 1)}</h1>
            <div className="grid grid-cols-7 gap-2">
              {d.week.map((w, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <span className={cn("text-xs", w.today ? "font-bold text-primary" : "text-muted-foreground")}>{w.label}</span>
                  <span
                    style={{ animationDelay: `${200 + i * 70}ms` }}
                    className={cn(
                      "grid h-9 w-9 place-items-center rounded-full border-2 animate-pop",
                      w.done ? "border-primary bg-primary text-primary-foreground glow" : w.today ? "border-primary/60 border-dashed" : "border-border",
                    )}
                  >
                    {w.done && <Check className="h-4 w-4" strokeWidth={3} />}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-[auto_1fr]">
        {/* Goal ring */}
        <section className="animate-fade-up flex items-center gap-5 rounded-2xl border bg-card p-5" style={{ animationDelay: "100ms" }}>
          <svg viewBox="0 0 120 120" className="h-28 w-28 shrink-0 -rotate-90">
            <circle cx="60" cy="60" r={R} fill="none" strokeWidth="10" className="stroke-muted" />
            <circle
              cx="60" cy="60" r={R} fill="none" strokeWidth="10" strokeLinecap="round"
              className="stroke-primary transition-[stroke-dashoffset] duration-[1400ms] ease-out"
              style={{ strokeDasharray: C, strokeDashoffset: C * (1 - goalPct), filter: "drop-shadow(0 0 6px var(--glow))" }}
            />
          </svg>
          <div>
            <p className="text-sm text-muted-foreground">Today's goal</p>
            <p className="font-display text-3xl font-bold">
              <CountUp value={d.todayMin} decimals={0} /> <span className="text-lg text-muted-foreground">/ {s.dailyGoalMin} min</span>
            </p>
            <p className="text-sm text-primary">+<CountUp value={d.todayWords} /> words today</p>
          </div>
        </section>

        {/* Continue reading */}
        {lastBook && (
          <Link
            to="/reader/$bookId"
            params={{ bookId: lastBook.id }}
            className="animate-fade-up group flex items-center gap-4 rounded-2xl border bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:glow"
            style={{ animationDelay: "180ms" }}
          >
            <div className="grid h-16 w-12 shrink-0 place-items-center rounded-md bg-accent">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Continue reading</p>
              <p className="truncate font-display text-lg font-semibold">{lastBook.title}</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded bg-muted">
                <div className="h-full bg-primary transition-[width] duration-1000" style={{ width: `${lastBook.progress.percent * 100}%` }} />
              </div>
            </div>
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-transform duration-300 group-hover:scale-110 glow">
              <Play className="h-5 w-5" />
            </span>
          </Link>
        )}
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { icon: Type, label: "Words read", value: d.totalWords, suffix: "" },
          { icon: Clock, label: "Minutes read", value: d.totalMin, suffix: "" },
          { icon: Gauge, label: "Average WPM", value: d.avg, suffix: "" },
          { icon: Flame, label: "Best WPM", value: d.best, suffix: "" },
        ].map(({ icon: Icon, label, value }, i) => (
          <div
            key={label}
            className="animate-fade-up rounded-2xl border bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/60"
            style={{ animationDelay: `${260 + i * 80}ms` }}
          >
            <Icon className="h-5 w-5 text-primary" />
            <p className="mt-3 font-display text-3xl font-bold"><CountUp value={value} /></p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-center">
        <Link to="/library" className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline">
          Browse your library →
        </Link>
      </div>
    </div>
  );
}
