import { createFileRoute, Link } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { ChevronLeft, Maximize, Minimize, Pause, Play, RotateCcw, RotateCw } from "lucide-react";
import { db, updateSettings, type Book } from "@/lib/db";
import { useSettings } from "@/hooks/use-settings";
import { useRsvpEngine } from "@/hooks/use-rsvp-engine";
import { clampWpm, MAX_WPM, MIN_WPM, tokenize } from "@/lib/rsvp";
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
  if (!book) return <p>Book not found. <Link to="/" className="text-primary">Back to library</Link></p>;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Link to="/" className="text-muted-foreground hover:text-foreground"><ChevronLeft /></Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold">{book.title}</h1>
          <p className="text-sm text-muted-foreground">{book.author}</p>
        </div>
        <Select value={String(chapter)} onValueChange={(v) => setChapter(Number(v))}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            {book.toc.map((t, i) => <SelectItem key={i} value={String(i)}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex rounded-lg border p-1">
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

  const onSession = useCallback(({ durationMs, words: w }: { durationMs: number; words: number }) => {
    db.sessions.add({ date: format(new Date(), "yyyy-MM-dd"), startedAt: Date.now() - durationMs, durationMs, words: w, wpm: Math.round(w / (durationMs / 60000)), bookId: book.id });
  }, [book.id]);

  const eng = useRsvpEngine(words, { wpm: s.wpm, chunk, punctuation: s.punctuation, initial, onSession });
  const setWpm = (w: number) => updateSettings({ wpm: clampWpm(w) });

  // persist progress
  useEffect(() => {
    const t = setTimeout(() => {
      const before = book.chapterWords.slice(0, chapter).reduce((a, b) => a + b, 0);
      db.books.update(book.id, { progress: { chapter, word: eng.index, percent: Math.min(1, (before + eng.index + 1) / Math.max(1, book.totalWords)) } });
    }, 600);
    return () => clearTimeout(t);
  }, [eng.index, chapter, book.id, book.chapterWords, book.totalWords]);

  const toggleZen = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen();
    else box.current?.requestFullscreen?.();
  }, []);
  useEffect(() => {
    const f = () => setZen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", f);
    return () => document.removeEventListener("fullscreenchange", f);
  }, []);

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
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eng.toggle, eng.seekSeconds, toggleZen]);

  const atEnd = eng.index >= words.length - 1 && !eng.playing;
  const chunkWords = words.slice(eng.index, eng.index + chunk);

  return (
    <div ref={box} className={cn("space-y-5 bg-background", zen && "flex flex-col justify-center p-10")}>
      {mode === "rsvp" ? (
        <div className={cn("grid place-items-center", zen ? "flex-1" : "py-10")}><RsvpDisplay words={chunkWords} /></div>
      ) : (
        <VirtualText paragraphs={paragraphs} index={eng.index} onSeek={eng.setIndex} mode={mode} playing={eng.playing} />
      )}

      <div className="h-1 w-full overflow-hidden rounded bg-muted">
        <div className="h-full bg-primary transition-[width]" style={{ width: `${((eng.index + 1) / Math.max(1, words.length)) * 100}%` }} />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 rounded-xl border bg-card p-4">
        <Button variant="ghost" size="icon" onClick={() => eng.seekSeconds(-10)} aria-label="Rewind 10 seconds"><RotateCcw /></Button>
        <Button size="lg" className="h-12 w-12 rounded-full glow" onClick={eng.toggle} disabled={mode === "bionic"} aria-label={eng.playing ? "Pause" : "Play"}>
          {eng.playing ? <Pause /> : <Play />}
        </Button>
        <Button variant="ghost" size="icon" onClick={() => eng.seekSeconds(10)} aria-label="Forward 10 seconds"><RotateCw /></Button>

        <div className="flex min-w-64 flex-1 items-center gap-3 px-2">
          <span className="w-20 text-right font-display text-sm font-bold tabular-nums text-primary">{s.wpm} WPM</span>
          <Slider min={MIN_WPM} max={MAX_WPM} step={10} value={[s.wpm]} onValueChange={([v]) => setWpm(v)} />
        </div>
        <div className="flex gap-1">
          {[200, 400, 600, 800].map((p) => (
            <Button key={p} size="sm" variant={s.wpm === p ? "default" : "outline"} onClick={() => setWpm(p)}>{p}</Button>
          ))}
        </div>
        {mode === "rsvp" && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            Words
            {([1, 2, 3] as const).map((c) => (
              <Button key={c} size="sm" variant={s.chunk === c ? "secondary" : "ghost"} onClick={() => updateSettings({ chunk: c })}>{c}</Button>
            ))}
          </div>
        )}
        <Button variant="ghost" size="icon" onClick={toggleZen} aria-label="Zen mode">{zen ? <Minimize /> : <Maximize />}</Button>
      </div>

      {!zen && (
        <p className="text-center text-xs text-muted-foreground">
          Space play/pause · ←/→ seek 10s · ↑/↓ ±50 WPM · F zen mode {mode === "bionic" && "· click a word to set your position"}
        </p>
      )}
      {atEnd && chapter < book.toc.length - 1 && (
        <div className="text-center"><Button onClick={onNextChapter}>Next chapter →</Button></div>
      )}
    </div>
  );
}
