<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture
- Offline-first SPA: all data lives in IndexedDB via Dexie (`src/lib/db.ts`); no server functions or backend, so the app can be wrapped by Tauri v2.
- Reading rules (ORP, punctuation delays, WPM limits) live as pure functions in `src/lib/rsvp.ts` with tests in `src/test/rsvp.test.ts`; keep timing logic there, not in components.
- EPUB/PDF parsers (`src/lib/parsers.ts`) are browser-only and must be dynamically imported from event handlers to stay out of SSR.
