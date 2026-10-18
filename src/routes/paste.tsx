import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ClipboardPaste, Play } from "lucide-react";
import { toast } from "sonner";
import { saveBook } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/paste")({
  head: () => ({
    meta: [
      { title: "Paste & Read — Iyzi Reader" },
      { name: "description", content: "Paste any text and speed read it instantly, no file needed." },
      { property: "og:title", content: "Paste & Read — Iyzi Reader" },
      { property: "og:description", content: "Paste any text and speed read it instantly, no file needed." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PastePage,
});

function PastePage() {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const nav = useNavigate();
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  async function fromClipboard() {
    try {
      setText(await navigator.clipboard.readText());
    } catch {
      toast.error("Clipboard blocked — paste with Ctrl/Cmd+V instead");
    }
  }
  async function start() {
    const id = `paste-${Date.now()}`;
    await saveBook({ id, title: title.trim() || text.trim().split(/\s+/).slice(0, 6).join(" ") + "…", author: "Pasted text", source: "paste" }, [{ title: "Text", text }]);
    nav({ to: "/reader/$bookId", params: { bookId: id } });
  }

  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-3xl font-bold">Paste &amp; Read</h1>
      <p className="text-muted-foreground">Articles, notes, emails — paste anything and read it at your speed. It's saved to your library.</p>
      <Input placeholder="Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} />
      <Textarea placeholder="Paste your text here…" value={text} onChange={(e) => setText(e.target.value)} className="min-h-[40vh] font-reader text-base" />
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={fromClipboard}><ClipboardPaste /> Paste from clipboard</Button>
        <Button onClick={start} disabled={words < 5} className="glow"><Play /> Start reading</Button>
        <span className="text-sm text-muted-foreground">{words.toLocaleString()} words</span>
      </div>
    </div>
  );
}
