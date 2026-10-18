import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { saveBook } from "@/lib/db";
import { cn } from "@/lib/utils";

export function UploadZone() {
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  async function handle(files: FileList | null) {
    if (!files) return;
    const { parseFile } = await import("@/lib/parsers");
    for (const file of Array.from(files)) {
      setBusy(file.name);
      try {
        const parsed = await parseFile(file);
        if (!parsed.chapters.length) throw new Error("No readable text found");
        await saveBook({ id: crypto.randomUUID(), title: parsed.title, author: parsed.author, source: parsed.source }, parsed.chapters);
        toast.success(`Added “${parsed.title}”`);
      } catch (e) {
        toast.error(`${file.name}: ${(e as Error).message}`);
      }
    }
    setBusy(null);
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        handle(e.dataTransfer.files);
      }}
      onClick={() => input.current?.click()}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-all",
        over ? "border-primary bg-accent glow" : "hover:border-primary/60",
      )}
    >
      <input ref={input} type="file" accept=".epub,.pdf" multiple hidden onChange={(e) => handle(e.target.files)} />
      {busy ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> : <Upload className="h-8 w-8 text-primary" />}
      <p className="font-display font-semibold">{busy ? `Reading ${busy}…` : "Drop .epub or .pdf here"}</p>
      <p className="text-sm text-muted-foreground">or click to browse — stays on your device</p>
    </div>
  );
}
