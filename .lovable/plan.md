# Iyzi Reader — Build Plan

Offline-first speed-reading app. Everything stored locally in the browser (IndexedDB). No backend, no auth, no TTS, no DRM.

## Pages
- **/ Library** — book grid with progress bars, drag-and-drop upload zone (.epub, .pdf), 2 preloaded classics (e.g. Alice in Wonderland excerpt, Pride and Prejudice excerpt) with table of contents.
- **/reader/$bookId** — reader with mode switch: RSVP, Bionic, Guided Pacer. Chapter (TOC) picker, progress saved automatically.
- **/stats** — charts: daily reading time, WPM over time, total words read.
- **/settings** — theme (Dark default, Light, Sepia), ORP anchor color, font family (incl. OpenDyslexic), punctuation pacing toggle, chunk size, backup export/import (JSON).

Top nav bar: Library, Reader (last opened book), Stats, Settings, theme toggler.

## Reader features
- **RSVP**: centered box with top/bottom focal guide lines; ORP letter (~35% index) bold in red `#ef4444` (customizable), word aligned on the anchor. Play/Pause, -10s/+10s, WPM slider 100–1200, presets 200/400/600/800. Chunking 1/2/3 words. Punctuation delays: comma 1.5x, sentence end 2.0x. Timing via `requestAnimationFrame` with accumulated-time scheduling (no drift).
- **Bionic**: full chapter, bold first ~40% of each word.
- **Guided Pacer**: full chapter with a highlight band moving line by line at WPM speed.
- Full-text modes virtualized with `@tanstack/react-virtual` (paragraph rows).
- Shortcuts: Space, Left/Right (seek), Up/Down (±50 WPM), F (fullscreen Zen mode).

## Design
Distinctive, focused reading aesthetic: dark ink background, warm off-white text, red accent; serif display font (e.g. Fraunces) + clean body (e.g. Atkinson Hyperlegible); semantic tokens for dark/light/sepia themes.

## Technical details
- Deps: `epubjs`, `pdfjs-dist`, `dexie`, `dexie-react-hooks`, `@tanstack/react-virtual`, `recharts`, shadcn components.
- Dexie DB: `books` (meta, toc, progress), `chapters` (bookId, index, title, text), `sessions` (date, durationMs, words, avgWpm), `settings`.
- Parsing runs client-only (dynamic import inside upload handler); pdf.js worker loaded via Vite `?url`. EPUB: iterate spine, strip HTML to text. PDF: text per page, grouped into chapters by ~10 pages or outline.
- Pure logic module (`lib/rsvp.ts`): tokenize, ORP index, delay multiplier, chunking — with vitest tests (ORP index, 1.5x/2.0x delays, WPM clamp 100–1200).
- Seed preloaded books into Dexie on first client load (client-side only, idempotent).
- Pure SPA patterns compatible with Tauri v2 wrapping (no server functions; all browser APIs inside effects). Short README section on adding Tauri.
- Each route gets its own head() metadata.
