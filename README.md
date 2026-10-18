# Iyzi Reader

Offline-first speed-reading app. Read EPUB, PDF or pasted text faster with RSVP, Bionic and Guided Pacer modes. All data stays on your device (IndexedDB) — no account, no server, no tracking.

## Features

- **RSVP reader** — ORP focal letter (customizable color, red by default), focal guide lines, 100–1200 WPM, presets 200/400/600/800, 1–3 word chunks, punctuation pacing (comma 1.5x, sentence end 2.0x), drift-free `requestAnimationFrame` timing.
- **Bionic** and **Guided Pacer** full-text modes (virtualized for long chapters).
- **Library** — drag-and-drop EPUB/PDF upload, two preloaded classics, table of contents, saved progress.
- **Paste & Read**, time-to-finish estimates, **saved quotes** (one-tap copy/share).
- **Motivation** — home dashboard with streak, daily goal ring, personal achievements and bests scaled to your own baseline.
- **Healthy reading** — optional warm-up speed ramp, Schulte table trainer, 20-20-20 eye-rest breaks (always skippable).
- **Mobile** — bottom navigation, distraction-free focus mode, tap to play/pause, swipe to seek, screen wake lock.
- **Stats** — daily reading time, WPM over time, total words.
- **Settings** — Dark / Light / Sepia themes, fonts incl. OpenDyslexic, reminders, JSON backup export/import.

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| Space | Play / pause |
| ← / → | Seek 10 s |
| ↑ / ↓ | ±50 WPM |
| F | Zen (fullscreen) mode |
| Q | Save current sentence as quote |
| ? | Shortcut cheat sheet |

## Tech stack

React 19, TanStack Start/Router, Vite, Tailwind CSS v4, shadcn/ui, Dexie (IndexedDB), epubjs, pdfjs-dist, @tanstack/react-virtual, Recharts, Vitest.

## Development

```sh
npm install
npm run dev        # start dev server
npx vitest run     # run tests
npm run build      # production build
```

## Project structure

```
src/lib/rsvp.ts          pure reading/timing rules (tested)
src/lib/achievements.ts  personal achievements & bests (tested)
src/lib/stats.ts         streak logic (tested)
src/lib/db.ts            Dexie database & backup
src/lib/parsers.ts       EPUB/PDF parsing (browser-only)
src/routes/              pages: home, library, reader, paste, quotes, train, stats, settings
src/components/          UI & reader components
```

## Desktop & mobile builds (Tauri v2)

The app has no backend, so it can be wrapped with [Tauri v2](https://v2.tauri.app):

```sh
npm install -D @tauri-apps/cli
npx tauri init                 # point frontendDist to the built client output
npx tauri build                # Windows .exe / .msi, macOS, Linux
npx tauri android init && npx tauri android build   # Android .apk
```

Building Windows and Android packages requires the respective toolchains (Rust, MSVC on Windows; Android SDK/NDK for APK).

## License

MIT
