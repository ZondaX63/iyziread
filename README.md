# Iyziread

Create a cross-platform, high-performance fast-reading web application named "Iyzi Reader" built with React, Vite, Tailwind CSS, and Shadcn UI, specifically structured to be wrapped with Tauri v2 for native deployment.

Please implement the features strictly following the MoSCoW priority matrix below:

### 1. MUST HAVE (Core Critical Functionality)
- **Architecture & Offline Storage**: Set up `epubjs` for EPUB parsing, `pdfjs-dist` for PDF text extraction, and `dexie` (IndexedDB) for client-side local book/chapter storage.
- **Pre-loaded Content**: Include mock data for 2 classic pre-loaded books with table of contents and persistent progress state.
- **Main App Shell**: Top navigation bar (Library, Reader, Stats, Settings), theme toggler (Dark as default, Light, Sepia), and a Drag-and-drop book upload zone (.epub and .pdf).
- **Core RSVP Engine**: 
  - Center-aligned RSVP display box with top/bottom focal guide lines.
  - **ORP (Optimal Recognition Point)**: Calculate the focal index of each word (~35% character position) and highlight that single anchor letter in bold red (`#ef4444`).
  - Playback Controls: Play/Pause, 10-second Rewind/Forward, WPM Slider (100–1200 WPM) with quick presets (200, 400, 600, 800 WPM).
  - High-precision timing loop driven by `requestAnimationFrame` for stutter-free word transitions.

### 2. SHOULD HAVE (High Priority Features)
- **Alternative Reader Modes**:
  - **Bionic Reading Mode**: Render full chapter text bolding the first 30–50% characters of every word.
  - **Guided Pacer Mode**: Render full text with an animated highlight band moving line-by-line synchronized with the selected WPM speed.
- **Reading Fine-Tuning**:
  - Punctuation Pacing: Automatically insert a 1.5x delay on commas and 2.0x delay on sentence endings (`.`, `?`, `!`).
  - Word Chunking: Toggle option to show 1, 2, or 3 words simultaneously in RSVP mode.
  - Document Virtualization: Use `@tanstack/react-virtual` for full-text modes to maintain 60 FPS scrolling performance.
- **Keyboard Shortcuts**: `Space` (Play/Pause), `ArrowLeft`/`ArrowRight` (Seek), `ArrowUp`/`ArrowDown` (+/- 50 WPM), `F` (Fullscreen ZEN mode).

### 3. COULD HAVE (Secondary Features & Enhancements)
- **Analytics Dashboard**: Visual charts for daily reading time, average reading speed (WPM progression), and total words read.
- **Customization**: Custom ORP anchor color picker, font family selection (including OpenDyslexic), and export/import backup for local data.

### 4. WON'T HAVE (Out of Scope for Initial Version)
- Do NOT build any backend API, user authentication, or cloud database integration (keep everything local and offline-first).
- Do NOT add Text-to-Speech (TTS) audio playback or DRM decryption capabilities.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/022c9d22-dda4-4103-9466-dbcc4d7e453f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
