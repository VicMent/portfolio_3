# Vic Menten — Vista Desktop Portfolio

An interactive Windows Vista desktop environment used as a portfolio. Every
section of the CV is an application window you can drag, resize, minimise,
maximise, tile, cascade and switch between with Flip 3D.

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production build into dist/
npm run test     # build, then drive it headlessly in Chromium
npm run shots    # write screenshots of every view to shots/
```

`npm run build` runs `tsc -b` first, so a type error fails the build rather
than shipping. The smoke test fails on any console error, page error or
failed request, and asserts that drag, resize, search, minimise/restore,
reload and the mobile layout all actually work.

## Architecture

```
src/
├─ App.tsx                  boot screen, window host, per-window error boundary
├─ data/
│  ├─ appMeta.ts            pure app metadata (no React — breaks an import cycle)
│  ├─ apps.ts               metadata + component wiring
│  └─ portfolio.ts          all content, fully typed
├─ stores/
│  ├─ windowStore.ts        windows, z-order, placement, snapping, tiling
│  ├─ desktopStore.ts       icon positions, wallpaper, sidebar
│  └─ themeStore.ts         accent, glass, motion, sound (persisted)
├─ components/
│  ├─ windows/              BaseWindow + one component per app
│  ├─ shell/                Desktop, Taskbar, StartMenu, Sidebar, Flip3D
│  ├─ vista/                WindowChrome, brand icons
│  └─ magicui/              AnimatedList, AuroraText, BentoGrid, Globe, Terminal…
└─ utils/sound.ts           system sounds synthesised with the Web Audio API
```

### Opening a window

`data/appMeta.ts` is the single source of truth. Adding an app means adding one
entry there and one component — no 12-field config object at every call site:

```ts
openWindow('about');
```

### Window management

- Drag and resize are **pointer-event based** and mutate the DOM directly during
  the gesture, then commit to the store on release. This keeps dragging on the
  compositor instead of re-rendering the window's contents on every mouse move.
- Eight resize handles, with min-size compensation on the west/north edges.
- The gadget rail is treated as reserved space, so a window can never end up
  stranded underneath it with unreachable resize edges.
- Aero edge snapping with a translucent preview; drag a maximised window to
  restore it under the cursor.

### Keyboard

| Shortcut | Action |
|----------|--------|
| `Win`/`Alt` + `Tab` | Flip 3D |
| `Win`/`Alt` + `D` | Show desktop |
| `Win`/`Alt` + `S` | Settings |
| `Win`/`Alt` + `R` | Run dialog |
| `Win`/`Alt` + `↑` `↓` | Maximise / minimise |
| `Win`/`Alt` + `←` `→` | Snap left / right |
| `Win`/`Alt` + `1…7` | Jump to taskbar slot |
| `Ctrl` + `Shift` + `X` / `T` | Cascade / tile |
| `Alt` + `F4` | Close focused window |
| `↑↑↓↓←→←→BA` | Easter egg |

### Theming

Two glass tokens, because the wallpaper is bright and saturated:

- `--glass-*` — light Aero glass, used by shell chrome.
- `--surface-*` — dark scrim, used by window interiors and the cards inside
  them. Light-on-light glass made body copy unreadable.

Accent colour, glass intensity, animations, sound and volume are all live in
Settings and persisted.

## Notes

- No audio files: system sounds are generated with the Web Audio API, so there
  is nothing to download and no 404s.
- `prefers-reduced-motion` and `prefers-contrast` are respected, and reduced
  motion also disables the globe animation and terminal typing.
- Windows are intentionally **not** persisted — a reload gives a clean desktop.
  Icon positions, wallpaper, sidebar and theme are persisted.
- `public/unity_project.mp4` is ~28 MB. It is `preload="metadata"`, but
  re-encoding it to a smaller bitrate would be worth doing before launch.
