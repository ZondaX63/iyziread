import Dexie, { type Table } from "dexie";

export interface Book {
  id: string;
  title: string;
  author: string;
  source: "seed" | "epub" | "pdf";
  toc: string[];
  chapterWords: number[];
  totalWords: number;
  progress: { chapter: number; word: number; percent: number };
  addedAt: number;
  lastOpenedAt?: number;
}

export interface Chapter {
  id: string; // `${bookId}:${index}`
  bookId: string;
  index: number;
  title: string;
  text: string;
}

export interface Session {
  id?: number;
  date: string; // yyyy-mm-dd
  startedAt: number;
  durationMs: number;
  words: number;
  wpm: number;
  bookId: string;
}

export type Theme = "dark" | "light" | "sepia";
export type ReaderFont = "atkinson" | "literata" | "grotesk" | "mono" | "dyslexic";

export interface Settings {
  key: "app";
  theme: Theme;
  orpColor: string;
  font: ReaderFont;
  punctuation: boolean;
  chunk: 1 | 2 | 3;
  wpm: number;
  lastBookId?: string;
  seeded?: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  key: "app",
  theme: "dark",
  orpColor: "#ef4444",
  font: "atkinson",
  punctuation: true,
  chunk: 1,
  wpm: 300,
};

class IyziDB extends Dexie {
  books!: Table<Book, string>;
  chapters!: Table<Chapter, string>;
  sessions!: Table<Session, number>;
  settings!: Table<Settings, string>;
  constructor() {
    super("iyzi-reader");
    this.version(1).stores({
      books: "id, addedAt, lastOpenedAt",
      chapters: "id, bookId",
      sessions: "++id, date, bookId",
      settings: "key",
    });
  }
}

export const db = new IyziDB();

export async function getSettings(): Promise<Settings> {
  return { ...DEFAULT_SETTINGS, ...((await db.settings.get("app")) ?? {}) };
}

export async function updateSettings(patch: Partial<Settings>) {
  const cur = await getSettings();
  await db.settings.put({ ...cur, ...patch, key: "app" });
}

export async function saveBook(meta: Omit<Book, "chapterWords" | "totalWords" | "toc" | "progress" | "addedAt">, chapters: { title: string; text: string }[]) {
  const chapterWords = chapters.map((c) => c.text.split(/\s+/).filter(Boolean).length);
  await db.transaction("rw", db.books, db.chapters, async () => {
    await db.books.put({
      ...meta,
      toc: chapters.map((c) => c.title),
      chapterWords,
      totalWords: chapterWords.reduce((a, b) => a + b, 0),
      progress: { chapter: 0, word: 0, percent: 0 },
      addedAt: Date.now(),
    });
    await db.chapters.bulkPut(chapters.map((c, i) => ({ id: `${meta.id}:${i}`, bookId: meta.id, index: i, ...c })));
  });
}

export async function deleteBook(id: string) {
  await db.transaction("rw", db.books, db.chapters, async () => {
    await db.books.delete(id);
    await db.chapters.where("bookId").equals(id).delete();
  });
}

export async function exportBackup() {
  return JSON.stringify({
    app: "iyzi-reader",
    version: 1,
    books: await db.books.toArray(),
    chapters: await db.chapters.toArray(),
    sessions: await db.sessions.toArray(),
    settings: await db.settings.toArray(),
  });
}

export async function importBackup(json: string) {
  const data = JSON.parse(json);
  if (data.app !== "iyzi-reader") throw new Error("Not an Iyzi Reader backup");
  await db.transaction("rw", [db.books, db.chapters, db.sessions, db.settings], async () => {
    await Promise.all([db.books.clear(), db.chapters.clear(), db.sessions.clear(), db.settings.clear()]);
    await db.books.bulkPut(data.books ?? []);
    await db.chapters.bulkPut(data.chapters ?? []);
    await db.sessions.bulkPut(data.sessions ?? []);
    await db.settings.bulkPut(data.settings ?? []);
  });
}
