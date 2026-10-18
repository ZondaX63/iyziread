import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { db, getSettings } from "@/lib/db";

export const Route = createFileRoute("/reader/")({
  head: () => ({
    meta: [
      { title: "Reader — Iyzi Reader" },
      { name: "description", content: "Continue reading where you left off." },
      { property: "og:title", content: "Reader — Iyzi Reader" },
      { property: "og:description", content: "Continue reading where you left off." },
    ],
  }),
  component: ReaderRedirect,
});

function ReaderRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    (async () => {
      const s = await getSettings();
      const id = (s.lastBookId && (await db.books.get(s.lastBookId))?.id) || (await db.books.orderBy("addedAt").first())?.id;
      if (id) navigate({ to: "/reader/$bookId", params: { bookId: id }, replace: true });
      else navigate({ to: "/library", replace: true });
    })();
  }, [navigate]);
  return <p className="text-muted-foreground">Opening your last book…</p>;
}
