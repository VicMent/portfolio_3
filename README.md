# Vic Menten — Development Portfolio

A personal portfolio site for **Vic Menten**, an IT graduate (Bachelor in Applied IT / Digital Experience, UCLL) with a one-year specialization in Indie Game Development (Syntra). The site leads with web development, followed by game development in Godot, Unreal Engine 5 and Unity. It is built as a full-screen, section-by-section scrolling experience with an animated background.

It is a static site: plain HTML, CSS and vanilla JavaScript (ES modules), with no build step and no framework.

---

## Highlights

- **Background animation driven by scrolling.** A 170-frame WebP sequence is drawn to a full-screen `<canvas>`. The scroll position always picks the frame, so the animation follows the page however you scroll. There are two sets: `frames/lg/` (1536 px, about 4.7 MB) for larger screens and `frames/sm/` (768 px, about 2 MB) for phones.
- **Fast start.** The loader waits only for the frames of the first transition (about 30 frames). The rest stream in afterwards in the background. Any frame that hasn't arrived yet is replaced by the nearest loaded one.
- **Section snapping on desktop.** No library. Each wheel or trackpad swipe, PageUp/PageDown/Space/arrow press, or nav click moves exactly one section. If a section is taller than the screen, you scroll through it normally first, and scrolling back up lands on its bottom edge. Phones and touch devices use normal scrolling.
- **Infinite media carousels.** Each project section has two rows of tiles moving in opposite directions, built from a data list (`CAROUSEL_DATA` in `js/app.js`). A section can split its items over the rows automatically or give each row its own list (the More Game Development section puts one project in each row). A row pauses while you hover it.
- **Lazy, smart video.** Video sources are only attached when a carousel gets close to the screen. Only the most visible clip in each row plays, and the clip you hover always wins.
- **Micro-interactions.** Magnetic buttons, 3D tilt on the glass cards, letter-by-letter headings, a sliding nav indicator and a scroll progress bar. Made with [anime.js](https://animejs.com/), and only active with a mouse.
- **Accessibility.** `prefers-reduced-motion` turns off autoplay, carousels and effects. The heading animations keep the plain text available to screen readers. The site also has keyboard navigation, `aria-current` on the active nav link, and a mobile menu that closes with `Escape`.

## Page sections

| # | Section | Content |
|---|---------|---------|
| 1 | **Hero** | Name, tagline, buttons to the work and the games |
| 2 | **About & Skills** | Background, education (UCLL, Syntra), skill list (languages, software dev, game engines, 3D pipeline), the roles Vic is looking for |
| 3 | **Web Development** (main focus) | Client websites, web games, a Three.js 3D model viewer, earlier portfolio versions |
| 4 | **Gruboom** (Godot 4) | Current project: turn-based artillery game with destructible terrain, AI opponents and online play. [itch.io](https://vic-ment.itch.io/gruboom) |
| 5 | **Totally Ethical Labs** (Unreal Engine 5) | One-week game jam game (2026). Vic did the programming. [itch.io](https://vic-ment.itch.io/totally-ethical-labs) |
| 6 | **More Game Development** | Top row: Roid Rager, a retro FPS in UE5 (on hold). Bottom row: procedural voxel terrain in Unity (school project) |
| 7 | **Contact** | Email, LinkedIn, GitHub, itch.io |

## Tech stack

- **HTML5 / CSS3.** Custom properties, glassmorphism cards, noise overlay, responsive layout. Fonts are Syne and Inter from Google Fonts.
- **Vanilla JavaScript (ES modules).** Everything is in `js/app.js`.
- **anime.js 3.2.2**, loaded from cdnjs.
- **Canvas 2D** for the frame-sequence background.
- **`serve`** (through `npx`) for local development.

## Project structure

```
.
├── index.html            # Main one-page portfolio
├── favicon.svg
├── og-image.jpg          # Social preview image (LinkedIn, Discord, ...)
├── css/
│   └── style.css         # Site styles
├── js/
│   └── app.js            # FrameAnimation, AutoplayClips, carousels, PortfolioApp
├── frames/
│   ├── lg/               # 170 background frames, 1536 px WebP
│   └── sm/               # Same frames at 768 px for phones
├── extra_images/         # Project screenshots (WebP), videos (720p H.264) + posters, logos
│   └── gruboom/          # Gruboom screenshots and logo (from the game's promo folder)
└── package.json          # start/dev scripts
```

The full-quality source files (original PNG frames, original videos and screenshots) are kept outside the repo, in `../portfolio-originals/`.

### How `js/app.js` is organized

| Part | Responsibility |
|------|----------------|
| `FrameAnimation` | Loads the frames progressively and draws them to the canvas: "cover" on landscape screens, a wide band on portrait screens. Eases toward the target frame. |
| `AutoplayClips` | Attaches video sources lazily and decides which carousel videos play, based on visibility and hover |
| `CAROUSEL_DATA` + `buildMarqueeTrack()` | Data-driven carousels. To add a project image or video, add one entry. |
| `PortfolioApp` | Entry point: loader, mapping scroll position to frames, desktop snapping, nav state, mobile menu, reveals and pointer effects |

## Running locally

Requires [Node.js](https://nodejs.org/) (only for `npx serve`).

```bash
npm start
```

Then open <http://localhost:3000>.

A local server is needed because `app.js` is loaded as an ES module and the frames are loaded with `fetch`/`Image`. Opening `index.html` directly from the file system will not work reliably. Any static file server works instead, for example `python -m http.server 3000`.

## Adding a project to a carousel

Open `js/app.js`, find the right block in `CAROUSEL_DATA`, and add an entry:

```js
{ kind: 'img',   src: 'extra_images/my-shot.png', alt: 'Description' },
{ kind: 'video', src: 'extra_images/my-clip.mp4', poster: 'extra_images/my-clip-poster.jpg', alt: 'Description' },
```

Spaces in file names must be URL-encoded (`%20`). To keep the site fast, convert new media before adding it:

```bash
# Screenshot -> WebP (max 1280 px wide)
magick "shot.png" -resize "1280x>" -quality 78 "shot.webp"

# Clip -> 720p H.264, no audio, plus a poster from the first frame
ffmpeg -i clip.mov -an -vf "scale='min(1280,iw)':-2,fps=30" -c:v libx264 -preset slow -crf 28 -pix_fmt yuv420p -movflags +faststart clip.mp4
ffmpeg -i clip.mp4 -frames:v 1 -q:v 4 clip-poster.webp
```

## Deployment

The site has no build step, so it can be hosted on any static host (GitHub Pages, Netlify, Vercel, Cloudflare Pages). Upload the repository root with `index.html` at the top level.

## Notes

- `og:image` in `index.html` is a relative path. Once the site has its own domain, change it to an absolute URL (and add `og:url`) so LinkedIn and other sites pick up the preview image.
- Old media and build leftovers were removed from the working tree. They are still in the git history, so the `.git` folder stays large unless that history is rewritten.

## Links

- itch.io — <https://vic-ment.itch.io>
- LinkedIn — <https://www.linkedin.com/in/vicmenten>
- GitHub — <https://github.com/VicMent>

---

© 2026 Vic Menten · Herselt, Belgium
