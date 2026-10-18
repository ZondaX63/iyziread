// Browser-only. Import dynamically from event handlers.
export interface ParsedBook {
  title: string;
  author: string;
  source: "epub" | "pdf";
  chapters: { title: string; text: string }[];
}

async function parseEpub(file: File): Promise<ParsedBook> {
  const ePub = (await import("epubjs")).default;
  const book = ePub(await file.arrayBuffer());
  await book.ready;
  const meta = await book.loaded.metadata;
  const nav = await book.loaded.navigation;
  const titles = new Map<string, string>();
  const walk = (items: { href: string; label: string; subitems?: unknown[] }[]) =>
    items.forEach((t) => {
      titles.set(t.href.split("#")[0] ?? t.href, t.label.trim());
      if (t.subitems) walk(t.subitems as never);
    });
  walk(nav.toc as never);

  const chapters: { title: string; text: string }[] = [];
  const items: { href: string; load: (l: unknown) => Promise<Document>; unload: () => void }[] = [];
  (book.spine as unknown as { each: (fn: (i: never) => void) => void }).each((i) => items.push(i));
  for (const item of items) {
    const doc = await item.load(book.load.bind(book));
    const blocks = Array.from(doc.querySelectorAll("p, h1, h2, h3, h4, li, blockquote"))
      .map((el) => el.textContent?.replace(/\s+/g, " ").trim() ?? "")
      .filter(Boolean);
    const text = blocks.length ? blocks.join("\n\n") : (doc.body?.textContent ?? "").trim();
    item.unload();
    if (text.split(/\s+/).length < 20) continue;
    const key = [...titles.keys()].find((k) => item.href.endsWith(k) || k.endsWith(item.href));
    chapters.push({ title: (key && titles.get(key)) || `Section ${chapters.length + 1}`, text });
  }
  book.destroy();
  return { title: meta.title || file.name, author: meta.creator || "Unknown", source: "epub", chapters };
}

async function parsePdf(file: File): Promise<ParsedBook> {
  const pdfjs = await import("pdfjs-dist");
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const pages: string[] = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const content = await (await pdf.getPage(p)).getTextContent();
    let s = "";
    for (const it of content.items as { str?: string; hasEOL?: boolean }[]) {
      s += (it.str ?? "") + (it.hasEOL ? "\n" : " ");
    }
    // join wrapped lines into paragraphs: blank-ish breaks stay, single newlines merge
    pages.push(s.replace(/-\n/g, "").replace(/([^.!?:"”])\n/g, "$1 ").trim());
  }
  const meta = (await pdf.getMetadata().catch(() => null))?.info as { Title?: string; Author?: string } | undefined;
  const chapters: { title: string; text: string }[] = [];
  for (let i = 0; i < pages.length; i += 10) {
    const text = pages.slice(i, i + 10).join("\n\n").trim();
    if (text) chapters.push({ title: `Pages ${i + 1}–${Math.min(i + 10, pages.length)}`, text });
  }
  return { title: meta?.Title || file.name.replace(/\.pdf$/i, ""), author: meta?.Author || "Unknown", source: "pdf", chapters };
}

export async function parseFile(file: File) {
  const name = file.name.toLowerCase();
  if (name.endsWith(".epub")) return parseEpub(file);
  if (name.endsWith(".pdf")) return parsePdf(file);
  throw new Error("Only .epub and .pdf files are supported");
}
