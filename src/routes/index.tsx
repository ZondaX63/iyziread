import { createFileRoute, Link } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { FileText, BookMarked, Trash2 } from "lucide-react";
import { db, deleteBook } from "@/lib/db";
import { UploadZone } from "@/components/UploadZone";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Library — Iyzi Reader" },
      { name: "description", content: "Your offline library of EPUB and PDF books, ready for speed reading." },
      { property: "og:title", content: "Library — Iyzi Reader" },
      { property: "og:description", content: "Your offline library of EPUB and PDF books, ready for speed reading." },
    ],
  }),
  component: LibraryPage,
});

function LibraryPage() {
  const books = useLiveQuery(() => db.books.orderBy("addedAt").toArray(), []);
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">
          Read <span className="text-primary">faster</span>. Stay focused.
        </h1>
        <p className="mt-2 text-muted-foreground">Everything is stored on this device — no account, no cloud.</p>
      </div>
      <UploadZone />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {books?.map((b) => (
          <div key={b.id} className="group relative rounded-xl border bg-card p-5 transition-all hover:border-primary hover:glow">
            <Link to="/reader/$bookId" params={{ bookId: b.id }} className="block space-y-3">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                {b.source === "pdf" ? <FileText className="h-4 w-4" /> : <BookMarked className="h-4 w-4" />}
                {b.source === "seed" ? "Classic" : b.source} · {b.toc.length} ch · {b.totalWords.toLocaleString()} words
              </div>
              <h3 className="text-lg font-semibold leading-tight">{b.title}</h3>
              <p className="text-sm text-muted-foreground">{b.author}</p>
              <Progress value={b.progress.percent * 100} className="h-1.5" />
              <p className="text-xs text-muted-foreground">{Math.round(b.progress.percent * 100)}% · {b.toc[b.progress.chapter]}</p>
            </Link>
            <button
              onClick={() => confirm(`Delete “${b.title}”?`) && deleteBook(b.id)}
              className="absolute right-3 top-3 rounded p-1 text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100"
              aria-label="Delete book"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
