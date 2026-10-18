import { createFileRoute } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { useMemo } from "react";
import { format, subDays } from "date-fns";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { db } from "@/lib/db";
import { readingStreak } from "@/lib/stats";
import { useSettings } from "@/hooks/use-settings";
import { Progress } from "@/components/ui/progress";
import { Flame, Target } from "lucide-react";

export const Route = createFileRoute("/stats")({
  head: () => ({
    meta: [
      { title: "Reading Stats — Iyzi Reader" },
      { name: "description", content: "Daily reading time, speed progression and total words read." },
      { property: "og:title", content: "Reading Stats — Iyzi Reader" },
      { property: "og:description", content: "Daily reading time, speed progression and total words read." },
    ],
  }),
  component: StatsPage,
});

const tip = { contentStyle: { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--foreground)" } };

function StatsPage() {
  const settings = useSettings();
  const sessions = useLiveQuery(() => db.sessions.orderBy("id").toArray(), []) ?? [];
  const { daily, wpm, totalWords, totalMin, avg } = useMemo(() => {
    const days = Array.from({ length: 14 }, (_, i) => format(subDays(new Date(), 13 - i), "yyyy-MM-dd"));
    const daily = days.map((d) => ({
      day: format(new Date(d + "T00:00"), "MMM d"),
      minutes: +(sessions.filter((s) => s.date === d).reduce((a, s) => a + s.durationMs, 0) / 60000).toFixed(1),
    }));
    const wpm = sessions.slice(-30).map((s, i) => ({ n: i + 1, wpm: s.wpm }));
    const totalWords = sessions.reduce((a, s) => a + s.words, 0);
    const totalMs = sessions.reduce((a, s) => a + s.durationMs, 0);
    return { daily, wpm, totalWords, totalMin: Math.round(totalMs / 60000), avg: totalMs ? Math.round(totalWords / (totalMs / 60000)) : 0 };
  }, [sessions]);

  const todayKey = format(new Date(), "yyyy-MM-dd");
  const todayMin = sessions.filter((x) => x.date === todayKey).reduce((a, x) => a + x.durationMs, 0) / 60000;
  const goal = settings.dailyGoalMin;
  const streak = readingStreak(sessions.map((x) => x.date));
  const cards = [
    { label: "Total words read", value: totalWords.toLocaleString() },
    { label: "Average speed", value: `${avg} WPM` },
    { label: "Time reading", value: `${totalMin} min` },
    { label: "Sessions", value: sessions.length },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Stats</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 text-sm text-muted-foreground"><Target className="h-4 w-4 text-primary" /> Today's goal</p>
            <p className="text-sm text-muted-foreground">{Math.floor(todayMin)} / {goal} min</p>
          </div>
          <Progress value={Math.min(100, (todayMin / goal) * 100)} className="mt-3 h-2" />
          <p className="mt-2 text-sm">{todayMin >= goal ? "Goal reached — nice work!" : `${Math.ceil(goal - todayMin)} min to go`}</p>
        </div>
        <div className="flex items-center gap-4 rounded-xl border bg-card p-5">
          <Flame className="h-10 w-10 shrink-0 text-primary" />
          <div>
            <p className="font-display text-3xl font-bold text-primary">{streak} day{streak === 1 ? "" : "s"}</p>
            <p className="text-sm text-muted-foreground">Reading streak</p>
          </div>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="animate-fade-up rounded-xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">{c.label}</p>
            <p className="mt-1 font-display text-3xl font-bold text-primary">{c.value}</p>
          </div>
        ))}
      </div>
      {!sessions.length && <p className="text-muted-foreground">Read for a few seconds in RSVP or Pacer mode to start collecting stats.</p>}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <h2 className="mb-4 font-semibold">Daily reading time (min)</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={daily}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} />
              <Tooltip {...tip} cursor={{ fill: "var(--muted)" }} />
              <Bar dataKey="minutes" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <h2 className="mb-4 font-semibold">Speed progression (WPM per session)</h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={wpm}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="n" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} />
              <Tooltip {...tip} />
              <Line type="monotone" dataKey="wpm" stroke="var(--chart-1)" strokeWidth={2.5} dot={{ fill: "var(--chart-1)" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
