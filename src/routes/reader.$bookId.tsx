import { createFileRoute, Link } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { ChevronLeft, Eye, Maximize, Minimize, Pause, Play, Quote as QuoteIcon, RotateCcw, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { db, updateSettings, type Book } from "@/lib/db";
import { useSettings } from "@/hooks/use-settings";
import { useRsvpEngine } from "@/hooks/use-rsvp-engine";
import { clampWpm, EYE_REST_AFTER_MS, EYE_REST_SECONDS, formatMinutes, MAX_WPM, minutesLeft, MIN_WPM, sentenceAt, tokenize } from "@/lib/rsvp";
import { SessionSummary, type SummaryData } from "@/components/SessionSummary";
import { RsvpDisplay } from "@/components/reader/RsvpDisplay";
import { VirtualText } from "@/components/reader/TextViews";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reader/$bookId")({
  head: () => ({
    meta: [
      { title: "Reading — Iyzi Reader" },
      { name: "description", content: "Speed read with RSVP, Bionic and Guided Pacer modes." },
      { property: "og:title", content: "Reading — Iyzi Reader" },
      { property: "og:description", content: "Speed read with RSVP, Bionic and Guided Pacer modes." },
    ],
  }),
  component: ReaderPage,
});

type Mode = "rsvp" | "bionic" | "pacer";

function ReaderPage() {
  const { bookId } = Route.useParams();
  const book = useLiveQuery(() => db.books.get(bookId), [bookId]);
  const [chapter, setChapter] = useState<number | null>(null);
  const [mode, setMode] = useState<Mode>("rsvp");

  useEffect(() => {
    if (book && chapter === null) {
      setChapter(book.progress.chapter);
      db.books.update(bookId, { lastOpenedAt: Date.now() });
      updateSettings({ lastBookId: bookId });
    }
  }, [book, chapter, bookId]);

  const chap = useLiveQuery(() => (chapter === null ? undefined : db.chapters.get(`${bookId}:${chapter}`)), [bookId, chapter]);

  if (book === undefined || chapter === null) return <p className="text-muted-foreground">Loading…</p>;
  if (!book) return <p>Book not found. <Link to="/library" className="text-primary">Back to library</Link></p>;

  return (
    <div className="space-y-5">
      <div data-chrome className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-2 gap-y-3 sm:flex sm:flex-wrap sm:gap-3">
        <Link to="/library" className="shrink-0 text-muted-foreground hover:text-foreground" aria-label="Back to library"><ChevronLeft /></Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold">{book.title}</h1>
          <p className="text-sm text-muted-foreground">{book.author}</p>
        </div>
        <Select value={String(chapter)} onValueChange={(v) => setChapter(Number(v))}>
          <SelectTrigger className="col-span-2 w-full sm:w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            {book.toc.map((t, i) => <SelectItem key={i} value={String(i)}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="col-span-2 grid grid-cols-3 rounded-lg border p-1 sm:flex">
          {(["rsvp", "bionic", "pacer"] as Mode[]).map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className={cn("rounded-md px-3 py-1 text-sm capitalize", mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
              {m === "rsvp" ? "RSVP" : m}
            </button>
          ))}
        </div>
      </div>
      {chap ? (
        <ChapterReader key={chap.id} book={book} chapter={chapter} text={chap.text} mode={mode}
          onNextChapter={() => chapter < book.toc.length - 1 && setChapter(chapter + 1)} />
      ) : <p className="text-muted-foreground">Loading chapter…</p>}
    </div>
  );
}

function ChapterReader({ book, chapter, text, mode, onNextChapter }: { book: Book; chapter: number; text: string; mode: Mode; onNextChapter: () => void }) {
  const s = useSettings();
  const { words, paragraphs } = useMemo(() => tokenize(text), [text]);
  const [zen, setZen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const chunk = mode === "rsvp" ? s.chunk : 1;
  const initial = book.progress.chapter === chapter ? book.progress.word : 0;

  // Pauses don't end the session: accumulate play segments, finish when leaving the book/chapter.
  const acc = useRef({ ms: 0, words: 0, startedAt: 0 });
  const showSummaryRef = useRef(s.showSummary);
  showSummaryRef.current = s.showSummary;
  const onSession = useCallback(({ durationMs, words: w }: { durationMs: number; words: number }) => {
    if (!acc.current.startedAt) acc.current.startedAt = Date.now() - durationMs;
    acc.current.ms += durationMs;
    acc.current.words += w;
  }, []);

  const eng = useRsvpEngine(words, { wpm: s.wpm, chunk, punctuation: s.punctuation, ramp: s.rampUp, initial, onSession });
  const setWpm = (w: number) => updateSettings({ wpm: clampWpm(w) });

  // persist progress
  useEffect(() => {
    const t = setTimeout(() => {
      const before = book.chapterWords.slice(0, chapter).reduce((a, b) => a + b, 0);
      db.books.update(book.id, { progress: { chapter, word: eng.index, percent: Math.min(1, (before + eng.index + 1) / Math.max(1, book.totalWords)) } });
    }, 600);
    return () => clearTimeout(t);
  }, [eng.index, chapter, book.id, book.chapterWords, book.totalWords]);

  // 20-20-20 eye rest: after 20 min of continuous reading, pause for a 20s break (skippable)
  const [rest, setRest] = useState<number | null>(null);
  const readMs = useRef(0);
  useEffect(() => {
    if (!eng.playing || !s.eyeRest) return;
    const iv = setInterval(() => {
      readMs.current += 1000;
      if (readMs.current >= EYE_REST_AFTER_MS) {
        readMs.current = 0;
        eng.setPlaying(false);
        setRest(EYE_REST_SECONDS);
      }
    }, 1000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eng.playing, s.eyeRest]);
  useEffect(() => {
    if (rest === null) return;
    if (rest <= 0) { setRest(null); toast.success("Eyes rested — press play to continue"); return; }
    const t = setTimeout(() => setRest((r) => (r === null ? null : r - 1)), 1000);
    return () => clearTimeout(t);
  }, [rest]);

  const saveQuote = useCallback(async () => {
    const text = sentenceAt(words, eng.index);
    if (!text) return;
    await db.quotes.add({ bookId: book.id, bookTitle: book.title, author: book.author, text, createdAt: Date.now() });
    toast.success("Quote saved", { description: text.length > 80 ? text.slice(0, 80) + "…" : text });
  }, [words, eng.index, book.id, book.title, book.author]);
  const saveQuoteRef = useRef(saveQuote);
  saveQuoteRef.current = saveQuote;

  const toggleZen = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen();
    else box.current?.requestFullscreen?.();
  }, []);
  useEffect(() => {
    const f = () => setZen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", f);
    return () => document.removeEventListener("fullscreenchange", f);
  }, []);

  // Focus mode: hide app chrome while playing; fullscreen on phones; keep screen awake
  useEffect(() => {
    const el = document.documentElement;
    if (!eng.playing) return;
    el.dataset["focus"] = "1";
    let lock: { release: () => Promise<void> } | null = null;
    const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } };
    nav.wakeLock?.request("screen").then((l) => (lock = l)).catch(() => {});
    if (window.matchMedia("(max-width: 640px)").matches && !document.fullscreenElement) {
      el.requestFullscreen?.().catch(() => {});
    }
    return () => {
      delete el.dataset["focus"];
      lock?.release().catch(() => {});
    };
  }, [eng.playing]);
  useEffect(() => () => {
    if (document.fullscreenElement === document.documentElement) document.exitFullscreen().catch(() => {});
  }, []);

  // Touch: tap = play/pause, horizontal swipe = ±10s
  const touch = useRef<{ x: number; y: number } | null>(null);
  const touchHandlers = {
    onTouchStart: (e: React.TouchEvent) => { const t = e.touches[0]; if (t) touch.current = { x: t.clientX, y: t.clientY }; },
    onTouchEnd: (e: React.TouchEvent) => {
      const start = touch.current; const t = e.changedTouches[0]; touch.current = null;
      if (!start || !t) return;
      const dx = t.clientX - start.x; const dy = t.clientY - start.y;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) { e.preventDefault(); eng.seekSeconds(dx < 0 ? 10 : -10); }
      else if (mode === "rsvp" && Math.abs(dx) < 10 && Math.abs(dy) < 10) { e.preventDefault(); eng.toggle(); }
    },
  };

  const wpmRef = useRef(s.wpm);
  wpmRef.current = s.wpm;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.code === "Space") { e.preventDefault(); eng.toggle(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); eng.seekSeconds(-10); }
      else if (e.key === "ArrowRight") { e.preventDefault(); eng.seekSeconds(10); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setWpm(wpmRef.current + 50); }
      else if (e.key === "ArrowDown") { e.preventDefault(); setWpm(wpmRef.current - 50); }
      else if (e.key === "f" || e.key === "F") toggleZen();
      else if (e.key === "q" || e.key === "Q") saveQuoteRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eng.toggle, eng.seekSeconds, toggleZen]);

  const atEnd = eng.index >= words.length - 1 && !eng.playing;
  const chunkWords = words.slice(eng.index, eng.index + chunk);
  const chapterLeft = words.length - eng.index - 1;
  const bookLeft = chapterLeft + book.chapterWords.slice(chapter + 1).reduce((a, b) => a + b, 0);

  return (
    <div ref={box} className={cn("space-y-5 bg-background [html[data-focus]_&]:flex [html[data-focus]_&]:min-h-[85vh] [html[data-focus]_&]:flex-col [html[data-focus]_&]:justify-center", zen && "flex flex-col justify-center p-10")}>
      {mode === "rsvp" ? (
        <div {...touchHandlers} onClick={eng.toggle} className={cn("grid cursor-pointer select-none place-items-center", zen ? "flex-1" : "py-10 [html[data-focus]_&]:min-h-[60vh]")}><RsvpDisplay words={chunkWords} /></div>
      ) : (
        <div {...touchHandlers}><VirtualText paragraphs={paragraphs} index={eng.index} onSeek={eng.setIndex} mode={mode} playing={eng.playing} /></div>
      )}

      <div data-chrome className="space-y-1.5">
        <div className="h-1 w-full overflow-hidden rounded bg-muted">
          <div className="h-full bg-primary transition-[width]" style={{ width: `${((eng.index + 1) / Math.max(1, words.length)) * 100}%` }} />
        </div>
        <p className="flex justify-between text-xs text-muted-foreground tabular-nums">
          <span>Chapter: {formatMinutes(minutesLeft(chapterLeft, s.wpm))} left</span>
          <span>Book: {formatMinutes(minutesLeft(bookLeft, s.wpm))} left</span>
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 rounded-xl border bg-card p-4">
        <Button variant="ghost" size="icon" onClick={() => eng.seekSeconds(-10)} aria-label="Rewind 10 seconds"><RotateCcw /></Button>
        <Button size="lg" className="h-12 w-12 rounded-full glow" onClick={eng.toggle} disabled={mode === "bionic"} aria-label={eng.playing ? "Pause" : "Play"}>
          {eng.playing ? <Pause /> : <Play />}
        </Button>
        <Button variant="ghost" size="icon" onClick={() => eng.seekSeconds(10)} aria-label="Forward 10 seconds"><RotateCw /></Button>

        <div className="flex min-w-64 flex-1 items-center gap-3 px-2">
          <span className="w-24 text-right font-display text-sm font-bold tabular-nums text-primary" title={s.rampUp ? "Warm-up ramp on" : undefined}>
            {eng.playing && s.rampUp && eng.liveWpm < s.wpm ? `${eng.liveWpm}→${s.wpm}` : `${s.wpm} WPM`}
          </span>
          <Slider min={MIN_WPM} max={MAX_WPM} step={10} value={[s.wpm]} onValueChange={([v]) => setWpm(v ?? s.wpm)} />
        </div>
        <div data-chrome className="flex gap-1">
          {[200, 400, 600, 800].map((p) => (
            <Button key={p} size="sm" variant={s.wpm === p ? "default" : "outline"} onClick={() => setWpm(p)}>{p}</Button>
          ))}
        </div>
        {mode === "rsvp" && (
          <div data-chrome className="flex items-center gap-1 text-sm text-muted-foreground">
            Words
            {([1, 2, 3] as const).map((c) => (
              <Button key={c} size="sm" variant={s.chunk === c ? "secondary" : "ghost"} onClick={() => updateSettings({ chunk: c })}>{c}</Button>
            ))}
          </div>
        )}
        <Button variant="ghost" size="icon" onClick={saveQuote} aria-label="Save current sentence as quote" title="Save quote (Q)"><QuoteIcon /></Button>
        <Button variant="ghost" size="icon" onClick={toggleZen} aria-label="Zen mode">{zen ? <Minimize /> : <Maximize />}</Button>
      </div>

      {!zen && (
        <p data-chrome className="text-center text-xs text-muted-foreground sm:hidden">
          Tap the word to play/pause · swipe left/right to skip 10s
        </p>
      )}
      {!zen && (
        <p data-chrome className="hidden text-center text-xs text-muted-foreground sm:block">
          Space play/pause · ←/→ seek 10s · ↑/↓ ±50 WPM · F zen mode · Q save quote · ? all shortcuts {mode === "bionic" && "· click a word to set your position"}
        </p>
      )}
      {rest !== null && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/95 p-6 animate-page" role="dialog" aria-label="Eye rest">
          <div className="max-w-sm text-center">
            <Eye className="mx-auto h-14 w-14 animate-flicker text-primary" />
            <h2 className="mt-4 font-display text-2xl font-bold">Rest your eyes</h2>
            <p className="mt-2 text-muted-foreground">You've read for 20 minutes. Look at something ~6 meters away for 20 seconds.</p>
            <p className="my-6 font-display text-6xl font-bold tabular-nums text-primary">{rest}</p>
            <Button variant="outline" onClick={() => setRest(null)}>Skip rest</Button>
          </div>
        </div>
      )}
      {summary && <SessionSummary data={summary} onClose={() => setSummary(null)} />}
      {atEnd && chapter < book.toc.length - 1 && (
        <div className="text-center"><Button onClick={onNextChapter}>Next chapter →</Button></div>
      )}
    </div>
  );
}
