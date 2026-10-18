import { createFileRoute, Link } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { toast } from "sonner";
import { Copy, Quote as QuoteIcon, Share2, Trash2 } from "lucide-react";
import { db, type Quote } from "@/lib/db";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/quotes")({
  head: () => ({
    meta: [
      { title: "Saved quotes — Iyzi Reader" },
      { name: "description", content: "Sentences you saved while reading, ready to copy and share anywhere." },
      { property: "og:title", content: "Saved quotes — Iyzi Reader" },
      { property: "og:description", content: "Sentences you saved while reading, ready to copy and share anywhere." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: QuotesPage,
});

export const formatQuote = (q: Quote) => `“${q.text}”\n— ${q.author ? `${q.author}, ` : ""}${q.bookTitle}`;

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Copied — paste it anywhere");
  } catch {
    toast.error("Couldn't copy. Select the text and copy manually.");
  }
}

function QuotesPage() {
  const quotes = useLiveQuery(() => db.quotes.orderBy("createdAt").reverse().toArray(), []);
  const canShare = typeof navigator !== "undefined" && "share" in navigator;
  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Saved quotes</h1>
          <p className="text-muted-foreground">Tap the quote button (or press Q) while reading to save the current sentence.</p>
        </div>
        {!!quotes?.length && (
          <Button variant="outline" onClick={() => copy(quotes.map(formatQuote).join("\n\n"))}><Copy /> Copy all</Button>
        )}
      </div>
      {quotes?.length === 0 && (
        <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
          <QuoteIcon className="mx-auto mb-3 h-8 w-8 text-primary" />
          No quotes yet. <Link to="/library" className="text-primary">Open a book</Link> and save your favorite lines.
        </div>
      )}
      <div className="space-y-4">
        {quotes?.map((q, i) => (
          <figure key={q.id} className="animate-fade-up rounded-2xl border bg-card p-5" style={{ animationDelay: `${i * 50}ms` }}>
            <blockquote className="select-text font-reader text-lg leading-relaxed">“{q.text}”</blockquote>
            <figcaption className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
              <span className="select-text">— {q.author ? `${q.author}, ` : ""}<i>{q.bookTitle}</i></span>
              <span className="flex gap-1">
                <Button size="sm" variant="secondary" onClick={() => copy(formatQuote(q))}><Copy /> Copy</Button>
                {canShare && (
                  <Button size="sm" variant="ghost" aria-label="Share" onClick={() => navigator.share({ text: formatQuote(q) }).catch(() => {})}><Share2 /></Button>
                )}
                <Button size="sm" variant="ghost" aria-label="Delete" onClick={() => q.id && db.quotes.delete(q.id)}><Trash2 /></Button>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
