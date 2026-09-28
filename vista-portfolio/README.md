# Vic Menten — Vista Desktop Portfolio

An interactive Windows Vista desktop environment used as a portfolio. Every
section of the CV is an application window you can drag, resize, minimise,
maximise, tile, cascade and switch between with Flip 3D.

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production build into dist/
npm run test     # build, then drive it headlessly in Chromium (20 checks)
npm run shots    # write screenshots of every view to shots/
```

`npm run build` runs `tsc -b` first, so a type error fails the build rather
than shipping. The smoke test fails on any console error, page error or
failed request, and asserts that drag, resize, search, minimise/restore,
reload, the mobile drawer, the light theme, shutdown/power-on and the
screensaver all actually work.

### Media pipeline

Source media is large, so `npm run build` does **not** re-encode. To regenerate
after changing assets:

```bash
powershell -ExecutionPolicy Bypass -File tools/prepare-media.ps1
node tools/generate-images.mjs   # OG image + PWA icons as real PNGs
node tools/fetch-fonts.mjs        # self-host Inter + Syne (2 woff2 files)
```

## Architecture

```
src/
├─ App.tsx                  boot, window host, lazy loading, error boundaries
├─ data/
│  ├─ appMeta.ts            pure app metadata (no React — breaks an import cycle)
│  ├─ apps.ts               metadata + lazily-loaded component wiring
│  └─ portfolio.ts          all content, fully typed
├─ stores/
│  ├─ windowStore.ts        windows, z-order, placement, snapping, tiling
│  ├─ desktopStore.ts       icon positions, wallpaper, sidebar
│  └─ themeStore.ts         scheme, accent, glass, motion, sound (persisted)
├─ components/
│  ├─ windows/              BaseWindow + one component per app
│  ├─ shell/                Desktop, Taskbar, StartMenu, Sidebar, Flip3D,
│  │                        AppDrawer, Screensaver, ShutdownScreen
│  ├─ vista/                WindowChrome, brand icons, error boundaries
│  └─ magicui/              NumberTicker, CodeBlock, AnimatedBeam, RetroGrid,
│                           Lightbox, AnimatedCircularProgress, BlurText,
│                           Marquee, Terminal, Globe, BentoGrid, AuroraText
└─ utils/sound.ts           system sounds synthesised with the Web Audio API
```

### Opening a window

`data/appMeta.ts` is the single source of truth. Adding an app means adding one
entry there and one component — no 12-field config object at every call site:

```ts
openWindow('about');
```

The heavier windows are `React.lazy`, so their code only downloads when opened.

### Window management

- Drag and resize are **pointer-event based** and mutate the DOM directly during
  the gesture, then commit to the store on release. This keeps dragging on the
  compositor instead of re-rendering the window's contents on every mouse move.
- Eight resize handles, with min-size compensation on the west/north edges.
- Open, close and **fly-to-taskbar minimise** animations run on framer-motion;
  `BaseWindow` measures the window's taskbar button via `data-taskbar-item` to
  aim the animation. Honours `prefers-reduced-motion`.
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
| `↑↑↓↓←→←→BA` | Easter egg (opens Roid Rager) |

### Theming

Two glass tokens, because the wallpaper is bright and saturated:

- `--glass-*` — light Aero glass, used by shell chrome.
- `--surface-*` — opaque scrim, used by window interiors and the cards inside
  them. Light-on-light glass made body copy unreadable.

**Aero Light** (tray toggle) is the classic Vista light frame: light window
surfaces with dark text, driven by the same semantic tokens
(`--text-primary/secondary/muted`) plus deeper `--aurora-*` gradient stops.

Accent colour, glass intensity, animations, sound and volume are all live in
Settings and persisted.

### The turntable

`public/animation_backup` held 170 PNGs of a 3D turntable render of the Roid
Rager alien (~255 MB). `tools/prepare-media.ps1` encodes them into a single
1.1 MB looping WebM (with an H.264 fallback) at 12 fps for a slow spin. It is
used in two places:

- **Idle screensaver** — after 45 s with no windows open. `?idle=<seconds>`
  overrides the delay so you can preview it.
- **Roid Rager ▸ Model turntable** — a tab in that window, clickable for a
  full-screen lightbox.

## Media budget

| Asset | Before | After |
|-------|-------:|------:|
| `unity_project.mp4` | 28.2 MB | 3.0 MB |
| `website.mp4` | 13.4 MB | 1.7 MB |
| `RoidRager4.mp4` | 9.5 MB | 0.6 MB |
| `RoidRager3.mp4` | 8.2 MB | 0.4 MB |
| turntable loop | 9.6 MB | 1.1 MB |
| **total shipped** | **~59 MB** | **~7.9 MB** |

All videos are `preload="metadata"` with poster frames, so nothing streams
until a window is actually opened.

## Notes

- No audio files: system sounds are generated with the Web Audio API.
- `prefers-reduced-motion` and `prefers-contrast` are respected; reduced motion
  also disables the globe, the terminal typing and window animations.
- Windows are intentionally **not** persisted — a reload gives a clean desktop.
  Icon positions, wallpaper, sidebar and theme are persisted.
- Deep links work: `/?app=resume` opens straight into the Résumé.
- Social previews and PWA icons are generated as real PNGs; most platforms
  refuse SVG previews.
