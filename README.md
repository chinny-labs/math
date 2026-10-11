# Math Drill

A small web app for kids to practice addition, subtraction, multiplication and
division, and to print worksheets. It is plain HTML, CSS and JavaScript with no
build step, hosted on GitHub Pages.

**Open the app: <https://chinny.github.io/math/>**

## Features

- **Drills**: 10, 20, 30 or 50 problems at a time, answered with a big on-screen
  number pad (or the keyboard). Wrong answers show the right answer; the
  results screen lists misses and can re-drill just those.
- **Sounds**: a chime for right answers, a soft "uh-oh" for misses and a short
  tune at the end, made in the browser (no audio files). The speaker button in
  the drill bar turns them off.
- **Operations and levels**: pick any mix of +, −, ×, ÷. Each has K–5 levels
  (from "sums to 10" up to 4-digit problems, times tables to 5/10/12, long
  division) plus custom number ranges. Subtraction never goes negative;
  division divides evenly unless "Allow remainders" is on.
- **Problem styles**: across (`7 + 5 = ?`), stacked (column / long-division
  layout) and missing number (`7 + ? = 12`). Pick several to mix them.
- **Worksheets**: same operations, with their own choice of problem styles; printable from the browser (or "Save as PDF"),
  with optional name/date lines and an answer key on a separate page.
- Settings are remembered in the browser on each device. No accounts, no server.

## Keyboard

Digits to type, Enter to check (and to go on after a miss), Backspace to
delete, R / Tab / Space to switch to the remainder box, Esc to stop.

## Running locally

The app uses JavaScript modules, so serve it rather than opening the file:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

## Layout

- `index.html` – all screens
- `css/style.css` – styles, including print styles for worksheets
- `js/generator.js` – problem generation and checking (no DOM)
- `js/settings.js` – defaults and saving settings
- `js/render.js` – problem layouts shared by drills and worksheets
- `js/drill.js` – the drill screen
- `js/sounds.js` – sound effects
- `js/worksheet.js` – worksheet layout
- `js/main.js` – setup screen and wiring
