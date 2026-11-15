# Vic Menten - Portfolio

My personal portfolio site. Plain HTML, CSS and JavaScript, no framework and no build step.

The background is a 170-frame image sequence drawn on a canvas, and the frame follows the scroll position. On desktop the page snaps from section to section; on phones it scrolls normally. Each project has a two-row media carousel, and videos only load once they get close to the screen.

## Sections

1. Hero
2. About & Skills
3. Web Development
4. Gruboom (Godot 4) - [itch.io](https://vic-ment.itch.io/gruboom)
5. Totally Ethical Labs (UE5 game jam) - [itch.io](https://vic-ment.itch.io/totally-ethical-labs)
6. More Game Development (Roid Rager, Unity voxel terrain)
7. Contact

## Structure

```
index.html
css/style.css
js/app.js          background animation, carousels, scrolling, nav
frames/lg, sm/     background frames (1536px and 768px WebP)
extra_images/      screenshots, videos and logos
```

## Running it

```bash
npm start
```

Then open http://localhost:3000. It needs a local server because `app.js` is an ES module; `python -m http.server 3000` works too.

## Adding media

Carousel items live in `CAROUSEL_DATA` in `js/app.js`:

```js
{ kind: 'img', src: 'extra_images/shot.webp', alt: 'Description' },
{ kind: 'video', src: 'extra_images/clip.mp4', poster: 'extra_images/clip-poster.webp', alt: 'Description' },
```

I convert media before adding it:

```bash
magick "shot.png" -resize "1280x>" -quality 78 "shot.webp"
ffmpeg -i clip.mov -an -vf "scale='min(1280,iw)':-2,fps=30" -c:v libx264 -preset slow -crf 28 -pix_fmt yuv420p -movflags +faststart clip.mp4
ffmpeg -i clip.mp4 -frames:v 1 -q:v 4 clip-poster.webp
```

## Links

- itch.io: https://vic-ment.itch.io
- LinkedIn: https://www.linkedin.com/in/vicmenten
- GitHub: https://github.com/VicMent
