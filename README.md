# Math Drill

A small web app for kids to practice addition, subtraction, multiplication and
division, and to print worksheets. It is plain HTML, CSS and JavaScript with no
build step, hosted on GitHub Pages.

## Features

- **Drills**: 10, 20, 30 or 50 problems at a time, answered with a big on-screen
  number pad (or the keyboard). Wrong answers show the right answer; the
  results screen lists misses and can re-drill just those.
- **Operations and levels**: pick any mix of +, −, ×, ÷. Each has K–5 levels
  (from "sums to 10" up to 4-digit problems, times tables to 5/10/12, long
  division) plus custom number ranges. Subtraction never goes negative;
  division divides evenly unless "Allow remainders" is on.
- **Problem styles**: across (`7 + 5 = ?`), stacked (column / long-division
  layout) and missing number (`7 + ? = 12`). Pick several to mix them.
- **Worksheets**: same settings, printable from the browser (or "Save as PDF"),
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
- `js/worksheet.js` – worksheet layout
- `js/main.js` – setup screen and wiring
